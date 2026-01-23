import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import ChangePIN from "./pages/ChangePIN";
import KYC from "./pages/KYC";
import InvoiceHistory from "./pages/InvoiceHistory";
import RateCard from "./pages/RateCard";
import SupportTickets from "./pages/SupportTickets";
import Training from "./pages/Training";
import StartJob from "./pages/StartJob";
import TicketDetails from "./pages/TicketDetails";
import JobChatPage from "./pages/JobChatPage";
import AdminDashboard from "./pages/AdminDashboard";
import PitStopOnboarding from "./pages/PitStopOnboarding";
import PitStopForm from "./pages/PitStopForm";
import Manager from "./pages/Manager";
import OperatorDashboard from "./pages/OperatorDashboard";

export default function AppRoutes({ authed }) {
  const user = authed ? JSON.parse(localStorage.getItem("user")) : null;
  const role = user?.role;

  return (
    <Routes>
      {!authed ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          {/* Role-based routing */}
          {role === "ADMIN" && <Route path="/" element={<AdminDashboard />} />}
          {role === "USER" && <Route path="/" element={<Home />} />}
          {role === "EXECUTIVE" && (
            <Route path="/" element={<PitStopOnboarding />} />
          )}
          {role === "MANAGER" && <Route path="/" element={<Manager />} />}
          {role === "OPERATOR" && (
            <Route path="/" element={<OperatorDashboard />} />
          )}

          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id/start" element={<StartJob />} />
          <Route path="/ticket/:id" element={<TicketDetails />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-pin" element={<ChangePIN />} />
          <Route path="/kyc" element={<KYC />} />
          <Route path="/invoice-history" element={<InvoiceHistory />} />
          <Route path="/rate-card" element={<RateCard />} />
          <Route path="/support" element={<SupportTickets />} />
          <Route path="/training" element={<Training />} />
          <Route path="/pitstop-form" element={<PitStopForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/job-chat/:ticketId" element={<JobChatPage />} />
        </>
      )}
    </Routes>
  );
}
