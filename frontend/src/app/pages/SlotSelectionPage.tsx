import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Users, ChevronLeft, Plus, Minus, CheckCircle, Zap, TrendingUp, Calendar, Sunrise } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api.js";

export function SlotSelectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any>(null);
  const [isWeekend, setIsWeekend] = useState(false);
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(1);
  const [players, setPlayers] = useState(10);
  const [sport, setSport] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (id) fetchTurf();
  }, [id]);

  useEffect(() => {
    if (id && selectedDate) fetchSlots();
  }, [id, selectedDate]);

  const fetchTurf = async () => {
    try {
      const result = await api.getTurf(id!);
      setTurf(result.data);
      setSport(result.data?.sports?.[0] || "Football");
    } catch {
      setTurf({
        name: "Champions Arena",
        location: { address: "Anna Nagar", city: "Chennai" },
        sports: ["Football", "Cricket"],
        images: ["https://images.unsplash.com/photo-1682369368407-9ca29b7a96a3?w=800"],
        capacity: 14,
        pricePerHour: 1200,
        peakHourMultiplier: 1.3,
        peakHours: { start: "17:00", end: "21:00" },
        rating: 4.8,
        totalReviews: 234,
        amenities: ["Floodlights", "Parking", "Changing Room"],
      });
      setSport("Football");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const result = await api.getTurfSlots(id!, selectedDate);
      setSlots(result.data?.slots || []);
      setPeakHours(result.data?.peakHours || null);
      setIsWeekend(result.data?.isWeekend || false);
      setOccupancyRate(result.data?.occupancyRate || 0);
      if (result.data?.turf) setTurf(result.data.turf);
    } catch {
      // Fallback slots
      const bookingDate = new Date(selectedDate);
      const weekend = [0, 6].includes(bookingDate.getDay());
      setIsWeekend(weekend);
      const fallbackSlots = [];
      for (let h = 6; h < 24; h++) {
        const isPeak = h >= 17 && h < 21;
        const isEarlyBird = h >= 6 && h < 9;
        const peakMult = isPeak ? 1.3 : 1.0;
        const weekendMult = weekend ? 1.15 : 1.0;
        const earlyBirdMult = isEarlyBird && !isPeak ? 0.9 : 1.0;
        fallbackSlots.push({
          startTime: `${h.toString().padStart(2, "0")}:00`,
          endTime: `${(h + 1).toString().padStart(2, "0")}:00`,
          isPeak,
          isEarlyBird,
          isWeekend: weekend,
          basePrice: 1200,
          peakMultiplier: peakMult,
          weekendMultiplier: weekendMult,
          demandMultiplier: 1.0,
          earlyBirdMultiplier: earlyBirdMult,
          price: Math.round(1200 * peakMult * weekendMult * earlyBirdMult),
          isAvailable: Math.random() > 0.25,
        });
      }
      setSlots(fallbackSlots);
    }
  };

  const selectedSlot = slots.find((s) => s.startTime === selectedTime);
  const basePrice = selectedSlot?.basePrice || turf?.price_per_hour || turf?.pricePerHour || 1200;
  const peakMultiplier = selectedSlot?.peakMultiplier || 1.0;
  const weekendMultiplier = selectedSlot?.weekendMultiplier || 1.0;
  const demandMultiplier = selectedSlot?.demandMultiplier || 1.0;
  const earlyBirdMultiplier = selectedSlot?.earlyBirdMultiplier || 1.0;
  const weatherMultiplier = selectedSlot?.weatherMultiplier || 1.0;
  const timingMultiplier = selectedSlot?.timingMultiplier || 1.0;
  const weatherCondition = selectedSlot?.weatherCondition || 'Clear';

  const isPeak = selectedSlot?.isPeak ?? false;
  const isEarlyBird = selectedSlot?.isEarlyBird ?? false;
  
  const pricePerHour = selectedSlot?.finalPrice || Math.round(basePrice * peakMultiplier * weekendMultiplier * demandMultiplier * earlyBirdMultiplier * weatherMultiplier * timingMultiplier);
  const total = pricePerHour * duration;

  const handleConfirmBooking = async () => {
    const token = localStorage.getItem("goturf_token");
    if (!token) {
      navigate("/auth");
      return;
    }
    if (!selectedTime) return;

    setBooking(true);
    try {
      await api.createBooking({
        turfId: id,
        date: selectedDate,
        startTime: selectedTime,
        duration,
        sport,
        playerCount: players,
      });
      setBooked(true);
      setTimeout(() => navigate("/team-registration"), 2000);
    } catch (err: any) {
      alert(err.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "#E2E8F0", borderTopColor: "#10B981" }} />
          <p style={{ color: "#64748B" }}>Loading turf details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/turfs"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: "white", color: "#64748B", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
          >
            <ChevronLeft className="w-4 h-4" /> Back to Turfs
          </Link>
          <div>
            <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A", fontSize: "1.5rem" }}>
              {turf?.name || "Turf"}
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>
              {turf?.location?.address || turf?.location?.area}, {turf?.location?.city || "Chennai"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Turf Preview + Slots */}
          <div className="lg:col-span-3 space-y-6">
            {/* Turf Image with Status Overlay */}
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}>
              <div className="relative h-64 md:h-80">
                <img
                  src={turf?.images?.[0] || "https://images.unsplash.com/photo-1682369368407-9ca29b7a96a3?w=800"}
                  alt={turf?.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,0.7))" }} />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Peak Status */}
                    <div
                      className="px-3 py-1.5 rounded-xl text-sm"
                      style={{
                        background: isPeak ? "#F59E0B" : "#10B981",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {isPeak ? "🔥 Peak Hours" : "✨ Off-Peak"}
                    </div>
                    {/* Weekend badge */}
                    {isWeekend && (
                      <div
                        className="px-3 py-1.5 rounded-xl text-sm"
                        style={{ background: "#8B5CF6", color: "white", fontWeight: 600 }}
                      >
                        📅 Weekend Surge
                      </div>
                    )}
                    {/* Early bird badge */}
                    {isEarlyBird && (
                      <div
                        className="px-3 py-1.5 rounded-xl text-sm"
                        style={{ background: "#3B82F6", color: "white", fontWeight: 600 }}
                      >
                        🌅 Early Bird
                      </div>
                    )}
                    {/* Demand badge */}
                    {occupancyRate >= 60 && (
                      <div
                        className="px-3 py-1.5 rounded-xl text-sm"
                        style={{ background: "#EF4444", color: "white", fontWeight: 600 }}
                      >
                        🔥 {occupancyRate}% Booked
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Factors Bar */}
              <div className="p-4 flex items-center justify-between flex-wrap gap-3" style={{
                background: isWeekend
                  ? "linear-gradient(135deg, #EDE9FE, #DDD6FE)"
                  : isPeak
                    ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
                    : "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
              }}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "#475569" }}>
                    <Zap className="w-4 h-4" /> {isPeak ? "Peak" : "Off-Peak"}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "#475569" }}>
                    <Calendar className="w-4 h-4" /> {isWeekend ? "Weekend" : "Weekday"}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "#475569" }}>
                    <TrendingUp className="w-4 h-4" /> {occupancyRate}% Booked
                  </div>
                </div>
                <div className="text-xs px-3 py-1 rounded-full" style={{
                  background: earlyBirdMultiplier < 1 ? "#DCFCE7" : isPeak ? "#FEF9C3" : "#F1F5F9",
                  color: earlyBirdMultiplier < 1 ? "#16A34A" : isPeak ? "#CA8A04" : "#475569",
                  fontWeight: 600,
                }}>
                  {earlyBirdMultiplier < 1 ? "🌅 Early bird discount!" : isPeak ? "🔥 Peak hour surge" : "✨ Standard pricing"}
                </div>
              </div>

              {/* Turf Quick Info */}
              <div className="p-6" style={{ background: "white" }}>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Surface", value: turf?.surface || "Artificial Turf" },
                    { label: "Capacity", value: `${turf?.capacity || 14} players` },
                    { label: "Peak Hours", value: peakHours ? `${peakHours.start} - ${peakHours.end}` : "17:00 - 21:00" },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{item.label}</p>
                      <p className="text-sm mt-0.5" style={{ fontWeight: 600, color: "#0F172A" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Slot Grid */}
            <div className="p-6 rounded-2xl" style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
                  Select Time Slot
                </h3>
                <div className="text-xs px-3 py-1 rounded-full" style={{ background: "#F0FDF4", color: "#10B981", fontWeight: 600 }}>
                  {slots.filter(s => s.isAvailable).length} available
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot.startTime;
                  const isAvailable = slot.isAvailable !== false;
                  return (
                    <motion.button
                      key={slot.startTime}
                      whileHover={isAvailable ? { scale: 1.05 } : {}}
                      whileTap={isAvailable ? { scale: 0.95 } : {}}
                      onClick={() => isAvailable && setSelectedTime(slot.startTime)}
                      className="py-3 px-2 rounded-xl text-sm transition-all relative"
                      style={{
                        border: `2px solid ${isSelected ? "#10B981" : isAvailable ? (slot.isPeak ? "rgba(245,158,11,0.3)" : slot.isEarlyBird ? "rgba(59,130,246,0.3)" : "rgba(0,0,0,0.08)") : "rgba(0,0,0,0.05)"}`,
                        background: isSelected ? "#F0FDF4" : isAvailable ? "white" : "#F8FAFC",
                        color: isSelected ? "#10B981" : isAvailable ? "#0F172A" : "#CBD5E1",
                        fontWeight: isSelected ? 700 : 500,
                        cursor: isAvailable ? "pointer" : "not-allowed",
                        opacity: isAvailable ? 1 : 0.5,
                      }}
                    >
                      <div style={{ fontSize: "0.8rem" }}>{slot.startTime}</div>
                      <div className="mt-0.5" style={{ fontSize: "0.7rem", color: isSelected ? "#059669" : "#64748B", fontWeight: 600 }}>
                        ₹{slot.price}
                      </div>
                      {slot.isPeak && isAvailable && (
                        <span
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                          style={{ background: "#F59E0B", boxShadow: "0 0 6px rgba(245,158,11,0.5)" }}
                        />
                      )}
                      {slot.isEarlyBird && isAvailable && !slot.isPeak && (
                        <span
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                          style={{ background: "#3B82F6", boxShadow: "0 0 6px rgba(59,130,246,0.5)" }}
                        />
                      )}
                      {!isAvailable && (
                        <span className="block text-xs mt-0.5" style={{ color: "#CBD5E1", fontSize: "0.6rem" }}>Booked</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 mt-4 text-xs" style={{ color: "#94A3B8" }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: "#F59E0B" }} /> Peak Hours
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: "#3B82F6" }} /> Early Bird
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: "#10B981" }} /> Selected
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: "#CBD5E1" }} /> Unavailable
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl p-6 sticky top-28"
              style={{ background: "white", boxShadow: "0 8px 40px rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A", marginBottom: "20px" }}>
                Booking Details
              </h3>

              {/* Date Picker */}
              <div className="mb-4">
                <label className="block text-xs mb-1.5" style={{ color: "#64748B", fontWeight: 600 }}>📅 Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ border: "2px solid rgba(16,185,129,0.2)", background: "#F0FDF4", color: "#0F172A" }}
                />
              </div>

              {/* Sport Selector */}
              {turf?.sports?.length > 1 && (
                <div className="mb-4">
                  <label className="block text-xs mb-1.5" style={{ color: "#64748B", fontWeight: 600 }}>🏆 Sport</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                    style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#F8FAFC", color: "#0F172A", fontWeight: 600 }}
                  >
                    {turf.sports.map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Time */}
              {selectedTime ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl flex items-center justify-between"
                  style={{ background: "#F0FDF4", border: "2px solid rgba(16,185,129,0.2)" }}
                >
                  <div>
                    <p className="text-xs" style={{ color: "#64748B" }}>Selected Time</p>
                    <p className="text-sm" style={{ fontWeight: 700, color: "#10B981" }}>{selectedTime}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div
                      className="px-2.5 py-1 rounded-lg text-xs"
                      style={{ background: isPeak ? "#FFF7ED" : "#F0FDF4", color: isPeak ? "#F59E0B" : "#10B981", fontWeight: 600 }}
                    >
                      {isPeak ? "⚡ Peak" : "✨ Off-Peak"}
                    </div>
                    {isWeekend && (
                      <div className="px-2.5 py-1 rounded-lg text-xs" style={{ background: "#F5F3FF", color: "#8B5CF6", fontWeight: 600 }}>
                        📅 Wknd
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="mb-4 p-3 rounded-xl text-center text-sm" style={{ background: "#FFF7ED", border: "1px dashed #FDBA74", color: "#EA580C" }}>
                  👆 Select a time slot from the grid
                </div>
              )}

              {/* Duration */}
              <div className="mb-4">
                <label className="block text-xs mb-2" style={{ color: "#64748B", fontWeight: 600 }}>⏱ Duration</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setDuration(Math.max(1, duration - 1))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: "#F1F5F9", color: "#64748B" }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
                      {duration}
                    </span>
                    <span className="text-sm ml-1" style={{ color: "#64748B" }}>
                      hr{duration > 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => setDuration(Math.min(4, duration + 1))}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: "#10B981", color: "white" }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Players */}
              <div className="mb-5">
                <label className="block text-xs mb-2" style={{ color: "#64748B", fontWeight: 600 }}>👥 Player Count</label>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.1)" }}
                >
                  <Users className="w-4 h-4" style={{ color: "#64748B" }} />
                  <select
                    value={players}
                    onChange={(e) => setPlayers(parseInt(e.target.value))}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "#0F172A", fontWeight: 600 }}
                  >
                    {Array.from({ length: (turf?.capacity || 22) - 1 }, (_, i) => i + 2).map((n) => (
                      <option key={n} value={n}>{n} Players</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Breakdown */}
              {selectedTime && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 rounded-xl mb-5 space-y-2.5"
                  style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <h4 className="text-xs mb-3" style={{ fontWeight: 700, color: "#0F172A" }}>
                    💰 Dynamic Price Breakdown
                  </h4>

                  {/* Base Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#64748B" }}>Base Price</span>
                    <span className="text-xs" style={{ color: "#64748B", fontWeight: 600 }}>₹{basePrice}/hr</span>
                  </div>

                  {/* Peak Multiplier */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1" style={{ color: isPeak ? "#F59E0B" : "#10B981" }}>
                      {isPeak ? <><Zap className="w-3 h-3" /> Peak Hour Surge</> : "✨ Off-Peak Rate"}
                    </span>
                    <span className="text-xs" style={{ color: isPeak ? "#F59E0B" : "#10B981", fontWeight: 600 }}>
                      ×{peakMultiplier.toFixed(1)}
                    </span>
                  </div>

                  {/* Weekend Multiplier */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1" style={{ color: isWeekend ? "#8B5CF6" : "#64748B" }}>
                      <Calendar className="w-3 h-3" />
                      {isWeekend ? "Weekend Surge 📅" : "Weekday Rate"}
                    </span>
                    <span className="text-xs" style={{
                      color: weekendMultiplier > 1 ? "#8B5CF6" : "#64748B",
                      fontWeight: 600,
                    }}>
                      ×{weekendMultiplier.toFixed(2)}
                    </span>
                  </div>

                  {/* Demand Multiplier */}
                  {demandMultiplier > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs flex items-center gap-1" style={{ color: "#EF4444" }}>
                        <TrendingUp className="w-3 h-3" /> High Demand ({occupancyRate}% booked)
                      </span>
                      <span className="text-xs" style={{ color: "#EF4444", fontWeight: 600 }}>
                        ×{demandMultiplier.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Weather Multiplier */}
                  {weatherMultiplier !== 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs flex items-center gap-1" style={{ color: weatherMultiplier < 1 ? "#10B981" : "#F59E0B" }}>
                        {weatherMultiplier < 1 ? "🌧️ Weather Discount" : "☀️ Peak Weather"} ({weatherCondition})
                      </span>
                      <span className="text-xs" style={{ fontWeight: 600 }}>
                        ×{weatherMultiplier.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Smart Timing Multiplier */}
                  {timingMultiplier !== 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs flex items-center gap-1" style={{ color: timingMultiplier < 1 ? "#10B981" : "#EF4444" }}>
                        <Zap className="w-3 h-3" /> {timingMultiplier < 1 ? "Adv. Booking Gift" : "Urgency Surge"}
                      </span>
                      <span className="text-xs" style={{ fontWeight: 600 }}>
                        ×{timingMultiplier.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Early Bird Discount */}
                  {earlyBirdMultiplier < 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs flex items-center gap-1" style={{ color: "#16A34A" }}>
                        <Sunrise className="w-3 h-3" /> Early Bird Discount 🌅
                      </span>
                      <span className="text-xs" style={{ color: "#16A34A", fontWeight: 600 }}>
                        ×{earlyBirdMultiplier.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#64748B" }}>Duration</span>
                    <span className="text-xs" style={{ color: "#64748B", fontWeight: 600 }}>×{duration} hr{duration > 1 ? "s" : ""}</span>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-2.5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ fontWeight: 700, color: "#0F172A" }}>Total</span>
                      <motion.span
                        key={total}
                        initial={{ scale: 1.3, color: "#10B981" }}
                        animate={{ scale: 1, color: "#10B981" }}
                        className="text-xl"
                        style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
                      >
                        ₹{total.toLocaleString()}
                      </motion.span>
                    </div>
                    {earlyBirdMultiplier < 1 && (
                      <p className="text-xs mt-1 text-right" style={{ color: "#16A34A" }}>
                        You save ₹{Math.round(basePrice * peakMultiplier * weekendMultiplier * duration - total).toLocaleString()} with early bird! 🎉
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Confirm Button */}
              <motion.button
                whileHover={selectedTime ? { scale: 1.02 } : {}}
                whileTap={selectedTime ? { scale: 0.98 } : {}}
                onClick={handleConfirmBooking}
                disabled={!selectedTime || booking}
                className="w-full py-3.5 rounded-xl text-white text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: selectedTime ? "linear-gradient(135deg, #10B981, #059669)" : "#CBD5E1",
                  fontWeight: 700,
                  boxShadow: selectedTime ? "0 8px 25px rgba(16,185,129,0.35)" : "none",
                  cursor: selectedTime ? "pointer" : "not-allowed",
                }}
              >
                {booking && <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />}
                {selectedTime ? `Confirm Booking · ₹${total.toLocaleString()}` : "Select a Time Slot"}
              </motion.button>
              <p className="text-xs text-center mt-3" style={{ color: "#94A3B8" }}>
                Free cancellation up to 24 hours before the slot
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Animation */}
      <AnimatePresence>
        {booked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="rounded-3xl p-10 text-center"
              style={{ background: "white", maxWidth: "340px" }}
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
              <h3
                className="text-xl mb-2"
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}
              >
                Booking Confirmed! 🎉
              </h3>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Redirecting to team registration...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
