import React from "react";
import { useNavigate } from "react-router-dom";

export default function OperatorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
        </div>
        <button
          onClick={() => navigate("/jobs")}
          className="px-3 py-2 rounded-lg text-white font-semibold"
          style={{ background: "var(--brand)" }}
        >
          View Jobs
        </button>
      </header>
    </div>
  );
}
