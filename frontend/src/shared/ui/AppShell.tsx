import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { Permission } from "../types/api";
import { useAuth } from "../auth/auth-context";
import { hasAnyPermission } from "../auth/access-control";
import { logoutRequest } from "../../features/auth/auth.api";
import { tokenStore } from "../auth/token-store";

interface NavItem {
  label: string;
  to: string;
  anyPermissions: Permission[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", anyPermissions: ["report:read"] },
  { label: "Patients", to: "/patients", anyPermissions: ["patient:read", "patient:create"] },
  { label: "Appointments", to: "/appointments", anyPermissions: ["appointment:read", "appointment:create", "appointment:transition"] },
  { label: "Triage Queue", to: "/triage", anyPermissions: ["triage_case:read", "triage_case:create", "triage_case:transition"] },
  { label: "Treatment Plans", to: "/treatment-plans", anyPermissions: ["treatment_plan:read", "treatment_plan:create", "treatment_plan:transition"] },
  { label: "Lab Management", to: "/lab-management", anyPermissions: ["lab_order:read", "lab_order:create", "lab_order:transition"] },
  { label: "Approvals", to: "/approvals", anyPermissions: ["approval:read", "approval:create", "approval:transition"] },
  { label: "Billing", to: "/billing", anyPermissions: ["billing_trigger:read", "billing_trigger:create", "billing_trigger:transition"] },
  { label: "Care Tasks", to: "/tasks", anyPermissions: ["task:read", "task:create", "task:update", "task:transition"] },
  { label: "Reports", to: "/reports", anyPermissions: ["report:read"] },
  { label: "Compliance & Audit", to: "/compliance", anyPermissions: ["audit_log:read"] },
  { label: "Admin", to: "/admin", anyPermissions: ["user:read", "user:create"] },
];

export const AppShell = () => {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();

  const visibleNavItems = navItems.filter((item) => hasAnyPermission(user, item.anyPermissions));

  const handleLogout = async (): Promise<void> => {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 p-5 lg:grid-cols-[265px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-slate-900/95 p-5 text-slate-100 shadow-xl">
          <h1 className="text-xl font-bold tracking-tight">EHCP Platform</h1>
          <p className="mt-2 text-xs text-slate-300">Tenant: {user?.organizationId}</p>
          <nav className="mt-5 space-y-1.5">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-emerald-300 text-slate-900 font-semibold shadow" : "text-slate-100 hover:bg-slate-800"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button className="app-btn-secondary mt-6 w-full text-sm" onClick={() => void handleLogout()}>
            Logout
          </button>
        </aside>

        <main className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
          <header className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="font-semibold">{user?.email}</p>
            <p className="text-xs text-slate-500">{user?.roles.join(", ")}</p>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
