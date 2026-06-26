"use client";

import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { ChatMessage, DocxPart } from "@/types";
import { Send, CheckCircle, AlertCircle, Bot, User } from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  isEditing: boolean;
  selectedPart: DocxPart | null;
  onSendMessage: (text: string) => void;
}

export default function ChatPanel({
  messages,
  isEditing,
  selectedPart,
  onSendMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isEditing || !selectedPart) return;
    setInput("");
    onSendMessage(text);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  return (
    <aside className="w-96 shrink-0 border-l border-surface-800 bg-surface-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-800 shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-brand-400" />
          <span className="text-sm font-semibold text-white">Assistente IA</span>
        </div>
        {selectedPart && (
          <p className="text-xs text-surface-400 mt-0.5 truncate">
            A editar: <span className="text-brand-300">{selectedPart.label}</span>
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-surface-800 p-3">
        {!selectedPart && (
          <p className="text-xs text-surface-500 text-center mb-2">
            Seleccione uma parte para começar a editar
          </p>
        )}
        <div
          className={`flex gap-2 p-2 rounded-xl border transition-colors ${
            selectedPart
              ? "border-surface-700 bg-surface-800 focus-within:border-brand-600"
              : "border-surface-800 bg-surface-900 opacity-50"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={!selectedPart || isEditing}
            placeholder={
              selectedPart
                ? `Diga o que editar em "${selectedPart.label}"…`
                : "Seleccione uma secção"
            }
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-surface-500 resize-none outline-none leading-relaxed"
            style={{ maxHeight: 140 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isEditing || !selectedPart}
            className="self-end p-2 rounded-lg bg-brand-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-500 transition-colors shrink-0"
          >
            {isEditing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-surface-600 mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </aside>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-brand-700" : "bg-surface-700"
        }`}
      >
        {isUser ? <User size={13} className="text-white" /> : <Bot size={13} className="text-brand-300" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser ? "chat-user text-white" : "chat-assistant text-surface-100"
          }`}
        >
          {message.isLoading ? (
            <div className="loading-dots flex gap-1 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-surface-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-surface-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-surface-400" />
            </div>
          ) : (
            <MarkdownText text={message.content} />
          )}
        </div>

        {/* Edit applied badge */}
        {message.editApplied && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 px-1">
            <CheckCircle size={11} />
            <span>Edição aplicada · {message.editRecord?.partName}</span>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-surface-600 px-1">
          {new Date(message.timestamp).toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// Very lightweight markdown renderer (bold, italic, code)
function MarkdownText({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-surface-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, "<br/>");

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
