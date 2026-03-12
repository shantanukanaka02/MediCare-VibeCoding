import { useQuery } from "@tanstack/react-query";
import { reportsOverviewRequest } from "../reports/reports.api";
import { useAuth } from "../../shared/auth/auth-context";
import { hasPermission } from "../../shared/auth/access-control";
import { PageCard } from "../../shared/ui/PageCard";

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded border border-slate-200 p-3">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
  </div>
);

export const DashboardPage = () => {
  const { user } = useAuth();
  const canReadReports = hasPermission(user, "report:read");

  const reportQuery = useQuery({
    queryKey: ["reports-overview"],
    queryFn: reportsOverviewRequest,
    enabled: canReadReports,
  });

  if (!canReadReports) {
    return (
      <div className="space-y-4">
        <h1 className="app-title">Dashboard</h1>
        <PageCard title="Your Access Scope">
          <p className="text-sm text-slate-600">
            Reporting data is restricted for your role. Use allowed modules from the left navigation.
          </p>
          <p className="mt-2 text-sm">
            Permissions: <span className="font-mono text-xs">{user?.permissions.join(", ")}</span>
          </p>
        </PageCard>
      </div>
    );
  }

  const data = reportQuery.data;

  return (
    <div className="space-y-4">
      <h1 className="app-title">Dashboard</h1>
      {reportQuery.isLoading ? <p>Loading analytics...</p> : null}
      {data ? (
        <>
          <PageCard title="Clinical Metrics">
            <div className="grid gap-3 md:grid-cols-2">
              <Stat label="Patient inflow" value={data.clinical.patientsInflow} />
              <Stat
                label="Triage distribution"
                value={data.clinical.triageDistribution.map((item) => `${item.priority}:${item.count}`).join(" | ") || "N/A"}
              />
            </div>
          </PageCard>
          <PageCard title="Operational Metrics">
            <div className="grid gap-3 md:grid-cols-3">
              <Stat label="Appointments" value={data.operational.totalAppointments} />
              <Stat label="No-show %" value={`${data.operational.appointmentNoShowRatePercent}%`} />
              <Stat label="Lab TAT (hrs)" value={data.operational.labTurnaroundHoursAvg} />
            </div>
          </PageCard>
          <PageCard title="Compliance Metrics">
            <div className="grid gap-3 md:grid-cols-2">
              <Stat label="Open approvals" value={data.compliance.openApprovals} />
              <Stat label="Pending billing" value={data.compliance.pendingBilling} />
            </div>
          </PageCard>
        </>
      ) : null}
    </div>
  );
};
