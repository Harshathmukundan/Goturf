import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Copy, Check, Share2, UserPlus, Clock, MapPin, Calendar, Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { toast } from "sonner";

const avatarColors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899", "#EF4444", "#14B8A6", "#6366F1"];

const statusIcons: Record<string, { icon: string; color: string; bg: string }> = {
  captain: { icon: "👑", color: "#065F46", bg: "#D1FAE5" },
  accepted: { icon: "✓", color: "#10B981", bg: "#ECFDF5" },
  pending: { icon: "⏳", color: "#F59E0B", bg: "#FFF7ED" },
  declined: { icon: "✗", color: "#EF4444", bg: "#FEF2F2" },
};

export function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const inviteCode = searchParams.get("code");

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(!!inviteCode);
  const [responding, setResponding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responded, setResponded] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [invited, setInvited] = useState<string[]>([]);

  useEffect(() => {
    if (inviteCode) fetchTeamByInvite();
  }, [inviteCode]);

  const fetchTeamByInvite = async () => {
    try {
      const result = await api.getTeamByInviteCode(inviteCode!);
      setTeam(result.data);
    } catch (err: any) {
      toast.error("Invalid or expired invite link");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!inviteCode) return;
    setResponding(true);
    try {
      await api.respondToInvite(inviteCode, "accepted");
      setResponded(true);
      toast.success("You've joined the team! 🎉");
      setTimeout(() => navigate("/team-registration"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invite");
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    if (!inviteCode) return;
    setResponding(true);
    try {
      await api.respondToInvite(inviteCode, "declined");
      toast.info("Invite declined");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to decline invite");
    } finally {
      setResponding(false);
    }
  };

  const handleCopy = () => {
    const link = inviteCode
      ? `${window.location.origin}/invite?code=${inviteCode}`
      : `${window.location.origin}/invite?code=DEMO`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteLocal = () => {
    if (!newEmail.trim() || invited.includes(newEmail)) return;
    setInvited([...invited, newEmail]);
    setNewEmail("");
    toast.success(`Invite sent to ${newEmail}`);
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#E2E8F0", borderTopColor: "#10B981" }} />
          <p style={{ color: "#64748B" }}>Loading invite...</p>
        </div>
      </div>
    );
  }

  // If user responded successfully
  if (responded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-10 rounded-3xl"
          style={{ background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)" }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: "#10B981" }} />
          </motion.div>
          <h3 className="text-xl mb-2" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
            You're In! 🎉
          </h3>
          <p className="text-sm" style={{ color: "#64748B" }}>Redirecting to team page...</p>
        </motion.div>
      </div>
    );
  }

  const booking = team?.booking;
  const members = team?.members || [];
  const captain = team?.captain;

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4"
            style={{ background: "#EFF6FF", color: "#3B82F6", border: "1px solid #BFDBFE" }}
          >
            <Share2 className="w-4 h-4" />
            {inviteCode ? "You're Invited!" : "Invite Page"}
          </div>
          <h1
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, color: "#0F172A", fontSize: "2rem" }}
          >
            {inviteCode ? "Join the Game 🎯" : "Invite Your Squad 🎯"}
          </h1>
          <p className="mt-2" style={{ color: "#64748B" }}>
            {inviteCode
              ? `${captain?.name || "A player"} invited you to join their team`
              : "Share the booking with your team members"}
          </p>
        </div>

        {/* Booking Summary Card */}
        {(team || booking) && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: "linear-gradient(135deg, #065F46, #0F172A)",
              boxShadow: "0 12px 40px rgba(6,95,70,0.3)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  ⚽
                </div>
                <div>
                  <p className="text-white" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
                    {team?.name || "Team Booking"}
                  </p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {team?.sport || "Sports"} · Max {team?.maxPlayers || 7} players
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-sm text-white" style={{ background: "#10B981", fontWeight: 600 }}>
                {team?.status === "complete" ? "Full ✓" : "Open"}
              </span>
            </div>

            {booking && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <Calendar className="w-4 h-4" />, label: "Date", value: booking.date ? new Date(booking.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "TBD" },
                  { icon: <Clock className="w-4 h-4" />, label: "Time", value: booking.startTime ? `${booking.startTime}–${booking.endTime}` : "TBD" },
                  { icon: <MapPin className="w-4 h-4" />, label: "Location", value: booking.turf?.location?.area || "TBD" },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-1.5 mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {item.icon}
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <p className="text-white text-sm" style={{ fontWeight: 600 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accept/Decline Buttons (if invite code) */}
        {inviteCode && team && !responded && (
          <div className="flex gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={responding}
              className="flex-1 py-3.5 rounded-2xl text-white text-sm flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontWeight: 700, boxShadow: "0 8px 25px rgba(16,185,129,0.35)" }}
            >
              {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
              Accept & Join Team
            </motion.button>
            <button
              onClick={handleDecline}
              disabled={responding}
              className="px-6 py-3.5 rounded-2xl text-sm"
              style={{ border: "2px solid #EF4444", color: "#EF4444", fontWeight: 600 }}
            >
              Decline
            </button>
          </div>
        )}

        {/* Player List */}
        {members.length > 0 && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
                Team Members
              </h3>
              <div className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
                <span style={{ color: "#10B981", fontWeight: 700 }}>
                  {members.filter((m: any) => m.status === "accepted").length + 1}
                </span>
                /{team?.maxPlayers || 7} Confirmed
              </div>
            </div>

            <div className="space-y-3">
              {/* Captain */}
              {captain && (
                <div className="flex items-center gap-4 p-3 rounded-xl" style={{ border: "1px solid rgba(0,0,0,0.06)", background: "#F0FDF4" }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-white flex-shrink-0"
                    style={{ background: avatarColors[0], fontWeight: 700 }}
                  >
                    {getInitials(captain.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: 600, color: "#0F172A" }}>{captain.name}</p>
                    <p className="text-xs truncate" style={{ color: "#94A3B8" }}>{captain.email}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs" style={{ ...statusIcons.captain, fontWeight: 600, background: statusIcons.captain.bg, color: statusIcons.captain.color }}>
                    👑 Captain
                  </span>
                </div>
              )}

              {members.map((member: any, i: number) => {
                const cfg = statusIcons[member.status] || statusIcons.pending;
                return (
                  <div key={member._id || i} className="flex items-center gap-4 p-3 rounded-xl" style={{ border: "1px solid rgba(0,0,0,0.06)", background: "#FAFAFA" }}>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-white flex-shrink-0"
                      style={{ background: avatarColors[(i + 1) % avatarColors.length], fontWeight: 700 }}
                    >
                      {getInitials(member.name || member.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ fontWeight: 600, color: "#0F172A" }}>
                        {member.name || member.email?.split("@")[0]}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#94A3B8" }}>{member.email}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs capitalize" style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}>
                      {cfg.icon} {member.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invite More Section (shown when not coming from invite link) */}
        {!inviteCode && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5" style={{ color: "#10B981" }} />
              <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
                Invite More Players
              </h3>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInviteLocal()}
                className="flex-1 px-4 py-3 rounded-xl outline-none text-sm"
                style={{ border: "2px solid rgba(0,0,0,0.1)", background: "#F8FAFC", color: "#0F172A" }}
              />
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleInviteLocal}
                className="px-5 py-3 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontWeight: 600 }}
              >
                Invite
              </motion.button>
            </div>

            {/* Share Link */}
            <div className="p-4 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-xs mb-2" style={{ color: "#64748B", fontWeight: 600 }}>
                Share Invite Link
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 px-3 py-2 rounded-lg text-xs truncate"
                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", color: "#64748B" }}
                >
                  {window.location.origin}/invite?code={team?.inviteCode || "DEMO"}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 flex-shrink-0"
                  style={{
                    background: copied ? "#F0FDF4" : "#EFF6FF",
                    color: copied ? "#10B981" : "#3B82F6",
                    fontWeight: 600,
                    border: `1px solid ${copied ? "#D1FAE5" : "#BFDBFE"}`,
                  }}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </motion.button>
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex gap-3 mt-4">
              {[
                { label: "WhatsApp", bg: "#25D366", icon: "💬" },
                { label: "SMS", bg: "#3B82F6", icon: "📱" },
                { label: "Email", bg: "#F59E0B", icon: "✉️" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  className="flex-1 py-2.5 rounded-xl text-white text-xs flex items-center justify-center gap-1.5"
                  style={{ background: btn.bg, fontWeight: 600 }}
                >
                  <span>{btn.icon}</span>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            to="/team-registration"
            className="flex-1 py-3.5 rounded-2xl text-center text-sm"
            style={{ border: "2px solid #10B981", color: "#10B981", fontWeight: 600 }}
          >
            ← Back to Team
          </Link>
          {team?.booking?._id && (
            <Link
              to={`/chat/${team.booking._id}`}
              className="flex-1 py-3.5 rounded-2xl text-center text-white text-sm"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontWeight: 700 }}
            >
              Open Chat →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
