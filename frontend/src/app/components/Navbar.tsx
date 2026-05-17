import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Bell, User, Menu, X, Zap, LogOut, CalendarDays, ChevronDown, Shield, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { motion, AnimatePresence } from "motion/react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isOwner } = useAuth() as any;
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/turfs", label: "Find Turfs" },
    ...(user ? [{ href: "/my-bookings", label: "My Bookings" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(0,0,0,0.08)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10B981, #065F46)" }}
            >
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span
              className="text-xl"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#0F172A" }}
            >
              Go<span style={{ color: "#10B981" }}>Turf</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm transition-colors hover:text-emerald-600"
                style={{
                  color: location.pathname === link.href ? "#10B981" : "#64748B",
                  fontWeight: location.pathname === link.href ? 600 : 400,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications */}
                <button
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                  style={{ color: "#64748B" }}
                >
                  <Bell className="w-5 h-5" />
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#10B981" }}
                  />
                </button>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:shadow-sm"
                    style={{ borderColor: "rgba(0,0,0,0.1)", background: userMenuOpen ? "#F0FDF4" : "white" }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white"
                      style={{ background: "linear-gradient(135deg, #10B981, #065F46)", fontWeight: 700 }}
                    >
                      {getInitials(user.name)}
                    </div>
                    <span className="text-sm hidden lg:block" style={{ color: "#0F172A", fontWeight: 600, maxWidth: "120px" }}>
                      {user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown
                      className="w-4 h-4 transition-transform"
                      style={{ color: "#94A3B8", transform: userMenuOpen ? "rotate(180deg)" : "none" }}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 rounded-2xl py-2 z-50"
                        style={{
                          background: "white",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                          <p className="text-sm" style={{ fontWeight: 600, color: "#0F172A" }}>{user.name}</p>
                          <p className="text-xs" style={{ color: "#94A3B8" }}>{user.email}</p>
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "#F0FDF4", color: "#10B981", fontWeight: 600 }}>
                              <Shield className="w-3 h-3" /> Admin
                            </span>
                          )}
                        </div>

                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                            style={{ color: "#64748B" }}
                          >
                            <User className="w-4 h-4" /> My Profile
                          </Link>
                          <Link
                            to="/my-bookings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                            style={{ color: "#64748B" }}
                          >
                            <CalendarDays className="w-4 h-4" /> My Bookings
                          </Link>
                          <Link
                            to="/team-registration"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                            style={{ color: "#64748B" }}
                          >
                            <User className="w-4 h-4" /> My Team
                          </Link>
                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                              style={{ color: "#64748B" }}
                            >
                              <Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          {isOwner && (
                            <Link
                              to="/owner-dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                              style={{ color: "#64748B" }}
                            >
                              <LayoutDashboard className="w-4 h-4" /> Owner Dashboard
                            </Link>
                          )}
                        </div>

                        <div className="border-t pt-1" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors hover:bg-red-50"
                            style={{ color: "#EF4444" }}
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 rounded-xl text-sm transition-all hover:shadow-md"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ color: "#64748B" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t py-4 space-y-2" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block px-4 py-2 rounded-lg text-sm"
                style={{ color: location.pathname === link.href ? "#10B981" : "#64748B", fontWeight: location.pathname === link.href ? 600 : 400 }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="px-4 py-2 border-t mt-2 pt-3" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <p className="text-sm" style={{ fontWeight: 600, color: "#0F172A" }}>{user.name}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-left px-4 py-2 rounded-lg text-sm"
                  style={{ color: "#0F172A", fontWeight: 500 }}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="block w-full text-left px-4 py-2 rounded-lg text-sm"
                  style={{ color: "#EF4444" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="block mx-4 py-2 rounded-xl text-sm text-center"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "white",
                  fontWeight: 600,
                }}
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
