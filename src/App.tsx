/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import { ChatSession, Message } from "./types";
import { Bot, HelpCircle, X, Sparkles, Key, Save, Cpu } from "lucide-react";

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sessions from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem("rislo_chat_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Local storage loading error", e);
      }
    } else {
      // Create a default session if empty
      const defaultSession: ChatSession = {
        id: "default-session-id",
        title: "Yeni Söhbət",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([defaultSession]);
      setActiveSessionId("default-session-id");
    }

    // On mobile, close sidebar by default
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Save sessions helper
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem("rislo_chat_sessions", JSON.stringify(updatedSessions));
  };

  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "Yeni Söhbət",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newId);
    setError(null);
    
    // Close sidebar on mobile after choosing/creating
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setError(null);
    
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    
    if (filtered.length === 0) {
      // Always keep at least one session
      const fallbackId = `session-${Date.now()}`;
      const fallbackSession: ChatSession = {
        id: fallbackId,
        title: "Yeni Söhbət",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveSessions([fallbackSession]);
      setActiveSessionId(fallbackId);
    } else {
      saveSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
    }
    setError(null);
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map((s) => 
      s.id === id 
        ? { ...s, title: newTitle, updatedAt: Date.now() } 
        : s
    );
    saveSessions(updated);
  };

  const handleClearSession = () => {
    if (!activeSessionId) return;
    const updated = sessions.map((s) => 
      s.id === activeSessionId 
        ? { ...s, messages: [], title: "Yeni Söhbət", updatedAt: Date.now() } 
        : s
    );
    saveSessions(updated);
    setError(null);
  };

  const handleSendMessage = async (text: string, image?: { mimeType: string; data: string }, searchMode?: boolean) => {
    if (!activeSessionId || isLoading) return;
    setError(null);

    // Find the active session
    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession) return;

    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text,
      timestamp: Date.now(),
      image,
      searchMode,
    };

    // Append to existing messages
    const updatedMessages = [...currentSession.messages, userMessage];
    
    // Determine the title: if session is brand new (or titled "Yeni Söhbət"), rename it automatically
    let updatedTitle = currentSession.title;
    if (currentSession.title === "Yeni Söhbət" && currentSession.messages.length === 0) {
      updatedTitle = text.length > 25 ? text.substring(0, 25) + "..." : text;
    }

    const updatedSession: ChatSession = {
      ...currentSession,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    // Optimistically update UI
    const nextSessions = sessions.map((s) => 
      s.id === activeSessionId ? updatedSession : s
    );
    saveSessions(nextSessions);
    setIsLoading(true);

    try {
      // Build previous history to send to Gemini (excluding the newly created user message)
      // We pass the history of the session so the chat retains memory!
      const apiHistory = currentSession.messages.map((m) => ({
        role: m.role,
        text: m.text,
        image: m.image,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: apiHistory,
          image,
          searchMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sunucuyla əlaqə qurularkən xəta baş verdi.");
      }

      // Create model response message
      const modelMessage: Message = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: data.reply,
        timestamp: Date.now(),
        sources: data.sources,
        searchMode,
      };

      // Append model response to session
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, modelMessage],
        updatedAt: Date.now(),
      };

      saveSessions(
        nextSessions.map((s) => (s.id === activeSessionId ? finalSession : s))
      );
    } catch (err: any) {
      console.error("Message send error:", err);
      setError(err.message || "Mesaj göndərilərkən gözlənilməz xəta baş verdi.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar - chat history */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onOpenHelp={() => setIsHelpOpen(true)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main chat area */}
      <ChatArea
        session={activeSession}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onClearSession={handleClearSession}
        error={error}
      />

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">
                  Rislo Haqqında
                </h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-sm leading-relaxed text-slate-300 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="mb-3">
                  <strong>Rislo</strong>, Google-un ən son və qabaqcıl <strong>Gemini 3.5 Flash</strong> süni intellekt modeli tərəfindən idarə olunan, tamamilə qaranlıq rejimli (dark mode) söhbət köməkçisidir.
                </p>
                <p>
                  Sual vermək, proqramlaşdırma üzrə kömək almaq, yaradıcı mətnlər yazmaq və ya sadəcə maraqlı söhbətlər etmək üçün idealdır.
                </p>
              </div>

              <hr className="border-slate-800" />

              <div className="space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" /> Keyfiyyətləri:
                </h4>
                <ul className="list-disc list-inside pl-1 space-y-1.5 text-slate-400">
                  <li><strong>Ağıllı Cavablar:</strong> Hər cür suala dəqiq, dolğun və aydın cavablar.</li>
                  <li><strong>Tarixçə Yaddaşı:</strong> Söhbətləriniz yerli olaraq (brauzerinizdə) avtomatik yadda saxlanılır və heç vaxt silinmir.</li>
                  <li><strong>Kontekst Anlayışı:</strong> Söhbət ərzində əvvəlki mesajlarınızı yadda saxlayaraq davamlı dialoq qurur.</li>
                  <li><strong>Adlandırma və Redaktə:</strong> Söhbətlərinizin adını istədiyiniz kimi dəyişə və ya silə bilərsiniz.</li>
                </ul>
              </div>

              <hr className="border-slate-800" />

              <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-2 text-violet-400 font-semibold mb-1">
                  <Key className="w-3.5 h-3.5" />
                  <span>MƏXFİLİK VƏ SƏSİZLİK</span>
                </div>
                <p>Bütün söhbət məlumatlarınız tamamilə sizin brauzerinizin yerli yaddaşında (localStorage) saxlanılır. Heç bir serverdə fərdi məlumatlarınız yaddaşa yazılmır.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 shadow shadow-violet-900/10"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

