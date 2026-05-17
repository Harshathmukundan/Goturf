import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { Toaster } from "sonner";

export function Root() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/admin" || location.pathname === "/auth";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      {!hideNavbar && <Navbar />}
      <Outlet />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            borderRadius: "12px",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
    </div>
  );
}
