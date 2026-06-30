import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Set up larger limits for base64 image uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize Gemini Client Lazily/Safely
let aiClient: any = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || "";
    if (!key || key === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY is not configured or has default placeholder value. Falling back to simulated AI mode.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// ━━━ API ROUTES ━━━

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Route 1: Image Analysis
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { image } = req.body; // Expect base64 data URL: "data:image/jpeg;base64,..."
    if (!image) {
      return res.status(400).json({ error: "Missing image data in request" });
    }

    const ai = getAIClient();
    if (!ai) {
      // Return simulated mock AI analysis if API key is not configured
      console.log("Using simulated AI analysis due to missing API Key");
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay
      return res.json(getSimulatedAnalysisResult());
    }

    // Parse base64 data URL
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Invalid image format. Must be a base64 Data URL." });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const prompt = `Analyze this image of a civic/infrastructure issue. Return a JSON object with these fields:
    - issueType (string, must be one of: "Pothole", "Water Leak", "Broken Streetlight", "Garbage Dump", "Damaged Road", "Drainage Issue", "Fallen Tree", "Open Manhole", "Illegal Construction", "Other")
    - severity (number from 1 to 10)
    - severityLabel (string, must be one of: "Low", "Medium", "High", "Critical")
    - title (short, punchy, descriptive title for the civic report, e.g., "Deep Pothole near Central Mall")
    - description (2-3 sentences explaining what you see, the direct civic impact, and safety implications)
    - estimatedDimensions (string representing approximate dimensions, e.g., "1.2m x 0.8m, 15cm deep" or "N/A")
    - safetyRisk (string, must be one of: "Low", "Medium", "High")
    - affectedArea (string explaining who/what is affected, e.g., "Pedestrians and two-wheeler traffic on main avenue")
    - recommendedDepartment (string, the municipal department that handles this, e.g., "Roads & Highways Department", "Electrical & Streetlights Division", "Solid Waste Management", "Water Supply & Sewerage Board")
    - urgencyReason (string, 1 clear sentence explaining why it requires this specific level of priority)

    Return ONLY a single valid JSON object. Do not include any markdown styling like \`\`\`json or backticks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "";
    console.log("Raw Gemini Response:", responseText);

    try {
      const parsedData = JSON.parse(responseText.trim());
      return res.json(parsedData);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON, attempting sanitization. Raw content was:", responseText);
      // Clean potential backticks markdown
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleaned);
      return res.json(parsedData);
    }

  } catch (error: any) {
    console.error("Error analyzing image via Gemini API:", error);
    // Fall back to simulated data instead of crashing
    return res.status(200).json(getSimulatedAnalysisResult(error.message));
  }
});

// Route 2: Chatbot Agent
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const ai = getAIClient();
    if (!ai) {
      // Return simple mock chat response
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const lastUserMsg = messages[messages.length - 1]?.content || "";
      return res.json({
        content: getSimulatedChatResponse(lastUserMsg)
      });
    }

    // Map messages to Gemini Content Format
    // Format: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const systemInstruction = `You are NagarNetra AI Assistant, a helpful, professional, and knowledgeable civic assistant for the NagarNetra community platform in Pune, India. 
    You help citizens understand civic issues in their area, explain report statuses, suggest how to submit effective reports, and provide detailed information about municipal departments and local infrastructure.
    Be friendly, direct, concise, and structured. Use Markdown (bullet points, bold text) where appropriate. 
    If asked about specific issues, reference the community's recent reports (such as potholes on MG Road, water leakages in Kothrud, broken streetlights in Viman Nagar, or garbage dumping in Hadapsar).
    Always encourage citizens to take action, verify other reports, and collaborate with municipal departments to build a safer and cleaner city.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    return res.json({
      content: response.text || "I apologize, I could not process that request."
    });

  } catch (error: any) {
    console.error("Error in AI Assistant chat:", error);
    return res.json({
      content: `I'm currently running in local standby mode due to an API challenge. However, I can still tell you that NagarNetra is monitoring major areas like **Viman Nagar**, **Kothrud**, and **Kalyani Nagar**! Feel free to report any local potholes, water leaks, or broken streetlights, and I'll make sure they are tracked in our local database.`
    });
  }
});

