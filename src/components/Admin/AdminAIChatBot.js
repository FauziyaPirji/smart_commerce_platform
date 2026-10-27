import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  ShieldCheck,
  Bot,
} from "lucide-react";

const AdminAIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello Admin! 👋 I'm your platform intelligence bot. Ask me about total revenue, active vendors, orders, or platform commissions.",
    },
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const quickPrompts = [
    "What is total platform revenue?",
    "How much commission (2%) was earned?",
    "How many active vendors?",
    "Orders status breakdown?",
  ];

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");

    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://smart-commerce-platform-backend.onrender.com/api/admin/chat",
        { messages: newMsgs },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setMessages([
          ...newMsgs,
          { role: "assistant", content: res.data.reply },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMsgs,
        {
          role: "assistant",
          content:
            err.response?.data?.errorMessage ||
            "Unable to retrieve telemetry. Please verify server connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 flex h-[32rem] w-88 sm:w-96 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-tight">Admin Intelligence AI</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-400" /> Platform-Wide RAG Telemetry
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-xs bg-slate-900 text-white"
                      : "rounded-bl-xs border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 italic text-[11px]">
                <Loader2 size={13} className="animate-spin text-purple-600" />
                Querying platform database...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(q)}
                className="shrink-0 text-[10px] font-semibold bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 px-2.5 py-1 rounded-lg transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask platform stats..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-slate-900 p-2 text-white hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-13 w-13 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={20} /> : <Bot size={22} />}
      </button>
    </div>
  );
};

export default AdminAIChatBot;