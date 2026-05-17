import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, MapPin, DollarSign, Activity, Zap, X, ArrowUpRight, Bell, ChevronDown, RefreshCw, Edit2, History, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { toast } from "sonner";

const navItems = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
  { icon: <MapPin className="w-5 h-5" />, label: "My Venues" },
  { icon: <History className="w-5 h-5" />, label: "Bookings Log" },
  { icon: <DollarSign className="w-5 h-5" />, label: "Earnings & Payouts" },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  confirmed: { color: "#10B981", bg: "#ECFDF5" },
  pending: { color: "#F59E0B", bg: "#FFF7ED" },
  cancelled: { color: "#EF4444", bg: "#FEF2F2" },
};

const paymentConfig: Record<string, { color: string; bg: string }> = {
  paid: { color: "#10B981", bg: "#ECFDF5" },
  pending: { color: "#F59E0B", bg: "#FFF7ED" },
  refunded: { color: "#94A3B8", bg: "#F1F5F9" },
};

function OwnerDashboardView({ stats, recentBookings, loading, refresh }: any) {
  const totalRevenue = stats?.totalRevenue || 0;
  const totalBookings = stats?.totalBookings || 0;
  const activeBookings = stats?.activeBookings || 0;

  const revenueChartData = stats?.revenueByMonth || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Revenue", value: totalRevenue > 0 ? `₹${(totalRevenue).toLocaleString()}` : "₹0", icon: <DollarSign className="w-6 h-6" />, color: "#10B981", bgColor: "#ECFDF5", subLabel: "Lifetime earnings" },
          { label: "Active Operations", value: activeBookings.toString(), icon: <Activity className="w-6 h-6" />, color: "#3B82F6", bgColor: "#EFF6FF", subLabel: "Pending & Confirmed" },
          { label: "Total Bookings", value: totalBookings.toLocaleString(), icon: <History className="w-6 h-6" />, color: "#8B5CF6", bgColor: "#F5F3FF", subLabel: "Lifetime tickets" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-2xl p-5" style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: stat.bgColor, color: stat.color }}>{stat.icon}</div>
            </div>
            <p className="text-2xl font-bold font-poppins text-slate-900">{stat.value}</p>
            <p className="text-xs mt-0.5 font-semibold text-slate-500">{stat.label}</p>
            <p className="text-xs mt-0.5 text-slate-300">{stat.subLabel}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl p-6 bg-white shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-900 font-poppins">Monthly Property Revenue</h3>
        <p className="text-xs text-slate-400 mb-5">Calculated across all your registered turfs</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueChartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="_id.month" tickFormatter={(m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
            <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} name="Revenue (₹)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 font-poppins">Recent Turf Bookings</h3>
            <p className="text-xs text-slate-400 mt-0.5">{recentBookings.length > 0 ? `Monitoring ${recentBookings.length} latest operations` : "No bookings logged yet"}</p>
          </div>
          <button onClick={refresh} className="px-4 py-2 rounded-xl text-xs bg-emerald-50 text-emerald-600 font-semibold flex items-center gap-2">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Sync Log
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Booking ID", "Venue", "Player Details", "Schedule", "Amount", "Status", "Payment"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs text-slate-400 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking: any) => {
                const sc = statusConfig[booking.status] || statusConfig.pending;
                const pc = paymentConfig[booking.payment?.status || "pending"] || paymentConfig.pending;
                return (
                  <tr key={booking.id || Math.random()} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5"><span className="text-xs font-mono text-slate-500">#{booking.id || booking.bookingId || "BNK99"}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm font-semibold text-slate-900">{booking.turf_data?.name || "—"}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{booking.user_data?.name || "User"}</span>
                        <span className="text-xs text-slate-400 ml-1">{booking.user_data?.phone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs font-medium text-slate-600">{booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : "—"} · <b className="text-slate-900">{booking.start_time}</b></span></td>
                    <td className="px-5 py-3.5"><span className="text-sm font-bold text-slate-900">₹{(booking.total_price || 0).toLocaleString()}</span></td>
                    <td className="px-5 py-3.5"><span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>{booking.status}</span></td>
                    <td className="px-5 py-3.5"><span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: pc.bg, color: pc.color }}>{(booking.payment_status || "pending")}</span></td>
                  </tr>
                );
              })}
              {recentBookings.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No active tickets</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MyVenuesView() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTurfs(); }, []);
  const loadTurfs = async () => {
    try {
      setLoading(true);
      const res = await api.getOwnerTurfs();
      setTurfs(res.data);
    } catch (err: any) { toast.error("Failed to load your venues"); }
    finally { setLoading(false); }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.updateTurf(id, { is_active: !currentStatus });
      toast.success(`Venue ${!currentStatus ? 'Activated' : 'Disabled'}`);
      loadTurfs();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800">My Venues</h2>
          <p className="text-sm text-slate-500 mt-1">Manage listings and operational statuses for your properties.</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors">
          + Request New Listing
        </button>
      </div>
      
      {loading ? <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {turfs.map((turf: any) => (
            <div key={turf.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row h-full">
               <div className="md:w-2/5 h-48 md:h-auto bg-slate-200 relative">
                 {turf.images?.[0] ? <img src={turf.images[0]} alt="turf" className="w-full h-full object-cover" /> : <div className="absolute inset-0 bg-emerald-900/10" />}
                 <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded px-2 py-1 text-xs font-bold text-slate-900 shadow-sm border border-slate-100">
                   ₹{turf.price_per_hour}/hr
                 </div>
               </div>
               <div className="p-5 md:w-3/5 flex flex-col justify-between">
                 <div>
                   <div className="flex justify-between items-start mb-1">
                     <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{turf.name}</h3>
                   </div>
                   <p className="text-sm text-slate-500 flex items-center gap-1 mb-4"><MapPin className="w-3 h-3"/> {turf.location_area}, {turf.location_city}</p>
                   
                   <div className="space-y-1 mb-6">
                     <p className="text-xs text-slate-500">Peak Hours: <span className="font-semibold text-slate-700">{turf.peak_hours?.length ? turf.peak_hours.join(", ") : "None"}</span></p>
                     <p className="text-xs text-slate-500">Multiplier Override: <span className="font-semibold text-slate-700">{turf.peak_hour_multiplier}x</span></p>
                   </div>
                 </div>
                 
                 <div className="flex gap-2">
                   <button 
                     onClick={() => handleToggleStatus(turf.id, turf.is_active)}
                     className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${turf.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                   >
                     <Activity className="w-4 h-4"/> {turf.is_active ? "Disable" : "Activate"}
                   </button>
                   <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"><Edit2 className="w-4 h-4"/></button>
                 </div>
               </div>
            </div>
          ))}
          {turfs.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <h3 className="font-bold text-slate-700 text-lg">No properties claim confirmed yet.</h3>
              <p className="text-slate-500 mt-2">Contact platform administrators to map an existing turf to your owner account.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingsLogView({ recentBookings, loading, refresh }: any) {
  const [filter, setFilter] = useState("all");
  
  const filtered = filter === "all" ? recentBookings : recentBookings.filter((b: any) => b.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800">Operations Log</h2>
          <p className="text-sm text-slate-500 mt-1">Full history of reservations across your facilities.</p>
        </div>
        <div className="flex items-center gap-2">
           <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 ring-indigo-500 bg-white"
           >
             <option value="all">All Statuses</option>
             <option value="confirmed">Confirmed</option>
             <option value="pending">Pending Only</option>
             <option value="cancelled">Cancelled</option>
           </select>
           <button onClick={refresh} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition">
             <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
           </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Booking ID", "Venue", "Player Details", "Schedule", "Amount", "Status", "Actions"].map((h) => <th key={h} className="text-left px-5 py-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking: any) => {
                const sc = statusConfig[booking.status] || statusConfig.pending;
                return (
                  <tr key={booking.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4"><span className="text-xs font-mono font-bold text-slate-400">#{booking.id.split('-')[0]}</span></td>
                    <td className="px-5 py-4"><span className="text-sm font-bold text-slate-900">{booking.turf_data?.name}</span></td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-700">{booking.user_data?.name}</p>
                      <p className="text-xs text-slate-400">{booking.user_data?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded">{booking.start_time}</span>
                        <span className="text-xs">{new Date(booking.booking_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className="text-sm font-bold text-slate-900">₹{booking.total_price}</span></td>
                    <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight" style={{ background: sc.bg, color: sc.color }}>{booking.status}</span></td>
                    <td className="px-5 py-4">
                       <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-400 transition-colors"><ChevronDown className="w-4 h-4"/></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-20 text-slate-400 italic">No records found matching filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OwnerEarningsView({ stats }: any) {
  const totalRevenue = stats?.totalRevenue || 0;
  const platformFee = totalRevenue * 0.025;
  const netSettlement = totalRevenue - platformFee;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Gross Earnings</p>
              <h3 className="text-3xl font-bold text-slate-900 font-poppins">₹{totalRevenue.toLocaleString()}</h3>
           </div>
           <DollarSign className="absolute -bottom-2 -right-2 w-24 h-24 text-slate-50 opacity-10" />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Estimated Net Payout</p>
              <h3 className="text-3xl font-bold text-indigo-600 font-poppins">₹{netSettlement.toLocaleString()}</h3>
           </div>
           <Activity className="absolute -bottom-2 -right-2 w-24 h-24 text-indigo-50 opacity-10" />
        </div>
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-sm relative overflow-hidden text-white">
           <div className="relative z-10">
              <p className="text-xs font-bold text-indigo-200 uppercase mb-1">Next Settlement Date</p>
              <h3 className="text-2xl font-bold font-poppins">April 15th, 2026</h3>
           </div>
           <Zap className="absolute -bottom-2 -right-2 w-24 h-24 text-white opacity-10" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 bg-gradient-to-br from-white to-amber-50">
        <h2 className="text-xl font-bold font-poppins text-amber-900 mb-2">Automated Payouts</h2>
        <p className="text-sm text-amber-800 mb-6 max-w-2xl">GoTurf operates a bi-weekly clearing process. Earnings are transferred automatically to your registered bank account minus the 2.5% platform maintenance fee.</p>
        
        <div className="p-4 bg-white rounded-xl border border-amber-100 flex items-center justify-between max-w-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">BANK</div>
            <div>
              <p className="text-sm font-bold text-slate-800">State Bank of India</p>
              <p className="text-xs text-slate-500">Account •••• 9812 | IFSC SBIN0021</p>
            </div>
          </div>
          <button className="text-xs font-bold text-indigo-600 hover:underline">Edit Details</button>
        </div>
      </div>
      
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 font-poppins">Settlement History</h3>
          <span className="text-xs text-slate-400 italic">History tracking enabled from Jan 2024</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
               <tr className="bg-slate-50 border-b border-slate-100">
                 {["Settlement ID", "Date Range", "Gross Amount", "Platform Fee", "Net Transfer", "Status"].map((h) => <th key={h} className="text-left px-6 py-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>)}
               </tr>
            </thead>
            <tbody>
               {[
                 { id: "STL-9921", range: "Mar 1 - Mar 15", gross: 42000, fee: 1050, net: 40950, status: "completed" },
                 { id: "STL-9844", range: "Feb 15 - Feb 28", gross: 38500, fee: 962, net: 37538, status: "completed" },
               ].map((settlement) => (
                 <tr key={settlement.id} className="border-b border-slate-50">
                   <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{settlement.id}</td>
                   <td className="px-6 py-4 text-sm text-slate-700">{settlement.range}</td>
                   <td className="px-6 py-4 text-sm font-medium">₹{settlement.gross.toLocaleString()}</td>
                   <td className="px-6 py-4 text-sm text-red-500">-₹{settlement.fee.toLocaleString()}</td>
                   <td className="px-6 py-4 text-sm font-bold text-emerald-600">₹{settlement.net.toLocaleString()}</td>
                   <td className="px-6 py-4"><span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">COMPLETED</span></td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- Main Shell ---

export function OwnerDashboardPage() {
  const { user } = useAuth() as any;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        api.getOwnerStats().catch(() => null),
        api.getOwnerBookings({ limit: 10 }).catch(() => null),
      ]);
      if (statsRes?.data) setStats(statsRes.data);
      if (bookingsRes?.data) setRecentBookings(bookingsRes.data);
    } catch {
      toast.error("Failed to sync structural log");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const renderContent = () => {
    switch (activeNav) {
      case "Dashboard": return <OwnerDashboardView stats={stats} recentBookings={recentBookings} loading={loading} refresh={fetchDashboardData} />;
      case "Bookings Log": return <BookingsLogView recentBookings={recentBookings} loading={loading} refresh={fetchDashboardData} />;
      case "My Venues": return <MyVenuesView />;
      case "Earnings & Payouts": return <OwnerEarningsView stats={stats} />;
      default: return <OwnerDashboardView stats={stats} recentBookings={recentBookings} loading={loading} refresh={fetchDashboardData} />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-inter">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} style={{ background: "linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)" }}>
        <div className="flex items-center justify-between p-6 border-b border-indigo-400/20">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/25">
              <Zap className="w-5 h-5 text-indigo-300" fill="currentColor" />
            </div>
            <span className="text-white text-xl font-bold font-poppins">TurfBase</span>
          </div>
          <button className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-indigo-500/15 border border-indigo-400/20">
          <p className="text-[10px] uppercase font-bold text-indigo-300 mb-0.5 tracking-wider">Property Owner</p>
          <p className="text-white text-sm font-semibold break-all">{user?.name || "Owner"}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { setActiveNav(item.label); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left font-medium ${activeNav === item.label ? 'bg-indigo-500/30 text-indigo-200 border-l-4 border-indigo-400 shadow-inner' : 'text-indigo-200/50 hover:bg-white/5 hover:text-indigo-200 border-l-4 border-transparent'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-400/20">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-indigo-200/50 hover:text-indigo-100 transition-colors">
            <ArrowUpRight className="w-5 h-5" /> Exit Portal
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold font-poppins text-slate-900">{activeNav}</h1>
              <p className="text-xs text-slate-400">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-slate-100 transition"><Bell className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-indigo-600">
                {user?.name?.charAt(0) || "O"}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC]">
          <AnimatePresence mode="wait">
            <motion.div key={activeNav} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