// Route 3: Predict Civic Issues using mock data analytics via Gemini
app.post("/api/generate-predictions-report", async (req, res) => {
  try {
    const ai = getAIClient();
    const systemPrompt = `You are a Municipal Data Analyst for NagarNetra Civic Platform in Pune. Generate a professional summary of future civic risks for the upcoming week based on historical trends. Summarize the critical hotspots, predicted failure points, and preventative recommendations. Keep it under 150 words with clear bold headers.`;
    
    if (!ai) {
      return res.json({
        report: `### Civic Risk Predictions (Standby Mode)
        **1. Waterlogging Vulnerability (High):** Sector 14 & Baner Road are predicted to experience severe drainage backups if rainfall exceeds 25mm.
        **2. Waste Overflows (Medium):** Market yard & FC Road are expected to witness a 40% spike in municipal solid waste due to seasonal weekend footfall.
        **3. Power/Grid Stress (Low):** Viman Nagar streetlights are stable following recent repairs, but older fixtures in Ward 7 require secondary inspection.`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Analyze Pune municipal infrastructure data and generate a brief predicted issue outlook report.",
      config: {
        systemInstruction: systemPrompt
      }
    });

    return res.json({
      report: response.text || "Weekly prediction report currently unavailable."
    });
  } catch (err) {
    return res.json({
      report: "Weekly predictive analysis currently loaded in offline fallback state."
    });
  }
});


// Helper functions for simulations when API Key is missing or errored
function getSimulatedAnalysisResult(reason?: string) {
  const simulatedTypes = [
    {
      issueType: "Pothole",
      severity: 8,
      severityLabel: "Critical",
      title: "Dangerous Pothole on Main Carriage-way",
      description: "A wide, deep pothole is active in the middle of the driving lane. Vehicles are braking abruptly or swerving into oncoming traffic to avoid it, presenting an immediate safety hazard.",
      estimatedDimensions: "0.9m wide x 1.2m long x 18cm deep",
      safetyRisk: "High",
      affectedArea: "Commuters, particularly two-wheelers and auto-rickshaws traversing the main road.",
      recommendedDepartment: "Roads & Highways Department",
      urgencyReason: "Critical road hazard situated on a heavy transit route that could trigger serious accidents during nighttime hours."
    },
    {
      issueType: "Water Leak",
      severity: 6,
      severityLabel: "High",
      title: "Ruptured Water Main Pipeline",
      description: "Clean drinking water is spraying continuously from a cracked joint in the secondary distribution pipe. Water is flooding the adjacent footpath and starting to gather on the road shoulder.",
      estimatedDimensions: "Leak radius approx. 1.5m",
      safetyRisk: "Medium",
      affectedArea: "Local residents experiencing reduced water supply pressure; pedestrians unable to use flooded walkway.",
      recommendedDepartment: "Water Supply & Sewerage Board",
      urgencyReason: "Heavy wastage of treated municipal drinking water coupled with potential road structural erosion."
    },
    {
      issueType: "Garbage Dump",
      severity: 7,
      severityLabel: "High",
      title: "Illegal Waste Dump & Overflowing Bin",
      description: "A collection point has overflowed completely with solid household waste, plastic bags, and discarded materials. Stray dogs are scattering the garbage, and it is beginning to emit a pungent smell.",
      estimatedDimensions: "Approx 4m x 2m pile on sidewalk",
      safetyRisk: "Medium",
      affectedArea: "Pedestrians, neighboring shopkeepers, and local sanitation workers.",
      recommendedDepartment: "Solid Waste Management",
      urgencyReason: "Poses a significant health, sanitation, and environmental hazard to the nearby commercial area."
    }
  ];

  // Pick a random one
  const randomIndex = Math.floor(Math.random() * simulatedTypes.length);
  const result = simulatedTypes[randomIndex];
  if (reason) {
    result.description += ` (Note: Gemini API key error, returned simulated data. Debug Info: ${reason})`;
  }
  return result;
}

function getSimulatedChatResponse(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("pothole") || msg.includes("road")) {
    return `### NagarNetra Civic Insights: Roads & Potholes
    We currently have **8 active pothole reports** logged across Pune:
    - **MG Road (Camp):** 3 reports (1 Critical, 2 High severity).
    - **Viman Nagar (Near Phoenix):** 2 reports (Assigned to department).
    - **Kothrud (DP Road):** 3 reports (1 Resolved, 2 Verified).

    **What you can do:**
    You can go to the **Community Feed** or **Issues Map** to upvote/verify these reports. Verifications speed up the process by immediately notifying ward engineers!`;
  } else if (msg.includes("water") || msg.includes("leak") || msg.includes("drain")) {
    return `### NagarNetra Civic Insights: Water & Drainage Issues
    Our database shows **4 active water leakage reports** in the system:
    1. **Senapati Bapat Road:** Water main rupture (Status: *In Progress* - repair crew on site).
    2. **Kalyani Nagar (Lane 7):** Open manhole and minor leak (Status: *Verified*).
    3. **Hadapsar:** Drainage water backflow (Status: *Reported*).

    If you spot any fresh leaks, please head to the **Report Issue** tab and take a picture. Our AI will automatically categorize it for the **Water Supply & Sewerage Board**!`;
  } else if (msg.includes("verify") || msg.includes("points") || msg.includes("points") || msg.includes("badge")) {
    return `### NagarNetra Gamification & Verifications
    Great question! Verification is how our community guarantees report legitimacy.
    
    **How it works:**
    1. Go to the **Community Feed** or click an issue marker on the **Issues Map**.
    2. If you are physically near the issue or know it exists, click **Verify**.
    3. Each verification earns you **5 Points**!
    4. Filing a new report earns you **15 Points**.
    5. Once verified by 3 citizens, the status automatically moves from **Reported** to **Verified**, which triggers a direct dashboard alert for Ward Officers.

    Check your personal achievements under the **Leaderboard** tab!`;
  } else {
    return `Hello! I am your **NagarNetra AI Assistant**. 

    I can help you monitor and manage infrastructure quality in your neighborhood. Here is what you can ask me:
    - *"What are the most urgent potholes reported nearby?"*
    - *"How do I earn the Ward Champion badge?"*
    - *"Tell me about water leaks in Kothrud."*
    - *"Who handles waste dumping reports?"*

    Feel free to upload an issue photo in the **Report Issue** tab to get started!`;
  }
}

// Vite and static files setup
async function startServer() {
  // Vite dev server middleware integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist directory.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NagarNetra server running on http://localhost:${PORT}`);
  });
}

startServer();
