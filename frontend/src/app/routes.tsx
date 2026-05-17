import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { TurfListingPage } from "./pages/TurfListingPage";
import { SlotSelectionPage } from "./pages/SlotSelectionPage";
import { TeamRegistrationPage } from "./pages/TeamRegistrationPage";
import { ChatRoomPage } from "./pages/ChatRoomPage";
import { InvitePage } from "./pages/InvitePage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { OwnerDashboardPage } from "./pages/OwnerDashboardPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { ProfilePage } from "./pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "auth", Component: AuthPage },
      { path: "turfs", Component: TurfListingPage },
      { path: "turfs/:id/slots", Component: SlotSelectionPage },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-bookings",
        element: (
          <ProtectedRoute>
            <MyBookingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "team-registration",
        element: (
          <ProtectedRoute>
            <TeamRegistrationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "chat/:bookingId",
        element: (
          <ProtectedRoute>
            <ChatRoomPage />
          </ProtectedRoute>
        ),
      },
      { path: "invite", Component: InvitePage },
      {
        path: "admin",
        element: (
          <ProtectedRoute adminOnly>
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "owner-dashboard",
        element: (
          <ProtectedRoute>
            <OwnerDashboardPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
