import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router";
import { Send, Smile, ChevronLeft, MapPin, Clock, Pin, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const avatarColors: Record<string, string> = {
  A: "#10B981", B: "#3B82F6", C: "#8B5CF6", D: "#F59E0B", E: "#EF4444",
  F: "#EC4899", G: "#14B8A6", H: "#6366F1", I: "#F97316", J: "#06B6D4",
};

const getAvatarColor = (name: string) => {
  const letter = (name || "U")[0].toUpperCase();
  return avatarColors[letter] || "#64748B";
};

const getInitials = (name: string) => {
  if (!name) return "U";
  const parts = name.split(" ");
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const emojis = ["😄", "⚽", "🔥", "👏", "💪", "🙌", "😅", "🤝", "🎯", "⭐"];

export function ChatRoomPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [chatRoomId, setChatRoomId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  const userId = user?.id || "guest";
  const userName = user?.name || "Guest Player";

  // Load booking and chat messages
  useEffect(() => {
    if (bookingId) loadBookingData();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [bookingId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadBookingData = async () => {
    try {
      const result = await api.getBooking(bookingId!);
      const booking = result.data;
      setBookingInfo(booking);
      const roomId = booking.chatRoomId || `chat_${bookingId}`;
      setChatRoomId(roomId);

      // Load existing messages
      try {
        const msgResult = await api.getChatMessages(roomId);
        const existingMessages = (msgResult.data || []).map((m: any) => ({
          id: m._id,
          sender: m.senderName,
          avatar: getInitials(m.senderName),
          text: m.message,
          time: new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          isMine: m.sender?._id === userId || m.senderId === userId,
        }));
        setMessages(existingMessages);
      } catch {
        // No messages yet — that's ok
      }

      // Connect socket
      connectSocket(roomId);
    } catch {
      // Fallback: use demo data
      const roomId = `chat_${bookingId}`;
      setChatRoomId(roomId);
      setBookingInfo({
        turf: { name: "Champions Arena", location: { address: "Anna Nagar", city: "Chennai" } },
        startTime: "18:00",
        endTime: "19:00",
        pricing: { finalPrice: 1440 },
        status: "confirmed",
      });
      setMessages([
        { id: 1, sender: "System", avatar: "SY", text: "Chat room created. Invite your team members!", time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), isMine: false, isSystem: true },
      ]);
      connectSocket(roomId);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = (roomId: string) => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("🔌 Socket connected:", socket.id);

      // Join the chat room
      socket.emit("join_room", {
        chatRoomId: roomId,
        userId,
        userName,
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("❌ Socket disconnected");
    });

    // Receive messages
    socket.on("receive_message", (msgData: any) => {
      const newMsg = {
        id: msgData.id || Date.now(),
        sender: msgData.senderName,
        avatar: getInitials(msgData.senderName),
        text: msgData.message,
        time: new Date(msgData.timestamp || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        isMine: msgData.senderId === userId,
      };
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    // Online users
    socket.on("room_users", (users: any[]) => {
      setOnlineUsers(users);
    });

    // User events
    socket.on("user_joined", ({ userName: name }: any) => {
      setMessages((prev) => [...prev, {
        id: `system_${Date.now()}`,
        sender: "System",
        avatar: "SY",
        text: `${name} joined the chat`,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        isMine: false,
        isSystem: true,
      }]);
    });

    socket.on("user_left", ({ userName: name }: any) => {
      setMessages((prev) => [...prev, {
        id: `system_${Date.now()}`,
        sender: "System",
        avatar: "SY",
        text: `${name} left the chat`,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        isMine: false,
        isSystem: true,
      }]);
    });

    // Typing indicator
    socket.on("user_typing", ({ userName: name, isTyping }: any) => {
      if (isTyping) {
        setTypingUser(name);
        // Auto-clear after 3s
        setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
      setConnected(false);
    });
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const msgId = `msg_${Date.now()}`;

    // Send via socket
    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", {
        chatRoomId,
        message: input.trim(),
        senderId: userId,
        senderName: userName,
        senderAvatar: "",
      });
    } else {
      // Fallback: local message if socket disconnected
      setMessages((prev) => [...prev, {
        id: msgId,
        sender: userName,
        avatar: getInitials(userName),
        text: input.trim(),
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        isMine: true,
      }]);
    }

    // Stop typing indicator
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing", { chatRoomId, userName, isTyping: false });
    }

    setInput("");
    setShowEmoji(false);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // Emit typing indicator
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing", { chatRoomId, userName, isTyping: true });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing", { chatRoomId, userName, isTyping: false });
      }, 2000);
    }
  };

  const turfName = bookingInfo?.turf?.name || "Team Chat";
  const turfLocation = bookingInfo?.turf?.location;
  const displayTime = bookingInfo ? `${bookingInfo.startTime}–${bookingInfo.endTime}` : "";
  const displayPrice = bookingInfo?.pricing?.finalPrice ? `₹${bookingInfo.pricing.finalPrice}` : "";
  const bookingStatus = bookingInfo?.status || "pending";

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#E2E8F0", borderTopColor: "#10B981" }} />
          <p style={{ color: "#64748B" }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 border-b"
        style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(0,0,0,0.08)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
        }}
      >
        {/* Pinned Booking Banner */}
        <div
          className="px-4 py-3 flex items-center gap-3 border-b"
          style={{ background: "#F0FDF4", borderColor: "#D1FAE5" }}
        >
          <Pin className="w-4 h-4 flex-shrink-0" style={{ color: "#10B981" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ fontWeight: 700, color: "#065F46" }}>
              📌 Pinned Booking
            </p>
            <p className="text-xs truncate" style={{ color: "#10B981" }}>
              {turfName} {displayTime && `– ${displayTime}`} {displayPrice && `· ${displayPrice} Total`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{
              background: bookingStatus === "confirmed" ? "#10B981" : "#F59E0B",
              fontWeight: 600,
            }}>
              {bookingStatus === "confirmed" ? "Confirmed ✓" : "Pending"}
            </span>
          </div>
        </div>

        {/* Chat Header */}
        <div className="px-4 py-3 flex items-center gap-4">
          <Link to="/team-registration" className="flex items-center gap-1 text-sm" style={{ color: "#64748B" }}>
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #10B981, #065F46)" }}
          >
            ⚽
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
              {turfName} — Team Chat
            </p>
            <div className="flex items-center gap-3">
              {turfLocation && (
                <span className="text-xs flex items-center gap-1" style={{ color: "#64748B" }}>
                  <MapPin className="w-3 h-3" /> {turfLocation.address || turfLocation.area}, {turfLocation.city}
                </span>
              )}
              {displayTime && (
                <span className="text-xs flex items-center gap-1" style={{ color: "#64748B" }}>
                  <Clock className="w-3 h-3" /> {displayTime}
                </span>
              )}
              <span className="text-xs flex items-center gap-1" style={{ color: connected ? "#10B981" : "#EF4444" }}>
                {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {connected ? "Connected" : "Offline"}
              </span>
            </div>
          </div>
          {/* Online Users */}
          <div className="flex -space-x-2 flex-shrink-0">
            {onlineUsers.slice(0, 4).map((u, i) => (
              <div
                key={u.id || i}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white border-2 border-white"
                style={{ background: getAvatarColor(u.name), fontWeight: 700 }}
                title={u.name}
              >
                {getInitials(u.name)}
              </div>
            ))}
            {onlineUsers.length > 4 && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white border-2 border-white"
                style={{ background: "#94A3B8", fontWeight: 700 }}
              >
                +{onlineUsers.length - 4}
              </div>
            )}
            {onlineUsers.length === 0 && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white border-2 border-white"
                style={{ background: getAvatarColor(userName), fontWeight: 700 }}
              >
                {getInitials(userName)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Date divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }} />
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.05)", color: "#94A3B8" }}>
            Today
          </span>
          <div className="flex-1 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }} />
        </div>

        <AnimatePresence>
          {messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: "#F0FDF4", color: "#10B981" }}>
                    {msg.text}
                  </span>
                </motion.div>
              );
            }
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-3 ${msg.isMine ? "flex-row-reverse" : "flex-row"}`}
              >
                {!msg.isMine && (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-white flex-shrink-0 mb-0.5"
                    style={{ background: getAvatarColor(msg.sender), fontWeight: 700 }}
                  >
                    {msg.avatar}
                  </div>
                )}
                <div className={`max-w-[70%] ${msg.isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {!msg.isMine && (
                    <p className="text-xs px-1" style={{ color: "#94A3B8" }}>
                      {msg.sender}
                    </p>
                  )}
                  <div
                    className="px-4 py-2.5 rounded-2xl text-sm"
                    style={{
                      background: msg.isMine ? "linear-gradient(135deg, #10B981, #059669)" : "white",
                      color: msg.isMine ? "white" : "#0F172A",
                      borderRadius: msg.isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      boxShadow: msg.isMine ? "0 4px 15px rgba(16,185,129,0.3)" : "0 2px 10px rgba(0,0,0,0.08)",
                      maxWidth: "100%",
                    }}
                  >
                    {msg.text}
                  </div>
                  <p className="text-xs px-1" style={{ color: "#CBD5E1" }}>
                    {msg.time}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {typingUser && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 pl-11"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#94A3B8" }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: "#94A3B8" }}>{typingUser} is typing...</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-shrink-0 px-4 pb-2"
          >
            <div
              className="p-3 rounded-2xl flex gap-2 flex-wrap"
              style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
            >
              {emojis.map((em) => (
                <button
                  key={em}
                  className="text-2xl hover:scale-125 transition-transform"
                  onClick={() => setInput(input + em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div
        className="flex-shrink-0 px-4 py-4 border-t"
        style={{ background: "white", borderColor: "rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: showEmoji ? "#F0FDF4" : "#F8FAFC",
              color: showEmoji ? "#10B981" : "#94A3B8",
            }}
          >
            <Smile className="w-5 h-5" />
          </button>
          <div
            className="flex-1 flex items-center rounded-2xl px-4 py-2.5"
            style={{ background: "#F8FAFC", border: "2px solid rgba(0,0,0,0.08)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={connected ? "Type a message..." : "Connecting..."}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "#0F172A" }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: input.trim()
                ? "linear-gradient(135deg, #10B981, #059669)"
                : "#E2E8F0",
              color: input.trim() ? "white" : "#94A3B8",
              boxShadow: input.trim() ? "0 4px 15px rgba(16,185,129,0.4)" : "none",
              transition: "all 0.2s",
            }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
