import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  LayoutDashboard, MapPin, DollarSign, Users, BarChart2, Settings, TrendingUp, Activity, Zap, X, ArrowUpRight, Bell, ChevronDown, RefreshCw, CheckCircle2, MoreVertical, Edit2, Trash2, Menu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { toast } from "sonner";

// --- Data Constants ---
const peakVsOffPeak = [
  { name: "Peak Hours", value: 62, color: "#F59E0B" },
  { name: "Off-Peak", value: 38, color: "#10B981" },
];
const pricingData = [
  { day: "Mon", demandPricing: 1.05, earlyBird: 0.95 },
  { day: "Tue", demandPricing: 1.0, earlyBird: 0.95 },
  { day: "Wed", demandPricing: 1.05, earlyBird: 0.95 },
  { day: "Thu", demandPricing: 1.1, earlyBird: 0.95 },
  { day: "Fri", demandPricing: 1.15, earlyBird: 0.95 },
  { day: "Sat", demandPricing: 1.25, earlyBird: 0.95 },
  { day: "Sun", demandPricing: 1.25, earlyBird: 0.95 },
];
const navItems = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
  { icon: <MapPin className="w-5 h-5" />, label: "Turfs" },
  { icon: <Users className="w-5 h-5" />, label: "Users" },
  { icon: <BarChart2 className="w-5 h-5" />, label: "Analytics" },
  { icon: <DollarSign className="w-5 h-5" />, label: "Pricing Rules" },
  { icon: <Settings className="w-5 h-5" />, label: "Settings" },
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

// --- Sub Views ---

