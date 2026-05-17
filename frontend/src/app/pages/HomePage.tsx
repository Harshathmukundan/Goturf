import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  MapPin,
  Calendar,
  ChevronDown,
  Search,
  Star,
  Zap,
  ArrowRight,
  Shield,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import api from "../services/api.js";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1759210720456-c9814f721479?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMHR1cmYlMjBmaWVsZCUyMG5pZ2h0JTIwbGlnaHRzfGVufDF8fHx8MTc3MjQyMjQ0NHww&ixlib=rb-4.1.0&q=80&w=1080";

const FALLBACK_TURFS = [
  {
    id: 1, _id: "1", name: "Champions Arena", location: { address: "Anna Nagar, Chennai", city: "Chennai" },
    rating: 4.8, totalReviews: 234, pricePerHour: 1200, sports: ["Football"],
    peakHourMultiplier: 1.3,
    peakHours: { start: "17:00", end: "21:00" },
    images: ["https://images.unsplash.com/photo-1682369368407-9ca29b7a96a3?w=400"],
  },
  {
    id: 2, _id: "2", name: "Thunder Court", location: { address: "T. Nagar, Chennai", city: "Chennai" },
    rating: 4.6, totalReviews: 187, pricePerHour: 800, sports: ["Basketball"],
    peakHourMultiplier: 1.25,
    peakHours: { start: "18:00", end: "22:00" },
    images: ["https://images.unsplash.com/photo-1762025858816-bb383940763a?w=400"],
  },
  {
    id: 3, _id: "3", name: "Smash Zone", location: { address: "Velachery, Chennai", city: "Chennai" },
    rating: 4.9, totalReviews: 312, pricePerHour: 600, sports: ["Badminton"],
    peakHourMultiplier: 1.2,
    peakHours: { start: "06:00", end: "09:00" },
    images: ["https://images.unsplash.com/photo-1771854400123-2a23cb720c04?w=400"],
  },
];

const stats = [
  { icon: <Users className="w-6 h-6" />, value: "50K+", label: "Active Players" },
  { icon: <CheckCircle className="w-6 h-6" />, value: "200+", label: "Verified Turfs" },
  { icon: <Clock className="w-6 h-6" />, value: "1M+", label: "Hours Booked" },
  { icon: <TrendingUp className="w-6 h-6" />, value: "98%", label: "Satisfaction" },
];

