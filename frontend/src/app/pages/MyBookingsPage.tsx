import { useState, useEffect } from "react";
import { Link } from "react-router";
import { CalendarDays, MapPin, Clock, CreditCard, MessageCircle, X, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "#FFF7ED", icon: "⏳" },
  confirmed: { label: "Confirmed", color: "#10B981", bg: "#ECFDF5", icon: "✓" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2", icon: "✗" },
  completed: { label: "Completed", color: "#6366F1", bg: "#EEF2FF", icon: "✓" },
};

export function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filter !== "all") params.status = filter;
      const result = await api.getUserBookings(params);
      setBookings(result.data || []);
    } catch (err: any) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(id);
    try {
      await api.cancelBooking(id, "User cancelled");
      toast.success("Booking cancelled successfully");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmPayment = async (id: string) => {
    try {
      await api.confirmBooking(id, `TXN${Date.now()}`);
      toast.success("Payment confirmed! 🎉");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm payment");
    }
  };

  const filters = ["all", "pending", "confirmed", "cancelled", "completed"];

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, color: "#0F172A", fontSize: "2rem" }}>
            My Bookings 📅
          </h1>
          <p className="mt-1" style={{ color: "#64748B" }}>
            View and manage your turf bookings
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all"
              style={{
                background: filter === f ? "#10B981" : "white",
                color: filter === f ? "white" : "#64748B",
                fontWeight: filter === f ? 600 : 400,
                border: `1px solid ${filter === f ? "#10B981" : "rgba(0,0,0,0.1)"}`,
                boxShadow: filter === f ? "0 4px 12px rgba(16,185,129,0.3)" : "none",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#E2E8F0", borderTopColor: "#10B981" }} />
            <p style={{ color: "#64748B" }}>Loading bookings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && bookings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl mb-2" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
              No bookings found
            </h3>
            <p className="mb-6" style={{ color: "#64748B" }}>
              {filter !== "all" ? "No bookings with this status." : "You haven't made any bookings yet."}
            </p>
            <Link
              to="/turfs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontWeight: 600 }}
            >
              Browse Turfs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Booking Cards */}
        <div className="space-y-4">
          <AnimatePresence>
            {bookings.map((booking, i) => {
              const sc = statusConfig[booking.status] || statusConfig.pending;
              const turf = booking.turf;
              const pricing = booking.pricing || {};

              return (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {/* Top Bar */}
                  <div className="px-5 py-3 flex items-center justify-between" style={{ background: sc.bg }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ fontWeight: 600, color: sc.color }}>
                        {sc.icon} {sc.label}
                      </span>
                      {booking.bookingId && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "#64748B" }}>
                          #{booking.bookingId}
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>
                      {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
                          {turf?.name || "Turf"}
                        </h3>
                        {turf?.location && (
                          <p className="text-xs flex items-center gap-1 mt-1" style={{ color: "#64748B" }}>
                            <MapPin className="w-3 h-3" />
                            {turf.location.address || turf.location.area}, {turf.location.city}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, color: "#10B981" }}>
                          ₹{(pricing.finalPrice || 0).toLocaleString()}
                        </p>
                        <p className="text-xs" style={{ color: "#94A3B8" }}>
                          {pricing.isPeak ? "🔥 Peak" : "✨ Off-Peak"}
                        </p>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                        <p className="text-xs flex items-center gap-1" style={{ color: "#94A3B8" }}>
                          <CalendarDays className="w-3 h-3" /> Date
                        </p>
                        <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: "#0F172A" }}>
                          {new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                        <p className="text-xs flex items-center gap-1" style={{ color: "#94A3B8" }}>
                          <Clock className="w-3 h-3" /> Time
                        </p>
                        <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: "#0F172A" }}>
                          {booking.startTime}–{booking.endTime}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                        <p className="text-xs flex items-center gap-1" style={{ color: "#94A3B8" }}>
                          <CreditCard className="w-3 h-3" /> Payment
                        </p>
                        <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: booking.payment?.status === "paid" ? "#10B981" : "#F59E0B" }}>
                          {booking.payment?.status === "paid" ? "Paid ✓" : "Pending"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {booking.chatRoomId && booking.status !== "cancelled" && (
                        <Link
                          to={`/chat/${booking._id}`}
                          className="flex-1 py-2.5 rounded-xl text-sm text-center flex items-center justify-center gap-2"
                          style={{ background: "#EFF6FF", color: "#3B82F6", fontWeight: 600 }}
                        >
                          <MessageCircle className="w-4 h-4" /> Team Chat
                        </Link>
                      )}
                      {booking.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleConfirmPayment(booking._id)}
                            className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #10B981, #059669)", fontWeight: 600 }}
                          >
                            <CreditCard className="w-4 h-4" /> Confirm Payment
                          </button>
                          <button
                            onClick={() => handleCancel(booking._id)}
                            disabled={cancellingId === booking._id}
                            className="py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1"
                            style={{ background: "#FEF2F2", color: "#EF4444", fontWeight: 600 }}
                          >
                            {cancellingId === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          disabled={cancellingId === booking._id}
                          className="py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1"
                          style={{ background: "#FEF2F2", color: "#EF4444", fontWeight: 600 }}
                        >
                          {cancellingId === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
