import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { motion } from "motion/react";
import { User, Mail, Phone, MapPin, Key, AlertCircle, CreditCard, Clock, CheckCircle2, XCircle, Bell, Shield, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth() as any;
  const [activeTab, setActiveTab] = useState("personal");
  
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  // Form State
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.location_city || "Chennai",
    area: user?.location_area || "",
    sports: user?.sports_preferences || ["Football", "Cricket"],
    password: "",
  });

  useEffect(() => {
    if (activeTab === "bookings") {
      loadBookings();
    }
  }, [activeTab]);

  const loadBookings = async () => {
    try {
      const data = await api.getUserBookings();
      setBookings(data.data);
    } catch (err: any) {
      toast.error("Failed to load booking history");
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const data = await api.updateProfile({
        name: form.name,
        phone: form.phone,
        location: { city: form.city, area: form.area },
        sports_preferences: form.sports,
        password: form.password,
      });
      updateUser(data.user);
      setForm({...form, password: ""});
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Profile", icon: User },
    { id: "bookings", label: "Bookings History", icon: Clock },
    { id: "payments", label: "Payment Details", icon: CreditCard },
    { id: "settings", label: "Account Settings", icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-24 font-inter min-h-screen">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {user?.name?.charAt(0) || "U"}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{user?.name || "Complete your profile"}</h1>
          <p className="text-slate-500 font-medium">@{user?.email?.split('@')[0]} · User ID: {user?.id?.split('-')[0]}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-emerald-400" : "text-slate-400"}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm min-h-[500px]">
          
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === "personal" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="email" value={form.email} disabled className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="tel" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium" placeholder="+91" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">City Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" value={form.city} onChange={(e)=>setForm({...form, city: e.target.value})} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium" />
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-4">Sports Preferences</h3>
              <div className="flex flex-wrap gap-3 mb-8">
                {["Football", "Cricket", "Basketball", "Tennis", "Badminton"].map(sport => (
                  <button key={sport} onClick={() => {
                    const has = form.sports.includes(sport);
                    setForm({...form, sports: has ? form.sports.filter(s=>s!==sport) : [...form.sports, sport]});
                  }} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${form.sports.includes(sport) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                    {sport}
                  </button>
                ))}
              </div>

              <button onClick={handleSaveProfile} disabled={loading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all disabled:opacity-50">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </motion.div>
          )}

          {/* TAB 2: BOOKINGS */}
          {activeTab === "bookings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Booking History</h2>
                <Link to="/turfs" className="text-emerald-600 font-semibold text-sm hover:underline">Book a Turf</Link>
              </div>

              {bookings.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">No bookings yet</h3>
                  <p className="text-slate-500">When you book a turf, your history will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-5 border border-slate-200 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg mb-1">{booking.turfs?.name}</h4>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> {booking.turfs?.location_area}, {booking.turfs?.location_city}
                        </p>
                        <p className="text-sm font-medium text-slate-700 mt-2">
                          {new Date(booking.booking_date).toLocaleDateString()} · {booking.start_time} - {booking.end_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booking.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                          booking.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {booking.status.toUpperCase()}
                        </span>
                        <p className="font-bold text-lg text-slate-800 mt-3">₹{booking.total_price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeTab === "payments" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
               <h2 className="text-2xl font-bold text-slate-800 mb-6">Payment Methods</h2>
               <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold italic text-xs">VISA</div>
                   <div>
                     <p className="font-bold text-slate-800">•••• •••• •••• 4242</p>
                     <p className="text-xs text-slate-500">Expires 12/28</p>
                   </div>
                 </div>
                 <button className="text-red-500 text-sm font-semibold hover:underline">Remove</button>
               </div>
               <button className="px-5 py-3 border border-dashed border-slate-300 rounded-xl font-semibold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all w-full flex items-center justify-center gap-2">
                 <CreditCard className="w-5 h-5" /> Add New Payment Method
               </button>

               <h3 className="text-lg font-bold text-slate-800 mt-12 mb-4">Transaction History</h3>
               <div className="border border-slate-100 rounded-2xl overflow-hidden">
                 {[1, 2].map((i) => (
                   <div key={i} className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
                     <div>
                       <p className="font-semibold text-slate-800">Booking Recharged</p>
                       <p className="text-xs text-slate-500">TXN_94812{i}</p>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-slate-800">- ₹1,200</p>
                       <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3"/> Success</p>
                     </div>
                   </div>
                 ))}
               </div>
            </motion.div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-10">
              
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Notification Settings</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-2"><Bell className="w-4 h-4"/> Booking Alerts</p>
                      <p className="text-sm text-slate-500 mt-1">Get emails and SMS for upcoming bookings.</p>
                    </div>
                    <div className="w-12 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                  </label>
                  <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-2"><Mail className="w-4 h-4"/> Promotional Offers</p>
                      <p className="text-sm text-slate-500 mt-1">Receive discounts and venue updates.</p>
                    </div>
                    <div className="w-12 h-6 bg-slate-300 rounded-full relative"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                  </label>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Security</h2>
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Enter new password (optional)" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white transition-all font-medium" />
                  </div>
                  <button onClick={handleSaveProfile} disabled={loading || form.password.length < 4} className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50 whitespace-nowrap">
                    Update Password
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
                <div className="p-6 border border-red-200 bg-red-50 rounded-2xl">
                  <p className="text-red-800 font-medium mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button onClick={() => { logout(); navigate("/"); }} className="px-5 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Account
                  </button>
                </div>
              </div>

            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