function DashboardView({ stats, recentBookings, loading, refresh }: any) {
  const totalRevenue = stats?.totalRevenue || 0;
  const totalBookings = stats?.totalBookings || 0;
  const totalUsers = stats?.totalUsers || 0;
  const occupancyRate = stats?.averageOccupancy || 0;

  const revenueChartData = stats?.revenueByMonth || [
    { month: "Oct", revenue: 185000, bookings: 145 },
    { month: "Nov", revenue: 220000, bookings: 178 },
    { month: "Dec", revenue: 310000, bookings: 245 },
    { month: "Jan", revenue: 280000, bookings: 220 },
    { month: "Feb", revenue: 340000, bookings: 268 },
    { month: "Mar", revenue: 420000, bookings: 312 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: totalRevenue > 0 ? `₹${(totalRevenue / 1000).toFixed(0)}K` : "₹0", change: "+18%", icon: <DollarSign className="w-6 h-6" />, color: "#10B981", bgColor: "#ECFDF5", subLabel: "All time" },
          { label: "Active Bookings", value: totalBookings.toString(), change: "+24%", icon: <Activity className="w-6 h-6" />, color: "#3B82F6", bgColor: "#EFF6FF", subLabel: "Total bookings" },
          { label: "Users", value: totalUsers.toLocaleString(), change: "+31%", icon: <Users className="w-6 h-6" />, color: "#8B5CF6", bgColor: "#F5F3FF", subLabel: "Registered users" },
          { label: "Occupancy Rate", value: `${occupancyRate}%`, change: "+5%", icon: <TrendingUp className="w-6 h-6" />, color: "#F59E0B", bgColor: "#FFF7ED", subLabel: "Avg across turfs" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-2xl p-5" style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: stat.bgColor, color: stat.color }}>{stat.icon}</div>
              <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "#ECFDF5", color: "#10B981", fontWeight: 600 }}><ArrowUpRight className="w-3 h-3" />{stat.change}</span>
            </div>
            <p className="text-2xl font-bold font-poppins text-slate-900">{stat.value}</p>
            <p className="text-xs mt-0.5 font-semibold text-slate-500">{stat.label}</p>
            <p className="text-xs mt-0.5 text-slate-300">{stat.subLabel}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl p-6 bg-white shadow-sm">
          <h3 className="font-bold text-slate-900 font-poppins">Revenue Overview</h3>
          <p className="text-xs text-slate-400 mb-5">Monthly revenue & bookings</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v: number, name: string) => [name === "revenue" ? `₹${v.toLocaleString()}` : v, name === "revenue" ? "Revenue" : "Bookings"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="bookings" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-6 bg-white shadow-sm">
          <h3 className="font-bold text-slate-900 font-poppins mb-1">Booking Split</h3>
          <p className="text-xs text-slate-400 mb-5">Peak vs Off-Peak hours</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={peakVsOffPeak} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {peakVsOffPeak.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {peakVsOffPeak.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: item.color }} /><span className="text-xs text-slate-500">{item.name}</span></div>
                <span className="text-xs font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 font-poppins">Recent Bookings</h3>
            <p className="text-xs text-slate-400 mt-0.5">{recentBookings.length > 0 ? `Showing ${recentBookings.length} latest bookings` : "Latest transactions across all turfs"}</p>
          </div>
          <button onClick={refresh} className="px-4 py-2 rounded-xl text-xs bg-emerald-50 text-emerald-600 font-semibold flex items-center gap-2">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Booking ID", "Turf", "Player", "Date & Time", "Amount", "Status", "Payment"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs text-slate-400 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking: any) => {
                const sc = statusConfig[booking.status] || statusConfig.pending;
                const pc = paymentConfig[booking.payment?.status || "pending"] || paymentConfig.pending;
                return (
                  <tr key={booking._id || Math.random()} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5"><span className="text-xs font-mono text-slate-500">#{booking.id || booking.bookingId || "BNK99"}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm font-semibold text-slate-900">{booking.turfs?.name || booking.turf?.name || "—"}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white font-bold bg-gradient-to-br from-emerald-500 to-emerald-700">{(booking.users?.name || "U").charAt(0)}</div>
                        <span className="text-sm text-slate-500">{booking.users?.name || "User"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs text-slate-500">{booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : "—"} · {booking.start_time || "—"}</span></td>
                    <td className="px-5 py-3.5"><span className="text-sm font-bold text-slate-900">₹{(booking.total_price || 0).toLocaleString()}</span></td>
                    <td className="px-5 py-3.5"><span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>{booking.status}</span></td>
                    <td className="px-5 py-3.5"><span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: pc.bg, color: pc.color }}>{(booking.payment_status || "pending")}</span></td>
                  </tr>
                );
              })}
              {recentBookings.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No bookings yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TurfsAdminView() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTurfs(); }, []);
  const loadTurfs = async () => {
    try {
      setLoading(true);
      const res = await api.getTurfs();
      setTurfs(res.data);
    } catch (err: any) { toast.error("Failed to load turfs"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800">Manage Turfs</h2>
          <p className="text-sm text-slate-500 mt-1">Add, edit, or disable sports venues.</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors">
          + Add New Turf
        </button>
      </div>
      
      {loading ? <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {turfs.map((turf: any) => (
            <div key={turf.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
               <div className="h-40 bg-slate-200 relative">
                 {turf.images?.[0] ? <img src={turf.images[0]} alt="turf" className="w-full h-full object-cover" /> : <div className="absolute inset-0 bg-emerald-900/10" />}
                 <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-slate-800">
                   ₹{turf.price_per_hour}/hr
                 </div>
               </div>
               <div className="p-5">
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{turf.name}</h3>
                   <div className={`px-2 py-0.5 rounded text-xs font-bold ${turf.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                     {turf.is_active ? "Active" : "Disabled"}
                   </div>
                 </div>
                 <p className="text-sm text-slate-500 flex items-center gap-1 mb-4"><MapPin className="w-4 h-4"/> {turf.location_area}, {turf.location_city}</p>
                 <div className="flex gap-2">
                   <button className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"><Edit2 className="w-4 h-4"/> Edit</button>
                   <button className="flex-1 py-2 border border-red-100 bg-red-50 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-100 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4"/> Delete</button>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersAdminView() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAllUsers();
      setUsersList(res.data);
    } catch (err: any) { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUserRole(id, newRole);
      toast.success(`User role updated to ${newRole}`);
      loadUsers();
    } catch (err) { toast.error("Failed to update role"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold font-poppins text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage platform users and assign admin privileges.</p>
        </div>
      </div>
      
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
        {loading ? <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["User Details", "Contact", "Location", "Joined", "Role", "Actions"].map((h) => <th key={h} className="text-left px-6 py-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {usersList.map((usr: any) => (
                  <tr key={usr.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-gradient-to-br from-indigo-500 to-purple-600">
                            {(usr.name || "U").charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{usr.name}</p>
                            <p className="text-xs text-slate-500">ID: {usr.id.split('-')[0]}</p>
                          </div>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 font-medium">{usr.email}</p>
                        <p className="text-xs text-slate-500">{usr.phone || "No phone"}</p>
                     </td>
                     <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{usr.location_city || "N/A"}</p>
                     </td>
                     <td className="px-6 py-4">
                        <p className="text-sm text-slate-500">{new Date(usr.created_at).toLocaleDateString()}</p>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${usr.role==='admin'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{usr.role.toUpperCase()}</span>
                     </td>
                     <td className="px-6 py-4">
                        <button onClick={() => handleRoleChange(usr.id, usr.role)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-white text-slate-600 shadow-sm transition-all text-nowrap">
                          {usr.role === 'admin' ? "Demote to User" : "Make Admin"}
                        </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function AnalyticsAdminView() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center py-24">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-poppins text-slate-800">Advanced Analytics Hub</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">This module connects natively to big query and will feature deep geographical heatmaps and cohort retention graphs in V2.</p>
      </div>
    </div>
  )
}

function PricingRulesView() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold font-poppins text-slate-800 mb-6">Global Pricing Multipliers</h2>
        
        <div className="space-y-6 max-w-xl">
           <div className="p-5 border border-amber-200 bg-amber-50 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-24 h-24 text-amber-500"/></div>
              <h3 className="font-bold text-amber-900 mb-1 relative z-10">Peak Hours Surge Multiplier</h3>
              <p className="text-sm text-amber-700 mb-4 relative z-10">Automatically multiply base prices between 6PM and 11PM.</p>
              <div className="flex gap-4 relative z-10">
                <input type="number" defaultValue={1.25} step="0.05" className="w-24 px-4 py-2 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 ring-amber-500 font-bold text-slate-900" />
                <button className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors">Save Rule</button>
              </div>
           </div>

           <div className="p-5 border border-emerald-200 bg-emerald-50 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-24 h-24 text-emerald-500"/></div>
              <h3 className="font-bold text-emerald-900 mb-1 relative z-10">Early Bird Discount</h3>
              <p className="text-sm text-emerald-700 mb-4 relative z-10">Fractional multiplier applied for slots booked 7+ days in advance.</p>
              <div className="flex gap-4 relative z-10">
                <input type="number" defaultValue={0.90} step="0.05" className="w-24 px-4 py-2 rounded-lg border border-emerald-300 focus:outline-none focus:ring-2 ring-emerald-500 font-bold text-slate-900" />
                <button className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors">Save Rule</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
        <h2 className="text-xl font-bold font-poppins text-slate-800 mb-6">Platform Configuration</h2>
        
        <form className="space-y-6">
           <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">Platform Name</label>
             <input type="text" defaultValue="GoTurf" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-medium" />
           </div>
           <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">Support Email Address</label>
             <input type="email" defaultValue="support@goturf.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all font-medium" />
           </div>
           <div className="pt-4 flex items-center justify-between border-t border-slate-100">
             <div>
               <p className="font-bold text-slate-800">Maintenance Mode</p>
               <p className="text-sm text-slate-500">Temporarily block all new bookings.</p>
             </div>
             <div className="w-12 h-6 bg-slate-200 rounded-full cursor-pointer relative"><div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div></div>
           </div>
           <button type="button" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Update Settings</button>
        </form>
      </div>
    </div>
  )
}

// --- Main Shell ---

export function AdminDashboardPage() {
  const { user } = useAuth();
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
        api.getAdminStats().catch(() => null),
        api.getAllBookings({ limit: 8 }).catch(() => null),
      ]);
      if (statsRes?.data) setStats(statsRes.data);
      if (bookingsRes?.data) setRecentBookings(bookingsRes.data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const renderContent = () => {
    switch (activeNav) {
      case "Dashboard": return <DashboardView stats={stats} recentBookings={recentBookings} loading={loading} refresh={fetchDashboardData} />;
      case "Turfs": return <TurfsAdminView />;
      case "Users": return <UsersAdminView />;
      case "Analytics": return <AnalyticsAdminView />;
      case "Pricing Rules": return <PricingRulesView />;
      case "Settings": return <SettingsView />;
      default: return <DashboardView stats={stats} recentBookings={recentBookings} loading={loading} refresh={fetchDashboardData} />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-inter">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} style={{ background: "linear-gradient(180deg, #0F172A 0%, #065F46 100%)" }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/25">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-white text-xl font-bold font-poppins">GoTurf</span>
          </div>
          <button className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-4 mt-4 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
          <p className="text-xs text-white/50">Admin Panel</p>
          <p className="text-white text-sm font-semibold">{user?.name || "Admin"}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { setActiveNav(item.label); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left font-medium ${activeNav === item.label ? 'bg-emerald-500/20 text-emerald-300 border-l-4 border-emerald-500' : 'text-white/60 hover:bg-white/5 border-l-4 border-transparent'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white transition-colors">
            <ArrowUpRight className="w-5 h-5" /> Exit Admin
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
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-emerald-500 to-emerald-800">
                {user?.name?.charAt(0) || "A"}
              </div>
              <span className="text-sm hidden sm:block font-semibold text-slate-800">{user?.name || "Admin"}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
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
