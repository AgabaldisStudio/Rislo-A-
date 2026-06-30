import React, { useState } from "react";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Zap,
  HelpCircle
} from "lucide-react";
import { ChatSession } from "../types";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onOpenHelp: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onOpenHelp,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div
      className={`${
        isOpen ? "translate-x-0 w-80" : "-translate-x-full w-0 md:w-0"
      } fixed md:static inset-y-0 left-0 z-40 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out overflow-hidden h-full`}
    >
      {/* Header with Brand Logo */}
      <div className="p-4 border-b border-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3 group/logo">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/30 group-hover/logo:scale-105 transition-transform duration-200">
            <Zap className="w-5.5 h-5.5 text-white fill-white/25 animate-pulse" />
          </div>
          <div>
            <span className="font-display font-bold text-xl text-white tracking-wide animate-glow">
              rislo
            </span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
              AI
            </span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewSession}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-violet-900/20 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Yeni Söhbət
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Söhbətlərdə axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 focus:border-violet-500 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Chat Session List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div className="text-xs font-semibold text-slate-500 px-3 py-1 uppercase tracking-wider">
          Söhbət Tarixçəsi
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500 text-sm">
            {searchQuery ? "Axtarışa uyğun söhbət tapılmadı." : "Tarixçə hələ boşdur."}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingId;

            return (
              <div
                key={session.id}
                onClick={() => !isEditing && onSelectSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white border-l-2 border-violet-500"
                    : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-violet-400" : "text-slate-500"}`} />
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(session.id, e as any);
                        if (e.key === "Escape") handleCancelRename(e as any);
                      }}
                      className="bg-slate-800 text-white text-xs border border-violet-500 rounded px-1.5 py-0.5 focus:outline-none w-full"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate font-medium">{session.title}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 ml-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => handleSaveRename(session.id, e)}
                        className="p-1 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300"
                        title="Yadda saxla"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 rounded hover:bg-slate-800 text-rose-400 hover:text-rose-300"
                        title="İmtina et"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => startRename(session.id, session.title, e)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Adını dəyiş"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info button */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/80">
        <button
          onClick={onOpenHelp}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-white text-xs transition-all duration-150"
        >
          <HelpCircle className="w-4 h-4 text-violet-400" />
          Kömək və Məlumat
        </button>
        <div className="text-[10px] text-slate-600 text-center mt-3 font-mono">
          Yaddaş: Brauzerin Yerli Deposu (Local)
        </div>
      </div>
    </div>
  );
}
