import { useQuery } from "@tanstack/react-query";
import { reportsOverviewRequest } from "./reports.api";
import { PageCard } from "../../shared/ui/PageCard";

export const ReportsPage = () => {
  const reportQuery = useQuery({
    queryKey: ["reports-overview"],
    queryFn: reportsOverviewRequest,
  });

  const data = reportQuery.data;

  return (
    <div className="space-y-4">
      <h1 className="app-title">Reporting & Analytics</h1>
      <PageCard title="Clinical Reports">
        {reportQuery.isLoading ? <p>Loading reports...</p> : null}
        {data ? (
          <div className="space-y-1 text-sm">
            <p>Patient inflow trends (range): {data.clinical.patientsInflow}</p>
            <p>Triage priority distribution: {data.clinical.triageDistribution.map((item) => `${item.priority}:${item.count}`).join(", ") || "N/A"}</p>
          </div>
        ) : null}
      </PageCard>
      <PageCard title="Operational Reports">
        {data ? (
          <div className="space-y-1 text-sm">
            <p>Appointment no-show rate: {data.operational.appointmentNoShowRatePercent}%</p>
            <p>Lab turnaround time (avg hrs): {data.operational.labTurnaroundHoursAvg}</p>
            <p>Total appointments in range: {data.operational.totalAppointments}</p>
          </div>
        ) : null}
      </PageCard>
      <PageCard title="Compliance Reports">
        {data ? (
          <div className="space-y-1 text-sm">
            <p>Open approvals: {data.compliance.openApprovals}</p>
            <p>Pending billing triggers: {data.compliance.pendingBilling}</p>
            <p>Export options: CSV, PDF, secure download via compliance module.</p>
          </div>
        ) : null}
      </PageCard>
    </div>
  );
};
