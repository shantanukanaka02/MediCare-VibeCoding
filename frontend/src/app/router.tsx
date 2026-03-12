import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { AccessDeniedPage } from "../features/auth/AccessDeniedPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { PatientsPage } from "../features/patients/PatientsPage";
import { AppointmentsPage } from "../features/appointments/AppointmentsPage";
import { TriagePage } from "../features/triage/TriagePage";
import { TreatmentPlansPage } from "../features/treatment-plans/TreatmentPlansPage";
import { LabManagementPage } from "../features/lab-orders/LabManagementPage";
import { ApprovalsPage } from "../features/approvals/ApprovalsPage";
import { BillingPage } from "../features/billing/BillingPage";
import { TasksPage } from "../features/tasks/TasksPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { CompliancePage } from "../features/audit/CompliancePage";
import { AdminPage } from "../features/admin/AdminPage";
import { ProtectedRoute } from "../shared/ui/ProtectedRoute";
import { PermissionGate } from "../shared/ui/PermissionGate";
import { AppShell } from "../shared/ui/AppShell";
import { HomeRedirect } from "../shared/ui/HomeRedirect";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/",
            element: <HomeRedirect />,
          },
          {
            path: "/dashboard",
            element: (
              <PermissionGate anyPermissions={["report:read"]}>
                <DashboardPage />
              </PermissionGate>
            ),
          },
          {
            path: "/patients",
            element: (
              <PermissionGate anyPermissions={["patient:read", "patient:create"]}>
                <PatientsPage />
              </PermissionGate>
            ),
          },
          {
            path: "/appointments",
            element: (
              <PermissionGate anyPermissions={["appointment:read", "appointment:create", "appointment:transition"]}>
                <AppointmentsPage />
              </PermissionGate>
            ),
          },
          {
            path: "/triage",
            element: (
              <PermissionGate anyPermissions={["triage_case:read", "triage_case:create", "triage_case:transition"]}>
                <TriagePage />
              </PermissionGate>
            ),
          },
          {
            path: "/treatment-plans",
            element: (
              <PermissionGate anyPermissions={["treatment_plan:read", "treatment_plan:create", "treatment_plan:transition"]}>
                <TreatmentPlansPage />
              </PermissionGate>
            ),
          },
          {
            path: "/lab-management",
            element: (
              <PermissionGate anyPermissions={["lab_order:read", "lab_order:create", "lab_order:transition"]}>
                <LabManagementPage />
              </PermissionGate>
            ),
          },
          {
            path: "/approvals",
            element: (
              <PermissionGate anyPermissions={["approval:read", "approval:create", "approval:transition"]}>
                <ApprovalsPage />
              </PermissionGate>
            ),
          },
          {
            path: "/billing",
            element: (
              <PermissionGate anyPermissions={["billing_trigger:read", "billing_trigger:create", "billing_trigger:transition"]}>
                <BillingPage />
              </PermissionGate>
            ),
          },
          {
            path: "/tasks",
            element: (
              <PermissionGate anyPermissions={["task:read", "task:create", "task:update", "task:transition"]}>
                <TasksPage />
              </PermissionGate>
            ),
          },
          {
            path: "/reports",
            element: (
              <PermissionGate anyPermissions={["report:read"]}>
                <ReportsPage />
              </PermissionGate>
            ),
          },
          {
            path: "/compliance",
            element: (
              <PermissionGate anyPermissions={["audit_log:read"]}>
                <CompliancePage />
              </PermissionGate>
            ),
          },
          {
            path: "/admin",
            element: (
              <PermissionGate anyPermissions={["user:read", "user:create"]}>
                <AdminPage />
              </PermissionGate>
            ),
          },
          {
            path: "/access-denied",
            element: <AccessDeniedPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
