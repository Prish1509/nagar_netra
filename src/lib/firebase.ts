import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, addDoc, query, orderBy, limit, increment, arrayUnion } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
let app;
let db: any;
let auth: any;
let isFirebaseAvailable = false;

try {
  if (firebaseConfig && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = firebaseConfig.firestoreDatabaseId 
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    auth = getAuth(app);
    isFirebaseAvailable = true;
    console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);
  } else {
    console.warn("Firebase configuration was invalid. Running in offline fallback mode.");
  }
} catch (error) {
  console.error("Firebase initialization failed. Running in offline fallback mode:", error);
}

export { db, auth, isFirebaseAvailable };

// Default user data for simulation
export const DEFAULT_MEMBER = {
  id: "prisha_netra_user",
  name: "Prisha Italiya",
  email: "prishaitaliya@gmail.com",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
  points: 345,
  badges: ["First Step", "Eagle Eye", "Neighborhood Guardian", "AI Ally"],
  reportCount: 12,
  verificationCount: 28,
  trustScore: 98,
  joinedAt: "2026-01-15T08:30:00Z"
};

// 15 Realistic Sample Reports in Pune, India
export const PUNE_SAMPLE_REPORTS = [
  {
    id: "pune_rep_1",
    userId: "user_suresh",
    userName: "Suresh Kumar",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    userBadge: "Ward Champion",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600", // Pothole
    title: "Massive Crater Pothole on main lane",
    description: "Extremely deep and wide pothole in the middle of DP Road near Kothrud. Vehicles are swerving into oncoming traffic to dodge it. Highly dangerous for two-wheelers at night.",
    issueType: "Pothole",
    severity: 9,
    severityLabel: "Critical",
    latitude: 18.5074,
    longitude: 73.8077,
    address: "DP Road, Near Karishma Society, Kothrud, Pune, Maharashtra 411038",
    status: "Verified",
    verificationCount: 14,
    verifiedBy: ["prisha_netra_user", "user_anil", "user_priya"],
    department: "Roads & Highways Department",
    estimatedDimensions: "1.5m wide, 20cm deep",
    safetyRisk: "High",
    affectedArea: "DP Road commuters, especially night travellers and motorcyclists.",
    urgencyReason: "Heavy multi-lane traffic swerving unpredictably, high probability of physical damage or falls.",
    createdAt: "2026-06-22T14:30:00Z",
    updatedAt: "2026-06-22T16:00:00Z"
  },
  {
    id: "pune_rep_2",
    userId: "user_priya",
    userName: "Priya Sharma",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    userBadge: "Neighborhood Guardian",
    imageUrl: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?auto=format&fit=crop&q=80&w=600", // Water Leak
    title: "Water Mains Leakage Flooding Sidewalk",
    description: "Drinking water pipeline has fractured. Water is gushing out under pressure and flooding the adjacent public path, eroding the tiles and causing water stagnation.",
    issueType: "Water Leak",
    severity: 6,
    severityLabel: "High",
    latitude: 18.5626,
    longitude: 73.9168,
    address: "Samrat Ashok Road, Near Jogger's Park, Viman Nagar, Pune, Maharashtra 411014",
    status: "In Progress",
    verificationCount: 8,
    verifiedBy: ["user_suresh", "user_anil"],
    department: "Water Supply & Sewerage Board",
    estimatedDimensions: "Continuous spray over 2 meters",
    safetyRisk: "Medium",
    affectedArea: "Local sector residents experiencing low pressure, pedestrian bypassers.",
    urgencyReason: "Thousands of liters of drinking water wasted; sidewalk pavers starting to sink.",
    createdAt: "2026-06-21T09:15:00Z",
    updatedAt: "2026-06-22T10:00:00Z"
  },
  {
    id: "pune_rep_3",
    userId: "user_anil",
    userName: "Anil Deshmukh",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    userBadge: "Eagle Eye",
    imageUrl: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&q=80&w=600", // Garbage Dump
    title: "Illegal Trash Dumping in Residential Zone",
    description: "A pile of mixed commercial and residential garbage has been dumped on the roadside. It has started rotting, attracting stray animals, and completely blocks the footwalk.",
    issueType: "Garbage Dump",
    severity: 7,
    severityLabel: "High",
    latitude: 18.5204,
    longitude: 73.8567,
    address: "FC Road, Near Ferguson College Main Gate, Shivajinagar, Pune, Maharashtra 411004",
    status: "Assigned",
    verificationCount: 11,
    verifiedBy: ["prisha_netra_user", "user_priya"],
    department: "Solid Waste Management",
    estimatedDimensions: "4m x 3m waste pile",
    safetyRisk: "Medium",
    affectedArea: "Students, shoppers, and local commercial establishments facing foul odor and health hazards.",
    urgencyReason: "Decomposing biological waste in heavy pedestrian zone attracting stray dogs and flies.",
    createdAt: "2026-06-20T17:45:00Z",
    updatedAt: "2026-06-21T11:30:00Z"
  },
  {
    id: "pune_rep_4",
    userId: "user_amit",
    userName: "Amit Joshi",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
    userBadge: "First Step",
    imageUrl: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=600", // Broken streetlight
    title: "Entire Block of Streetlights Non-functional",
    description: "Three consecutive streetlights on Lane 5 are dark. The entire residential lane is pitch black after 7 PM, creating a major security concern for walking residents.",
    issueType: "Broken Streetlight",
    severity: 5,
    severityLabel: "Medium",
    latitude: 18.5362,
    longitude: 73.8940,
    address: "Lane 5, Kalyani Nagar, Pune, Maharashtra 411006",
    status: "Reported",
    verificationCount: 4,
    verifiedBy: ["user_suresh"],
    department: "Electrical & Streetlights Division",
    estimatedDimensions: "150m stretch of road in darkness",
    safetyRisk: "High",
    affectedArea: "Local residents, evening walkers, and parked vehicles vulnerable to theft.",
    urgencyReason: "Lack of lighting poses safety and security threat, especially to women and senior citizens.",
    createdAt: "2026-06-23T06:40:00Z",
    updatedAt: "2026-06-23T06:40:00Z"
  },
  {
    id: "pune_rep_5",
    userId: "user_suresh",
    userName: "Suresh Kumar",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    userBadge: "Ward Champion",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600", // Damaged road
    title: "Severe Road Surface Damage & Loose Gravel",
    description: "Top layer of the tarmac has peeled off completely, leaving sharp loose stones and a corrugated surface. Vehicles lose traction when braking on this slope.",
    issueType: "Damaged Road",
    severity: 8,
    severityLabel: "Critical",
    latitude: 18.5590,
    longitude: 73.7797,
    address: "Baner Road, Near Prabhat Dairy, Baner, Pune, Maharashtra 411045",
    status: "Resolved",
    verificationCount: 22,
    verifiedBy: ["prisha_netra_user", "user_anil", "user_amit"],
    department: "Roads & Highways Department",
    estimatedDimensions: "15m stretch of damaged tarmac",
    safetyRisk: "High",
    affectedArea: "Heavy traffic on Baner Road, especially two-wheelers skidding on loose gravel.",
    urgencyReason: "Highly hazardous slope on a major commuter highway; frequent skidding reports.",
    createdAt: "2026-06-18T11:20:00Z",
    updatedAt: "2026-06-22T17:00:00Z"
  },
  {
    id: "pune_rep_6",
    userId: "user_priya",
    userName: "Priya Sharma",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    userBadge: "Neighborhood Guardian",
    imageUrl: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&q=80&w=600", // Drainage
    title: "Clogged Drainage Causing Sewage Backflow",
    description: "The storm-water drain has choked on plastic cups and silt. Sewage is overflowing onto the service road, generating an unbearable stink and blocking access to commercial shops.",
    issueType: "Drainage Issue",
    severity: 8,
    severityLabel: "Critical",
    latitude: 18.5089,
    longitude: 73.9259,
    address: "Solapur Road, Near Hadapsar Flyover, Hadapsar, Pune, Maharashtra 411028",
    status: "In Progress",
    verificationCount: 9,
    verifiedBy: ["user_anil"],
    department: "Water Supply & Sewerage Board",
    estimatedDimensions: "Choked inlet, 10m pool of stinking water",
    safetyRisk: "High",
    affectedArea: "Local shopkeepers, shoppers, and pedestrians navigating the service road.",
    urgencyReason: "Health hazard due to active raw sewage exposure in a highly populated marketplace.",
    createdAt: "2026-06-21T15:10:00Z",
    updatedAt: "2026-06-22T11:00:00Z"
  },
  {
    id: "pune_rep_7",
    userId: "user_amit",
    userName: "Amit Joshi",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
    userBadge: "First Step",
    imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=600", // Fallen tree
    title: "Large Tree Branch Blocking Left Lane",
    description: "A huge banyan tree branch cracked during yesterday's high winds and fell right onto the left lane of the main road. It is blocking visibility and forces cars to make sudden lane changes.",
    issueType: "Fallen Tree",
    severity: 7,
    severityLabel: "High",
    latitude: 18.5284,
    longitude: 73.8744,
    address: "Bund Garden Road, Near Pune Central Mall, Pune, Maharashtra 411001",
    status: "Verified",
    verificationCount: 6,
    verifiedBy: ["user_suresh", "user_priya"],
    department: "Solid Waste Management", // Garden dept, but Solid waste/sanitation clears obstacles too
    estimatedDimensions: "Branch length approx. 6 meters",
    safetyRisk: "High",
    affectedArea: "Bund garden traffic, particularly fast moving cars.",
    urgencyReason: "Creates blind spots at the turn; could cause head-on collisions as cars dodge the branch.",
    createdAt: "2026-06-22T21:00:00Z",
    updatedAt: "2026-06-23T08:00:00Z"
  },
  {
    id: "pune_rep_8",
    userId: "user_rahul",
    userName: "Rahul Verma",
    userAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150",
    userBadge: "Neighborhood Guardian",
    imageUrl: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=600", // Open manhole
    title: "Hazardous Open Manhole on Main Market Road",
    description: "A deep storm-water manhole is missing its concrete cover. It is completely exposed. Locals have placed a tree branch inside to warn people, but it remains a lethal trap.",
    issueType: "Open Manhole",
    severity: 10,
    severityLabel: "Critical",
    latitude: 18.4965,
    longitude: 73.8546,
    address: "Laxmi Road, Opposite City Post, Budhwar Peth, Pune, Maharashtra 411002",
    status: "Reported",
    verificationCount: 19,
    verifiedBy: ["prisha_netra_user", "user_anil", "user_suresh", "user_priya"],
    department: "Roads & Highways Department",
    estimatedDimensions: "Diameter 1m, Depth 3m",
    safetyRisk: "High",
    affectedArea: "Crowded Laxmi Road shopping crowd, especially children and senior citizens.",
    urgencyReason: "Extremely busy pedestrian street; falling into a 3-meter open sewer could be fatal.",
    createdAt: "2026-06-23T08:15:00Z",
    updatedAt: "2026-06-23T08:15:00Z"
  },
  {
    id: "prisha_rep_1",
    userId: "prisha_netra_user",
    userName: "Prisha Italiya",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    userBadge: "AI Ally",
    imageUrl: "https://images.unsplash.com/photo-1584824486516-0555a07c5386?auto=format&fit=crop&q=80&w=600", // Water leak
    title: "Minor Leak in Public Water Tap",
    description: "The public drinking water tap at the garden has a damaged washer, causing it to drip continuously. It's creating a muddy puddle near the children's playing zone.",
    issueType: "Water Leak",
    severity: 3,
    severityLabel: "Low",
    latitude: 18.5236,
    longitude: 73.8410,
    address: "Sambhaji Park, JM Road, Shivajinagar, Pune, Maharashtra 411005",
    status: "Resolved",
    verificationCount: 3,
    verifiedBy: ["user_priya", "user_anil"],
    department: "Water Supply & Sewerage Board",
    estimatedDimensions: "Dripping tap, 1 liter per 10 mins",
    safetyRisk: "Low",
    affectedArea: "Children playing in park, garden walkers.",
    urgencyReason: "Leads to puddle formation and minor mosquito breeding spot if left unaddressed.",
    createdAt: "2026-06-15T10:00:00Z",
    updatedAt: "2026-06-17T14:00:00Z"
  },
  {
    id: "prisha_rep_2",
    userId: "prisha_netra_user",
    userName: "Prisha Italiya",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    userBadge: "AI Ally",
    imageUrl: "https://images.unsplash.com/photo-1595275372297-f0d34eecc7b4?auto=format&fit=crop&q=80&w=600", // Garbage
    title: "Overflowing Smart Dustbin on Sidewalk",
    description: "The public municipal trash bin is full to the brim. Garbage has spread onto the sidewalk, making it difficult for citizens to walk without stepping on trash.",
    issueType: "Garbage Dump",
    severity: 4,
    severityLabel: "Medium",
    latitude: 18.5134,
    longitude: 73.8268,
    address: "Rambaug Colony, DP Road, Kothrud, Pune, Maharashtra 411038",
    status: "In Progress",
    verificationCount: 5,
    verifiedBy: ["user_suresh", "user_anil"],
    department: "Solid Waste Management",
    estimatedDimensions: "Overflowing container, 1.5m trash spread",
    safetyRisk: "Low",
    affectedArea: "Local college students and residents visiting nearby cafe joints.",
    urgencyReason: "Causes littering and is a hygiene issue on a popular food street.",
    createdAt: "2026-06-22T08:00:00Z",
    updatedAt: "2026-06-22T12:00:00Z"
  }
];