export function HomePage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("Chennai");
  const [date, setDate] = useState("");
  const [sport, setSport] = useState("");
  const [turfs, setTurfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isPeakNow = new Date().getHours() >= 17 && new Date().getHours() < 21;
  const isWeekend = [0, 6].includes(new Date().getDay());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await api.getTurfs({ city: "Chennai", limit: 6 });
      setTurfs(result.data || []);
    } catch {
      setTurfs(FALLBACK_TURFS);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("city", location);
    if (sport) params.set("sport", sport);
    if (date) params.set("date", date);
    navigate(`/turfs?${params.toString()}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Hero Section */}
      <section className="relative h-[600px] md:h-[700px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Football Turf" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,95,70,0.88) 0%, rgba(15,23,42,0.75) 60%, rgba(15,23,42,0.5) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6"
              style={{ background: "rgba(16,185,129,0.2)", color: "#6EE7B7", border: "1px solid rgba(16,185,129,0.3)" }}
            >
              <Zap className="w-4 h-4" fill="#6EE7B7" />
              Smart Booking Platform
            </div>
            <h1
              className="text-4xl md:text-6xl text-white mb-4 leading-tight"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}
            >
              Book Your Game.{" "}
              <span style={{ color: "#6EE7B7" }}>Play Without</span> Hassle.
            </h1>
            <p className="text-lg md:text-xl mb-8" style={{ color: "rgba(255,255,255,0.8)" }}>
              Real-time availability. Smart dynamic pricing. Zero confusion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/turfs"
                  className="px-8 py-4 rounded-2xl text-white inline-flex items-center gap-2 transition-all shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #10B981, #059669)",
                    fontWeight: 600,
                    fontSize: "1rem",
                    boxShadow: "0 8px 30px rgba(16,185,129,0.4)",
                  }}
                >
                  Book Now <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/turfs"
                  className="px-8 py-4 rounded-2xl inline-flex items-center gap-2 transition-all"
                  style={{
                    border: "2px solid rgba(255,255,255,0.6)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "1rem",
                    backdropFilter: "blur(10px)",
                    background: "rgba(255,255,255,0.1)",
                  }}
                >
                  Explore Turfs
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Floating Live Stats */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3"
        >
          {/* Live Pricing Card */}
          <div
            className="px-5 py-4 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
              <span className="text-white text-lg" style={{ fontWeight: 700 }}>Dynamic Pricing</span>
            </div>
            <p className="text-white text-xs" style={{ opacity: 0.8 }}>
              {isPeakNow ? "Peak hours active · Higher demand" : "Off-peak prices · Great deals"}
            </p>
            <div className="mt-2 px-2 py-1 rounded-lg text-xs" style={{
              background: isPeakNow ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)",
              color: isPeakNow ? "#FDE68A" : "#6EE7B7",
              fontWeight: 600,
              textAlign: "center",
            }}>
              {isPeakNow ? "🔥 Peak Hours" : "💰 Save Now"}
            </div>
          </div>
          {[
            { icon: "⚽", text: "Live Turfs", value: turfs.length > 0 ? `${turfs.length}+` : "47" },
            { icon: "🕐", text: isPeakNow ? "Peak Hours" : "Off-Peak", value: isPeakNow ? "🔥" : "💰" },
            { icon: "📅", text: isWeekend ? "Weekend" : "Weekday", value: isWeekend ? "Surge" : "Regular" },
          ].map((item, i) => (
            <div
              key={i}
              className="px-5 py-3 rounded-2xl flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-white text-xs" style={{ opacity: 0.8 }}>{item.text}</p>
                <p className="text-white" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{item.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Smart Search Bar */}
      <section className="relative z-20 -mt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl p-4 md:p-6"
          style={{
            background: "white",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Location */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ borderColor: "rgba(16,185,129,0.3)", background: "#F0FDF4" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#10B981" }}>
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "#64748B" }}>Location</p>
                <select
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: "#0F172A", fontWeight: 600 }}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option>Chennai</option>
                  <option>Mumbai</option>
                  <option>Bangalore</option>
                  <option>Hyderabad</option>
                  <option>Delhi</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#3B82F6" }}>
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "#64748B" }}>Date</p>
                <input
                  type="date"
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: "#0F172A", fontWeight: 600 }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Sport */}
            <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F59E0B" }}>
                <ChevronDown className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "#64748B" }}>Sport</p>
                <select
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: "#0F172A", fontWeight: 600 }}
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  <option value="">All Sports</option>
                  <option>Football</option>
                  <option>Cricket</option>
                  <option>Basketball</option>
                  <option>Badminton</option>
                  <option>Tennis</option>
                </select>
              </div>
            </div>

            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 rounded-xl text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: "0 8px 25px rgba(16,185,129,0.35)",
              }}
            >
              <Search className="w-5 h-5" />
              Search Turfs
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Pricing Status Banner (mobile) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 xl:hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
          style={{
            background: isPeakNow
              ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
              : "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" style={{ color: isPeakNow ? "#F59E0B" : "#10B981" }} />
            <div>
              <p className="text-sm" style={{ fontWeight: 700, color: "#0F172A" }}>
                {isPeakNow ? "🔥 Peak Hours Active" : "💰 Off-Peak Savings"}
              </p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                {isPeakNow ? "Higher demand pricing · 17:00–21:00" : "Great deals available now"}
                {isWeekend && " · Weekend surge active"}
              </p>
            </div>
          </div>
          <div className="text-xs px-3 py-1.5 rounded-full" style={{
            background: isPeakNow ? "#FEF9C3" : "#DCFCE7",
            color: isPeakNow ? "#CA8A04" : "#16A34A",
            fontWeight: 600,
          }}>
            {isPeakNow ? "Peak ×1.3" : "Standard ×1.0"}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl"
              style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)", color: "#10B981" }}
              >
                {stat.icon}
              </div>
              <p className="text-3xl" style={{ fontFamily: "Poppins,sans-serif", fontWeight: 700, color: "#0F172A" }}>
                {stat.value}
              </p>
              <p className="text-sm mt-1" style={{ color: "#64748B" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending Turfs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
              🌟 Trending Turfs
            </h2>
            <p className="mt-1" style={{ color: "#64748B" }}>
              Most popular spots in {location} right now
            </p>
          </div>
          <Link to="/turfs" className="hidden md:flex items-center gap-2 text-sm" style={{ color: "#10B981", fontWeight: 600 }}>
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array(3).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "#E2E8F0", height: 380 }} />
            ))
            : turfs.slice(0, 6).map((turf, i) => {
              const turfId = turf._id || turf.id;
              const pricePerHour = turf.pricePerHour || turf.pricing?.basePrice || 800;
              const peakMult = turf.peakHourMultiplier || 1.3;
              const weekendMult = isWeekend ? 1.15 : 1.0;
              const adjusted = isPeakNow
                ? Math.round(pricePerHour * peakMult * weekendMult)
                : Math.round(pricePerHour * weekendMult);
              const sportsList = turf.sports || [];

              return (
                <motion.div
                  key={turfId}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "white",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={turf.images?.[0] || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600"}
                      alt={turf.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    {/* Peak badge */}
                    {isPeakNow && (
                      <div
                        className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs text-white"
                        style={{ background: "#F59E0B", fontWeight: 600 }}
                      >
                        🔥 Peak Hours
                      </div>
                    )}
                    {/* Weekend badge */}
                    {isWeekend && (
                      <div
                        className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs text-white"
                        style={{ background: "#8B5CF6", fontWeight: 600 }}
                      >
                        📅 Weekend
                      </div>
                    )}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-20"
                      style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.5))" }}
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3
                          className="text-lg"
                          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}
                        >
                          {turf.name}
                        </h3>
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "#64748B" }}>
                          <MapPin className="w-3 h-3" />
                          {turf.location?.address || turf.location?.area}, {turf.location?.city || "Chennai"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg" style={{ fontFamily: "Poppins,sans-serif", fontWeight: 700, color: "#10B981" }}>
                          ₹{adjusted.toLocaleString()}
                        </p>
                        <p className="text-xs" style={{ color: "#64748B" }}>per hour</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" style={{ color: "#F59E0B" }} fill="#F59E0B" />
                        <span className="text-sm" style={{ fontWeight: 600, color: "#0F172A" }}>{turf.rating?.toFixed?.(1) || "4.5"}</span>
                        <span className="text-xs" style={{ color: "#64748B" }}>({turf.totalReviews || 0})</span>
                      </div>
                      <div className="flex gap-1">
                        {sportsList.slice(0, 2).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#F0FDF4", color: "#10B981", fontWeight: 600 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Link
                      to={`/turfs/${turfId}/slots`}
                      className="block w-full py-3 rounded-xl text-center text-sm text-white transition-all hover:shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #10B981, #059669)",
                        fontWeight: 600,
                        boxShadow: "0 4px 15px rgba(16,185,129,0.25)",
                      }}
                    >
                      Book Now
                    </Link>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #065F46, #0F172A)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl text-white mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Why Choose GoTurf?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)" }}>
              The smartest way to book sports facilities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Real-time Availability",
                desc: "See live slot availability and book instantly without waiting for confirmation.",
                color: "#10B981",
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Smart Dynamic Pricing",
                desc: "Prices adjust based on peak hours, weekends, and demand. Early bird discounts & off-peak savings!",
                color: "#3B82F6",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Secure Booking",
                desc: "100% secure payments with instant booking confirmation and easy cancellations.",
                color: "#F59E0B",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feature.color}25`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-white mb-2" style={{ fontFamily: "Poppins,sans-serif", fontWeight: 600 }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="p-10 rounded-3xl"
            style={{
              background: "linear-gradient(135deg, #10B981, #065F46)",
              boxShadow: "0 20px 60px rgba(16,185,129,0.3)",
            }}
          >
            <h2
              className="text-3xl md:text-4xl text-white mb-4"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
            >
              Ready to Play? 🎯
            </h2>
            <p className="mb-8" style={{ color: "rgba(255,255,255,0.85)" }}>
              Join 50,000+ players already using GoTurf. Book your first game in under 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth"
                className="px-8 py-4 rounded-2xl text-white"
                style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.5)", fontWeight: 600 }}
              >
                Create Free Account
              </Link>
              <Link
                to="/turfs"
                className="px-8 py-4 rounded-2xl"
                style={{ background: "white", color: "#10B981", fontWeight: 700 }}
              >
                Browse Turfs →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
