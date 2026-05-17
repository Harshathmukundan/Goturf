import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Plus, X, Check, UserPlus, ChevronRight, Mail, Loader2, Copy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  captain: { label: "Captain", color: "#065F46", bg: "#D1FAE5" },
  accepted: { label: "Accepted ✓", color: "#10B981", bg: "#ECFDF5" },
  pending: { label: "Pending…", color: "#F59E0B", bg: "#FFF7ED" },
  declined: { label: "Declined", color: "#EF4444", bg: "#FEF2F2" },
};

export function TeamRegistrationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      // Get user's confirmed/pending bookings
      const result = await api.getUserBookings({ limit: 20 });
      const activeBookings = (result.data || []).filter(
        (b: any) => b.status === "confirmed" || b.status === "pending"
      );
      setBookings(activeBookings);

      if (activeBookings.length > 0) {
        const booking = activeBookings[0];
        setSelectedBooking(booking);

        // If booking has a team, load it
        if (booking.team?._id || booking.team?.id) {
          try {
            const teamResult = await api.getTeam(booking.team._id || booking.team.id);
            setTeam(teamResult.data);
          } catch {
            // No team yet
          }
        }
      }
    } catch (err: any) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!selectedBooking) return;
    setCreating(true);
    try {
      const result = await api.createTeam({
        name: `${user?.name?.split(" ")[0]}'s Team`,
        bookingId: selectedBooking._id,
        sport: selectedBooking.sport || "Football",
        maxPlayers: selectedBooking.playerCount || 6,
      });
      setTeam(result.data);
      toast.success("Team created! 🎉 Now invite your players.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !team) return;
    setInviting(true);
    try {
      const result = await api.inviteMember(team._id, inviteEmail.trim());
      setTeam(result.data);
      setInviteEmail("");
      toast.success(`Invite sent to ${inviteEmail}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(`${window.location.origin}/invite?code=${team.inviteCode}`);
      toast.success("Invite link copied!");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const members = team?.members || [];
  const acceptedCount = members.filter((m: any) => m.status === "accepted").length + 1; // +1 for captain
  const maxPlayers = team?.maxPlayers || selectedBooking?.playerCount || 7;
  const progressPercent = Math.round((acceptedCount / maxPlayers) * 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#E2E8F0", borderTopColor: "#10B981" }} />
          <p style={{ color: "#64748B" }}>Loading team data...</p>
        </div>
      </div>
    );
  }

  if (!selectedBooking) {
    return (
      <div className="min-h-screen py-10 px-4" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="max-w-xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl mb-2" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
            No Active Bookings
          </h2>
          <p className="mb-6" style={{ color: "#64748B" }}>
            Book a turf first, then come back to create your team.
          </p>
          <Link
            to="/turfs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontWeight: 600 }}
          >
            Browse Turfs <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4"
            style={{ background: "#F0FDF4", color: "#10B981", border: "1px solid #D1FAE5" }}
          >
            👥 Team Registration
          </div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, color: "#0F172A", fontSize: "2rem" }}>
            Build Your Squad
          </h1>
          <p className="mt-2" style={{ color: "#64748B" }}>
            {selectedBooking.turf?.name || "Turf"} · {selectedBooking.date && new Date(selectedBooking.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {selectedBooking.startTime}–{selectedBooking.endTime} · ₹{(selectedBooking.pricing?.finalPrice || 0).toLocaleString()}
          </p>
        </div>

        {/* If no team yet, show create button */}
        {!team && (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl mb-3" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
              Create Your Team
            </h3>
            <p className="mb-6 max-w-md mx-auto" style={{ color: "#64748B" }}>
              Start a team for this booking and invite your friends to join.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCreateTeam}
              disabled={creating}
              className="px-8 py-3.5 rounded-xl text-white inline-flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontWeight: 700, boxShadow: "0 8px 25px rgba(16,185,129,0.35)" }}
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              {creating ? "Creating..." : "Create Team"}
            </motion.button>
          </div>
        )}

        {/* Team exists - show roster + invite */}
        {team && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Player List */}
            <div className="md:col-span-3">
              <div
                className="rounded-2xl p-6"
                style={{ background: "white", boxShadow: "0 4px 30px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                {/* Team Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
                      Team Roster
                    </h3>
                    <span className="text-sm" style={{ fontWeight: 700, color: "#10B981" }}>
                      {acceptedCount}/{maxPlayers} Ready
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #10B981, #059669)" }}
                    />
                  </div>
                </div>

                {/* Captain */}
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: "#F0FDF4", border: "1px solid #D1FAE5" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #10B981, #065F46)", fontWeight: 700 }}
                    >
                      {getInitials(team.captain?.name || user?.name || "You")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ fontWeight: 600, color: "#0F172A" }}>
                        {team.captain?.name || user?.name} (You)
                      </p>
                      <p className="text-xs truncate" style={{ color: "#94A3B8" }}>
                        {team.captain?.email || user?.email}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs" style={{ background: "#D1FAE5", color: "#065F46", fontWeight: 600 }}>
                      👑 Captain
                    </span>
                  </div>

                  {/* Members */}
                  <AnimatePresence>
                    {members.map((member: any) => {
                      const cfg = statusConfig[member.status] || statusConfig.pending;
                      return (
                        <motion.div
                          key={member._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center gap-4 p-3 rounded-xl"
                          style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)" }}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #10B981, #065F46)", fontWeight: 700 }}
                          >
                            {getInitials(member.name || member.email)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate" style={{ fontWeight: 600, color: "#0F172A" }}>
                              {member.name || member.email?.split("@")[0]}
                            </p>
                            <p className="text-xs truncate" style={{ color: "#94A3B8" }}>
                              {member.email}
                            </p>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-full text-xs flex-shrink-0"
                            style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}
                          >
                            {cfg.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right: Invite & Info */}
            <div className="md:col-span-2 space-y-5">
              {/* Captain Info */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #065F46, #0F172A)",
                  boxShadow: "0 8px 30px rgba(6,95,70,0.3)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg text-white"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    ⚽
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Team: {team.name}
                    </p>
                    <p className="text-white text-sm" style={{ fontWeight: 700 }}>
                      {team.sport} · {maxPlayers} players max
                    </p>
                  </div>
                </div>
              </div>

              {/* Invite Panel */}
              <div
                className="p-5 rounded-2xl"
                style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5" style={{ color: "#10B981" }} />
                  <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
                    Invite Players
                  </h3>
                </div>
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                    style={{ borderColor: "rgba(0,0,0,0.1)" }}
                  >
                    <Mail className="w-4 h-4" style={{ color: "#94A3B8" }} />
                    <input
                      type="email"
                      placeholder="player@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      className="flex-1 outline-none bg-transparent text-sm"
                      style={{ color: "#0F172A" }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="w-full py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2"
                    style={{ background: inviteEmail.trim() ? "linear-gradient(135deg, #10B981, #059669)" : "#CBD5E1", fontWeight: 600 }}
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {inviting ? "Sending..." : "Send Invite"}
                  </motion.button>
                </div>

                {team.inviteCode && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                    <p className="text-xs mb-2" style={{ color: "#64748B", fontWeight: 600 }}>
                      Share via link
                    </p>
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "#F0FDF4", border: "1px solid #D1FAE5" }}
                    >
                      <span className="text-xs truncate flex-1" style={{ color: "#10B981" }}>
                        {window.location.origin}/invite?code={team.inviteCode}
                      </span>
                      <button onClick={copyInviteLink} className="text-xs flex items-center gap-1" style={{ color: "#10B981", fontWeight: 600 }}>
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Confirmed", value: acceptedCount, color: "#10B981" },
                  { label: "Pending", value: members.filter((m: any) => m.status === "pending").length, color: "#F59E0B" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-4 rounded-xl text-center"
                    style={{ background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
                  >
                    <p className="text-2xl" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, color: s.color }}>
                      {s.value}
                    </p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {selectedBooking?.chatRoomId && (
                <Link
                  to={`/chat/${selectedBooking._id}`}
                  className="flex items-center justify-between px-5 py-4 rounded-2xl text-white"
                  style={{
                    background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                    boxShadow: "0 8px 25px rgba(59,130,246,0.3)",
                  }}
                >
                  <div>
                    <p className="text-sm" style={{ fontWeight: 700 }}>
                      Open Team Chat
                    </p>
                    <p className="text-xs" style={{ opacity: 0.8 }}>
                      Coordinate with your team
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
