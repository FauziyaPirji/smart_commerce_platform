import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Mail,
  CheckCircle2,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  Phone,
  Tag,
  ShieldCheck,
} from "lucide-react";

const API_BASE_URL = "https://smart-commerce-platform-backend.onrender.com/api";

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeMessage, setActiveMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/contact-messages`);
      if (res.data && res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error("Fetch Messages Error:", err);
      setError("Failed to load customer enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeMessage) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/contact-messages/${activeMessage._id}/reply`,
        { replyText },
      );

      if (res.data && res.data.success) {
        alert("Reply email dispatched to customer successfully!");
        const updatedDoc = res.data.data || {
          ...activeMessage,
          status: "resolved",
          adminNote: replyText,
          respondedAt: new Date(),
        };

        // Update list
        setMessages((prev) =>
          prev.map((m) => (m._id === activeMessage._id ? updatedDoc : m)),
        );

        // Switch panel to resolved read-only mode immediately
        setActiveMessage(updatedDoc);
        setReplyText("");
      }
    } catch (err) {
      console.error("Reply Error:", err);
      alert(err.response?.data?.message || "Failed to send email reply.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Customer Support Enquiries
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Read support messages submitted via the Contact page and dispatch
          email responses.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <Loader2 size={32} className="animate-spin text-[#287b6d]" />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border text-red-500">
          {error}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          {/* Messages List */}
          <div className="space-y-3">
            {messages.map((msg) => {
              const isResolved = msg.status === "resolved";

              return (
                <div
                  key={msg._id}
                  onClick={() => {
                    setActiveMessage(msg);
                    setReplyText("");
                  }}
                  className={`bg-white border rounded-2xl p-5 cursor-pointer transition hover:border-[#287b6d] ${
                    activeMessage?._id === msg._id
                      ? "border-[#287b6d] ring-2 ring-[#287b6d]/10 shadow-sm"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {msg.subject}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isResolved
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isResolved ? "Resolved" : "Pending Response"}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 mt-2">{msg.name}</h3>
                  <p className="text-xs text-slate-500">{msg.email}</p>
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                    {msg.message}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {new Date(msg.createdAt).toLocaleDateString("en-IN")}
                    </span>
                    {msg.orderId && (
                      <span className="font-semibold text-slate-600">
                        Order: {msg.orderId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details / Reply Side Panel */}
          {activeMessage ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 h-fit sticky top-24 space-y-5 shadow-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">
                    {activeMessage.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {activeMessage.email}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    activeMessage.status === "resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {activeMessage.status === "resolved" ? "Resolved" : "Pending"}
                </span>
              </div>

              {/* Message Details */}
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <strong className="text-slate-800">Topic:</strong>{" "}
                  {activeMessage.subject}
                </p>
                {activeMessage.phone && (
                  <p className="flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" />
                    <strong>Phone:</strong> {activeMessage.phone}
                  </p>
                )}
                {activeMessage.orderId && (
                  <p className="flex items-center gap-1">
                    <Tag size={13} className="text-slate-400" />
                    <strong>Order ID:</strong> {activeMessage.orderId}
                  </p>
                )}
              </div>

              {/* Original Customer Message */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Customer Query
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeMessage.message}
                </p>
              </div>

              {/* RESOLVED STATE (Read-Only: Display Sent Response) */}
              {activeMessage.status === "resolved" ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Response Dispatched to Customer Email
                  </div>

                  <div className="text-xs text-emerald-900 bg-white rounded-lg p-3 border border-emerald-100 leading-relaxed whitespace-pre-line">
                    {activeMessage.adminNote ||
                      "Official response sent via email."}
                  </div>

                  {activeMessage.respondedAt && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-700">
                      <Clock size={12} />
                      Responded on{" "}
                      {new Date(activeMessage.respondedAt).toLocaleString(
                        "en-IN",
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-medium">
                    This enquiry is closed and locked for further replies.
                  </div>
                </div>
              ) : (
                /* PENDING STATE (Active Reply Form) */
                <form onSubmit={handleSendReply} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Dispatch Official Response Email
                    </label>
                    <textarea
                      rows={5}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your official email reply here... (Sent directly to customer's email address)"
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none transition focus:border-[#287b6d] focus:ring-2 focus:ring-[#287b6d]/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !replyText.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-[#287b6d] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#226b60] transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Dispatch Email Reply
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Mail size={32} className="text-slate-300" />
              <p className="text-sm font-semibold">
                Select an enquiry to view details or respond.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminContactMessages;
