import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Store,
  Lock,
} from "lucide-react";

const VendorAIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello Store Partner! 👋 I'm your private store AI. Ask me about your sales, pending payouts, stock alerts, or customers who ordered your items.",
    },
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const quickPrompts = [
    "What is my available payout balance?",
    "Which products are low on stock?",
    "Who purchased my products?",
    "What are my net earnings (98%)?",
  ];

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const token =
      localStorage.getItem("vendorToken") || localStorage.getItem("token");

    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/vendor/chat",
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
            "Unable to query store telemetry. Please check backend connection.",
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
          <div className="flex items-center justify-between bg-blue-600 px-5 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
                <Store size={16} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-tight">Store AI Assistant</p>
                <p className="text-[10px] text-blue-100 flex items-center gap-1">
                  <Lock size={10} /> Private Vendor Data Only
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition p-1"
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
                      ? "rounded-br-xs bg-blue-600 text-white"
                      : "rounded-bl-xs border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 italic text-[11px]">
                <Loader2 size={13} className="animate-spin text-blue-600" />
                Reading your store orders & inventory...
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
                className="shrink-0 text-[10px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-lg transition"
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
              placeholder="Ask about your store..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-40 transition"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={20} /> : <Sparkles size={22} />}
      </button>
    </div>
  );
};

export default VendorAIChatBot;