// Helper to load or initialize Local Reports
export function getLocalReports(): any[] {
  const saved = localStorage.getItem("nagarnetra_reports");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  // Initialize with samples
  localStorage.setItem("nagarnetra_reports", JSON.stringify(PUNE_SAMPLE_REPORTS));
  return PUNE_SAMPLE_REPORTS;
}

// Helper to handle Firestore timeouts and network blocks gracefully
const FIRESTORE_TIMEOUT_MS = 2500; // 2.5s maximum wait time

async function fetchWithTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Firestore operation timed out"));
    }, FIRESTORE_TIMEOUT_MS);
  });
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Database Manager to combine Firebase with Local Fail-Safe
export const dbManager = {
  // Get all reports
  async getReports(): Promise<any[]> {
    if (isFirebaseAvailable) {
      try {
        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const snapshot = await fetchWithTimeout(getDocs(q));
        const reports: any[] = [];
        snapshot.forEach((doc) => {
          reports.push({ id: doc.id, ...doc.data() });
        });
        if (reports.length > 0) {
          // Keep local storage synced
          localStorage.setItem("nagarnetra_reports", JSON.stringify(reports));
          return reports;
        }
      } catch (err) {
        console.warn("Firestore fetch failed, disabling Firebase and reverting to Local Storage:", err);
        isFirebaseAvailable = false;
      }
    }
    return getLocalReports();
  },

  // Save a new report
  async addReport(reportData: any): Promise<any> {
    const newReport = {
      ...reportData,
      id: reportData.id || "rep_" + Math.random().toString(36).substring(2, 9),
      createdAt: reportData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verificationCount: reportData.verificationCount || 0,
      status: reportData.status || "Reported",
      verifiedBy: reportData.verifiedBy || []
    };

    // Save locally first
    const local = getLocalReports();
    local.unshift(newReport);
    localStorage.setItem("nagarnetra_reports", JSON.stringify(local));

    if (isFirebaseAvailable) {
      try {
        const docRef = await fetchWithTimeout(addDoc(collection(db, "reports"), newReport));
        console.log("Report saved to Firestore with ID:", docRef.id);
        // Update user points
        await this.addUserPoints(newReport.userId, 15, "reportCount");
        return { ...newReport, id: docRef.id };
      } catch (err) {
        console.warn("Failed to save report to Firestore, disabling Firebase and using local fallback:", err);
        isFirebaseAvailable = false;
      }
    } else {
      // Update local simulated points for default user
      if (newReport.userId === DEFAULT_MEMBER.id) {
        const user = this.getLocalUser();
        user.points += 15;
        user.reportCount += 1;
        this.saveLocalUser(user);
      }
    }
    return newReport;
  },

  // Verify a report
  async verifyReport(reportId: string, userId: string): Promise<boolean> {
    // Local update
    const reports = getLocalReports();
    const repIdx = reports.findIndex((r) => r.id === reportId);
    if (repIdx > -1) {
      const report = reports[repIdx];
      if (!report.verifiedBy) report.verifiedBy = [];
      if (!report.verifiedBy.includes(userId)) {
        report.verifiedBy.push(userId);
        report.verificationCount += 1;
        // Automatic state promotion
        if (report.verificationCount >= 3 && report.status === "Reported") {
          report.status = "Verified";
        }
        reports[repIdx] = report;
        localStorage.setItem("nagarnetra_reports", JSON.stringify(reports));

        // Update local user points
        if (userId === DEFAULT_MEMBER.id) {
          const user = this.getLocalUser();
          user.points += 5;
          user.verificationCount += 1;
          // Check for eagle eye badge
          if (user.verificationCount >= 5 && !user.badges.includes("Eagle Eye")) {
            user.badges.push("Eagle Eye");
          }
          this.saveLocalUser(user);
        }

        if (isFirebaseAvailable) {
          try {
            // Find firestore document matching ID
            // Simple query or doc ref
            const reportsCol = collection(db, "reports");
            const snapshot = await fetchWithTimeout(getDocs(reportsCol));
            let firestoreDocId = "";
            snapshot.forEach((doc) => {
              if (doc.data().id === reportId || doc.id === reportId) {
                firestoreDocId = doc.id;
              }
            });

            if (firestoreDocId) {
              const docRef = doc(db, "reports", firestoreDocId);
              await fetchWithTimeout(updateDoc(docRef, {
                verificationCount: increment(1),
                verifiedBy: arrayUnion(userId),
                status: report.status
              }));
              await this.addUserPoints(userId, 5, "verificationCount");
            }
          } catch (err) {
            console.warn("Failed to sync verification with Firestore, disabling Firebase:", err);
            isFirebaseAvailable = false;
          }
        }
        return true;
      }
    }
    return false;
  },

  // Get active user data
  getLocalUser(): any {
    const saved = localStorage.getItem("nagarnetra_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.setItem("nagarnetra_user", JSON.stringify(DEFAULT_MEMBER));
    return DEFAULT_MEMBER;
  },

  saveLocalUser(user: any) {
    localStorage.setItem("nagarnetra_user", JSON.stringify(user));
  },

  async addUserPoints(userId: string, pts: number, statField: string): Promise<void> {
    if (isFirebaseAvailable) {
      try {
        const usersCol = collection(db, "users");
        const snapshot = await fetchWithTimeout(getDocs(usersCol));
        let userDocId = "";
        snapshot.forEach((doc) => {
          if (doc.data().id === userId || doc.id === userId) {
            userDocId = doc.id;
          }
        });

        if (userDocId) {
          const docRef = doc(db, "users", userDocId);
          const updateData: any = {
            points: increment(pts)
          };
          if (statField) {
            updateData[statField] = increment(1);
          }
          await fetchWithTimeout(updateDoc(docRef, updateData));
        }
      } catch (err) {
        console.warn("Failed to update user points in Firestore, disabling Firebase:", err);
        isFirebaseAvailable = false;
      }
    }
  },

  // Seeding the Database on Application Startup
  async seedIfEmpty() {
    console.log("Checking if seeding is required...");
    // Seeding local storage
    if (!localStorage.getItem("nagarnetra_reports")) {
      localStorage.setItem("nagarnetra_reports", JSON.stringify(PUNE_SAMPLE_REPORTS));
    }
    if (!localStorage.getItem("nagarnetra_user")) {
      localStorage.setItem("nagarnetra_user", JSON.stringify(DEFAULT_MEMBER));
    }

    if (isFirebaseAvailable) {
      try {
        const reportsCol = collection(db, "reports");
        const snapshot = await fetchWithTimeout(getDocs(reportsCol));
        if (snapshot.empty) {
          console.log("Firestore 'reports' collection is empty. Seeding 10 mock Pune reports...");
          for (const r of PUNE_SAMPLE_REPORTS) {
            await fetchWithTimeout(addDoc(collection(db, "reports"), r));
          }
          console.log("Firestore seeding completed successfully.");
        }

        // Seed users collection
        const usersCol = collection(db, "users");
        const userSnap = await fetchWithTimeout(getDocs(usersCol));
        if (userSnap.empty) {
          await fetchWithTimeout(addDoc(collection(db, "users"), DEFAULT_MEMBER));
          console.log("Firestore 'users' seeded with default user.");
        }
      } catch (err) {
        console.warn("Failed to seed Firestore database, disabling Firebase and using local fallback:", err);
        isFirebaseAvailable = false;
      }
    }
  }
};
