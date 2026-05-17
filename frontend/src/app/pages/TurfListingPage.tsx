import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Search,
  MapPin,
  Star,
  Sliders,
  ChevronDown,
  X,
  Filter,
  Loader2,
  TrendingUp,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
import api from "../services/api.js";

const sports = ["All", "Football", "Cricket", "Basketball", "Badminton", "Tennis"];

export function TurfListingPage() {
  const [searchParams] = useSearchParams();
  const [turfs, setTurfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedSport, setSelectedSport] = useState(searchParams.get("sport") || "All");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "Chennai");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const isPeakNow = new Date().getHours() >= 17 && new Date().getHours() < 21;
  const isWeekend = [0, 6].includes(new Date().getDay());

  useEffect(() => {
    fetchTurfs();
  }, [selectedSport, selectedCity, priceRange]);

  const fetchTurfs = async () => {
    setLoading(true);
    try {
      const params: any = { city: selectedCity, limit: 20 };
      if (selectedSport !== "All") params.sport = selectedSport;
      if (searchQuery) params.search = searchQuery;
      if (priceRange[1] < 2000) params.maxPrice = priceRange[1];

      const result = await api.getTurfs(params);
      setTurfs(result.data || []);
      setPagination(result.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setTurfs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTurfs();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {/* Top search bar */}
      <div
        className="sticky top-16 z-30 border-b py-4"
        style={{ background: "rgba(248,250,252,0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(0,0,0,0.08)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <div
            className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border"
            style={{ background: "white", borderColor: "rgba(0,0,0,0.1)" }}
          >
            <Search className="w-4 h-4" style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search turfs, locations..."
              className="flex-1 outline-none bg-transparent text-sm"
              style={{ color: "#0F172A" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setTimeout(fetchTurfs, 0); }}>
                <X className="w-4 h-4" style={{ color: "#94A3B8" }} />
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {sports.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSport(s)}
                className="px-4 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: selectedSport === s ? "#10B981" : "white",
                  color: selectedSport === s ? "white" : "#64748B",
                  border: `1px solid ${selectedSport === s ? "#10B981" : "rgba(0,0,0,0.1)"}`,
                  fontWeight: selectedSport === s ? 600 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm"
            style={{ background: "white", borderColor: "rgba(0,0,0,0.1)", color: "#64748B" }}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "fixed inset-0 z-50 flex" : "hidden"} md:relative md:flex md:w-72 flex-shrink-0`}
        >
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <div
            className="relative z-10 w-72 h-fit rounded-2xl p-6 space-y-6"
            style={{ background: "white", boxShadow: "0 4px 30px rgba(0,0,0,0.1)" }}
          >
            <div className="flex items-center justify-between">
              <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
                Filters
              </h3>
              <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" style={{ color: "#94A3B8" }} />
              </button>
            </div>

            {/* City */}
            <div>
              <p className="text-sm mb-3" style={{ fontWeight: 600, color: "#0F172A" }}>
                City
              </p>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl outline-none text-sm"
                style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#F8FAFC", color: "#0F172A", fontWeight: 600 }}
              >
                {["Chennai", "Mumbai", "Bangalore", "Hyderabad", "Delhi"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sport */}
            <div>
              <p className="text-sm mb-3" style={{ fontWeight: 600, color: "#0F172A" }}>
                Sport Type
              </p>
              <div className="space-y-2">
                {sports.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSport(s)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-left"
                    style={{
                      background: selectedSport === s ? "#F0FDF4" : "transparent",
                      color: selectedSport === s ? "#10B981" : "#64748B",
                      fontWeight: selectedSport === s ? 600 : 400,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: selectedSport === s ? "#10B981" : "#CBD5E1" }}
                    >
                      {selectedSport === s && (
                        <div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
                      )}
                    </div>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm" style={{ fontWeight: 600, color: "#0F172A" }}>
                  Max Price (per hr)
                </p>
                <span className="text-sm" style={{ color: "#10B981", fontWeight: 700 }}>
                  ₹{priceRange[1]}
                </span>
              </div>
              <input
                type="range"
                min={400}
                max={2000}
                step={100}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: "#94A3B8" }}>
                <span>₹400</span>
                <span>₹2000</span>
              </div>
            </div>

            {/* Pricing info */}
            <div className="p-3 rounded-xl" style={{
              background: isPeakNow ? "#FFF7ED" : "#F0FDF4",
              border: `1px solid ${isPeakNow ? "#FED7AA" : "#D1FAE5"}`,
            }}>
              <p className="text-sm mb-1 flex items-center gap-1" style={{ fontWeight: 600, color: isPeakNow ? "#9A3412" : "#065F46" }}>
                {isPeakNow ? <TrendingUp className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {isPeakNow ? "🔥 Peak Hours Active" : "💰 Off-Peak Pricing"}
              </p>
              <p className="text-xs" style={{ color: isPeakNow ? "#C2410C" : "#059669" }}>
                {isPeakNow ? "Higher demand pricing · 5PM–9PM" : "Great deals available now!"}
                {isWeekend && " · Weekend surge active"}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: "#64748B" }}>
              Showing <span style={{ fontWeight: 700, color: "#0F172A" }}>{turfs.length}</span> turfs
              {pagination.total > 0 && ` of ${pagination.total}`}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "#E2E8F0", height: 380 }} />
              ))}
            </div>
          )}

          {/* Turfs Grid */}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {turfs.map((turf, i) => {
                const turfId = turf._id || turf.id;
                const pricePerHour = turf.pricePerHour || 800;
                const peakMult = turf.peakHourMultiplier || 1.3;
                const weekendMult = isWeekend ? 1.15 : 1.0;
                const adjusted = isPeakNow
                  ? Math.round(pricePerHour * peakMult * weekendMult)
                  : Math.round(pricePerHour * weekendMult);
                const sportsList = turf.sports || [];

                return (
                  <motion.div
                    key={turfId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -5 }}
                    className="rounded-2xl overflow-hidden group"
                    style={{
                      background: "white",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={turf.images?.[0] || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600"}
                        alt={turf.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.5))" }}
                      />
                      {isPeakNow && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs text-white" style={{ background: "#F59E0B", fontWeight: 600 }}>
                          🔥 Peak Hours
                        </div>
                      )}
                      {isWeekend && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs text-white" style={{ background: "#8B5CF6", fontWeight: 600 }}>
                          📅 Weekend
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
                          {turf.surface || "Artificial Grass"}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: "#10B981", color: "white", fontWeight: 600 }}>
                          ✓ Available
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-base" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}>
                            {turf.name}
                          </h3>
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "#64748B" }}>
                            <MapPin className="w-3 h-3" />
                            {turf.location?.address || turf.location?.area}, {turf.location?.city || "Chennai"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#10B981" }}>
                            ₹{adjusted.toLocaleString()}
                          </p>
                          <p className="text-xs" style={{ color: "#64748B" }}>per hour</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} fill="#F59E0B" />
                        <span className="text-xs" style={{ fontWeight: 600, color: "#0F172A" }}>{turf.rating?.toFixed?.(1) || "4.5"}</span>
                        <span className="text-xs" style={{ color: "#94A3B8" }}>({turf.totalReviews || 0} reviews)</span>
                        <div className="flex-1" />
                        <div className="flex gap-1">
                          {sportsList.slice(0, 2).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#F0FDF4", color: "#10B981", fontWeight: 600 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Quick slot preview */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: isPeakNow ? "#FFF7ED" : "#F8FAFC", border: `1px solid ${isPeakNow ? "#FED7AA" : "rgba(0,0,0,0.07)"}` }}>
                          <span style={{ color: "#64748B" }}>
                            {isPeakNow ? "Peak (5PM–9PM)" : "Off-Peak"}
                          </span>
                          <span style={{ fontWeight: 700, color: isPeakNow ? "#F59E0B" : "#10B981" }}>
                            ₹{adjusted.toLocaleString()}/hr
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.07)" }}>
                          <span style={{ color: "#64748B" }}>Base Price</span>
                          <span style={{ fontWeight: 700, color: "#10B981" }}>
                            ₹{pricePerHour.toLocaleString()}/hr
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/turfs/${turfId}/slots`}
                        className="block w-full py-2.5 rounded-xl text-center text-sm transition-all hover:shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, #10B981, #059669)",
                          color: "white",
                          fontWeight: 600,
                        }}
                      >
                        View Slots →
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!loading && turfs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, color: "#0F172A" }}>
                No turfs found
              </p>
              <p className="text-sm mt-2" style={{ color: "#64748B" }}>
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
