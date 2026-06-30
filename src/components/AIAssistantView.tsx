import React, { useState, useRef, useEffect } from "react";
import { User, Report } from "../types";
import { 
  Brain, Send, Mic, Sparkles, Loader2, User as UserIcon,
  HelpCircle, ShieldCheck, MapPin, Search, AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIAssistantProps {
  currentUser: User;
  reports: Report[];
  onNavigate: (page: string) => void;
  isDark: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function AIAssistantView({ currentUser, reports, onNavigate, isDark }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome_msg",
      role: "assistant",
      content: `Hello! I am **NagarNetra AI Assistant**, your civic helper across India. 

I can help you analyze municipal infrastructure, lookup details of registered reports, check your status updates, and provide preventative risk insights.

**Here is what you can ask me:**
- *"What are the most urgent potholes reported in my region?"*
- *"Can you check the resolution progress of my smart dustbin report?"*
- *"Who is the current top contributor on the platform?"*
- *"How do I earn points and verified badges?"*

How can I assist you in building a better community today?`,
      timestamp: new Date().toISOString()
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = "user_" + Math.random().toString(36).substring(2, 9);
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      // Build history payload for Gemini backend
      const payloadMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages })
      });

      if (!res.ok) {
        throw new Error("Chat response returned error.");
      }

      const data = await res.json();
      
      setMessages(prev => [
        ...prev,
        {
          id: "ai_" + Math.random().toString(36).substring(2, 9),
          role: "assistant",
          content: data.content,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error(err);
      // Fallback response
      setMessages(prev => [
        ...prev,
        {
          id: "ai_" + Math.random().toString(36).substring(2, 9),
          role: "assistant",
          content: `I'm currently operating in standalone backup mode. However, I can confirm that there are **${reports.length} total active civic issues** logged on NagarNetra. You can view them live on the **Issues Map** or report a fresh hazard on the **Report Issue** page!`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Quick Action Buttons click
  const handleQuickAction = (actionKey: string) => {
    let promptText = "";
    switch (actionKey) {
      case "area_issues":
        promptText = "Show me the status of potholes and municipal reports in my area";
        break;
      case "my_reports_status":
        promptText = "Tell me the current status of my submitted reports";
        break;
      case "urgent_nearby":
        promptText = "What are the most urgent and critical civic issues nearby?";
        break;
      case "file_report":
        onNavigate("Report Issue");
        return;
      case "how_verify":
        promptText = "How do I verify other citizen reports and earn points?";
        break;
      default:
        return;
    }
    handleSend(promptText);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md" id="chat-page-layout">
      
      {/* LEFT SIDEBAR (30% width) - QUICK ACTIONS */}
      <div className="w-full md:w-[260px] bg-slate-50 dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-4 flex flex-col justify-between shrink-0" id="chat-quick-actions">
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-display text-slate-800 dark:text-slate-100 flex items-center">
              <Sparkles size={14} className="text-purple-600 mr-1.5 animate-pulse" />
              Quick AI Actions
            </h3>
            <p className="text-[11px] text-slate-400">Trigger standard civic intelligence diagnostics immediately.</p>
          </div>

          <div className="space-y-2" id="action-buttons">
            <button 
              onClick={() => handleQuickAction("area_issues")}
              className="w-full text-left bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 hover:border-blue-500 dark:hover:border-slate-600 p-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Search size={14} className="text-blue-500 shrink-0" />
              <span>Issues in my area</span>
            </button>

            <button 
              onClick={() => handleQuickAction("my_reports_status")}
              className="w-full text-left bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 hover:border-blue-500 dark:hover:border-slate-600 p-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>Status of my reports</span>
            </button>

            <button 
              onClick={() => handleQuickAction("urgent_nearby")}
              className="w-full text-left bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 hover:border-blue-500 dark:hover:border-slate-600 p-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span>Most urgent issues nearby</span>
            </button>

            <button 
              onClick={() => handleQuickAction("file_report")}
              className="w-full text-left bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 hover:border-blue-500 dark:hover:border-slate-600 p-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <MapPin size={14} className="text-indigo-500 shrink-0" />
              <span>Report a new issue</span>
            </button>

            <button 
              onClick={() => handleQuickAction("how_verify")}
              className="w-full text-left bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 hover:border-blue-500 dark:hover:border-slate-600 p-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <HelpCircle size={14} className="text-yellow-500 shrink-0" />
              <span>How to verify reports?</span>
            </button>
          </div>
        </div>

        {/* Profile Card Summary */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-150 dark:border-slate-700 text-xs flex items-center gap-2.5">
          <img src={currentUser.avatar} alt="Me" className="w-8 h-8 rounded-full object-cover" />
          <div className="min-w-0">
            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{currentUser.name}</span>
            <span className="text-[10px] text-slate-400 block truncate">{currentUser.points} points active</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (70% width) - CHAT CONSOLE */}
      <div className="flex-1 bg-white dark:bg-slate-800 flex flex-col h-full z-10" id="chat-console">
        
        {/* Chat Console Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Brain size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">NagarNetra Copilot</h3>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-time database synced
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-scrollable">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser 
                  ? "bg-blue-100 text-blue-600 dark:bg-slate-700 dark:text-slate-300" 
                  : "bg-blue-600 text-white"
                }`}>
                  {isUser ? <UserIcon size={14} /> : <Brain size={14} />}
                </div>

                {/* Bubble content */}
                <div className="space-y-1">
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser 
                    ? "bg-blue-600 text-white rounded-tr-xs" 
                    : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-tl-xs border border-slate-100 dark:border-slate-800"
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] text-slate-400 block ${isUser ? "text-right" : "text-left"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Brain size={14} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 size={13} className="animate-spin text-blue-500" />
                <span>NagarNetra is reasoning...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Copilot about potholes, water leaks, department details..."
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-150"
              onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
            />
            
            {/* Microphone mic */}
            <button 
              onClick={() => {
                setInputText("List active critical issues across India");
                alert("🎤 Speech Recognition activated! Simulated speech: 'List active critical issues across India'");
              }}
              title="Voice typing"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 rounded-xl transition-all"
            >
              <Mic size={16} />
            </button>

            {/* Send */}
            <button 
              onClick={() => handleSend(inputText)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all shadow-xs shrink-0 flex items-center justify-center cursor-pointer"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
