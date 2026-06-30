import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Zap, 
  User, 
  Menu, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle,
  Image,
  X,
  Globe,
  Search
} from "lucide-react";
import Markdown from "react-markdown";
import { ChatSession, Message } from "../types";

interface ChatAreaProps {
  session: ChatSession | null;
  onSendMessage: (text: string, image?: { mimeType: string; data: string }, searchMode?: boolean) => void;
  isLoading: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onClearSession: () => void;
  error: string | null;
}

export default function ChatArea({
  session,
  onSendMessage,
  isLoading,
  onToggleSidebar,
  isSidebarOpen,
  onClearSession,
  error
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ mimeType: string; data: string; preview: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, isLoading]);

  // Focus input when session changes
  useEffect(() => {
    if (session) {
      inputRef.current?.focus();
    }
  }, [session?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Zəhmət olmasa yalnız şəkil faylı seçin.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Downscale/Compress using HTML5 Canvas to protect memory & localStorage (max 600px)
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          const base64Data = compressedDataUrl.split(",")[1];
          setSelectedImage({
            mimeType: "image/jpeg",
            data: base64Data,
            preview: compressedDataUrl,
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = () => {
    if (!input.trim() && !selectedImage) return;
    if (isLoading) return;
    
    // Fallback prompt if user sends only an image
    const finalMessage = input.trim() || "Zəhmət olmasa bu şəkli təsvir et və ya analiz et.";
    onSendMessage(
      finalMessage, 
      selectedImage ? { mimeType: selectedImage.mimeType, data: selectedImage.data } : undefined,
      false
    );
    
    setInput("");
    setSelectedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-6 text-center">
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center mb-4 shadow-xl shadow-violet-900/30 group-hover:scale-105 transition-transform duration-300">
          <Zap className="w-8 h-8 text-white fill-white/20 animate-pulse" />
        </div>
        <h3 className="font-display font-semibold text-xl text-white mb-2">Rislo Sizi Gözləyir</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Söhbətə başlamaq üçün soldakı menyudan yeni söhbət yaradın və ya mövcud olanı seçin.
        </p>
      </div>
    );
  }

  const isChatEmpty = session.messages.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full overflow-hidden relative">
      {/* Top bar header */}
      <div className="h-16 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-md z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            title="Menyunu aç/bağla"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Zap className="w-4.5 h-4.5 text-white fill-white/20 animate-pulse" />
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-slate-900 rounded-full animate-pulse"></span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide truncate max-w-[160px] md:max-w-xs">
                {session.title}
              </h2>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono font-medium">
                Aktif Köməkçi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isChatEmpty && (
            <button
              onClick={onClearSession}
              className="px-3 py-1.5 rounded-lg border border-slate-800/60 hover:bg-slate-800/50 hover:border-slate-700 text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1.5 transition-all"
              title="Bu söhbəti təmizlə"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Təmizlə</span>
            </button>
          )}
        </div>
      </div>

      {/* Main chat message display */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
        
        {isChatEmpty ? (
          /* Empty Chat - Simple, Clean Welcome */
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center py-6">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 border border-violet-500/10 mb-5 shadow-xl shadow-violet-900/20">
                <Zap className="w-10 h-10 text-white fill-white/10 animate-pulse" />
              </div>
              <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white mb-3">
                Salam, mən <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 animate-glow">Rislo</span>!
              </h1>
              <p className="text-sm md:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                Mən sizin ağıllı süni intellekt köməkçinizəm. Hər hansı sualınız var? Aşağıdan yazaraq söhbətə başlaya bilərsiniz.
              </p>
            </div>
          </div>
        ) : (
          /* List of Messages */
          <div className="max-w-3xl mx-auto space-y-6">
            {session.messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {/* Left Avatar for Rislo */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      <Zap className="w-4.5 h-4.5 text-white fill-white/20" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`max-w-[85%] group relative ${isUser ? "order-1" : "order-2"}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? "bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-900/10"
                          : "bg-slate-950/60 text-slate-100 border border-slate-800/70 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {msg.image && msg.image.data && (
                        <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-slate-700/30">
                          <img
                            src={`data:${msg.image.mimeType};base64,${msg.image.data}`}
                            alt="Göndərilən şəkil"
                            className="max-h-60 object-cover w-full rounded"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="markdown-body">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      )}

                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                          <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-emerald-400 animate-pulse" />
                            Mənbələr və Araşdırma:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, index) => (
                              <a
                                key={index}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-800 text-violet-300 hover:text-violet-200 hover:border-slate-700 transition-colors"
                              >
                                <span className="max-w-[120px] truncate">{src.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata under bubble */}
                    <div
                      className={`flex items-center gap-2 mt-1.5 px-1 text-[10px] text-slate-500 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.searchMode && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-400 font-medium">
                          <Globe className="w-3 h-3" />
                          Araşdırıldı
                        </span>
                      )}
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>

                      {/* Action buttons (Copy) */}
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 p-0.5 rounded hover:bg-slate-800 hover:text-slate-300"
                        title="Kopyala"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Avatar for User */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 flex-shrink-0">
                      <User className="w-4.5 h-4.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Loading State */}
            {isLoading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse shadow-md">
                  <Zap className="w-4.5 h-4.5 text-white fill-white/20" />
                </div>
                
                <div className="bg-slate-950/60 border border-slate-800/70 text-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex-1 max-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs font-medium">Rislo düşünür...</span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="flex gap-2.5 items-center bg-rose-950/30 border border-rose-900/50 text-rose-300 rounded-xl p-4 text-xs font-medium max-w-2xl mx-auto">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="flex-1">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input Form at bottom */}
      <div className="p-4 md:p-6 bg-slate-900 border-t border-slate-800/80 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex flex-col bg-slate-950/70 border border-slate-800 hover:border-slate-700 focus-within:border-violet-500 rounded-xl p-2.5 transition-all">
            {/* Image Preview bar integrated inside */}
            {selectedImage && (
              <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-slate-800/80 animate-in fade-in duration-200">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700/50 group/preview">
                  <img src={selectedImage.preview} alt="Yüklənən şəkil" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity"
                    title="Şəkli sil"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">Şəkil yükləndi</p>
                  <p className="text-[10px] text-slate-500 font-mono">Süni intellekt şəkli analiz edəcək 🚀</p>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition-colors"
                  title="Şəkli sil"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 w-full">
              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors flex-shrink-0 mb-0.5"
                title="Şəkil əlavə et"
              >
                <Image className="w-5 h-5" />
              </button>
              
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rislo-ya yazın və ya şəkil göndərin... ⚡"
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none resize-none max-h-36 min-h-[24px] px-2 py-1"
                style={{ height: "auto" }}
              />
              
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className={`p-2.5 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                  (input.trim() || selectedImage) && !isLoading
                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow shadow-violet-900/30"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
                title="Mesajı göndər"
              >
                <Send className="w-4 h-4" />
                <span className="text-xs font-semibold hidden sm:inline">Göndər</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-2.5 font-medium flex items-center justify-center gap-1.5 animate-pulse">
            <span>✨</span>
            Rislo araşdırma üçün bir süni intellekt deyil, o sadəcə bir süni dostdur.
            <span>✨</span>
          </p>
        </div>
      </div>
    </div>
  );
}
