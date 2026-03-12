import { useQuery } from "@tanstack/react-query";
import { listAuditLogsRequest } from "./audit.api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

export const CompliancePage = () => {
  const auditQuery = useQuery({
    queryKey: ["audit-logs"],
    queryFn: listAuditLogsRequest,
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Compliance & Audit</h1>
      <PageCard title="Immutable Audit Logs">
        {auditQuery.isLoading ? <p>Loading audit logs...</p> : null}
        <div className="space-y-2">
          {auditQuery.data?.map((log) => (
            <article key={log.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{log.action}</p>
                <StatusBadge value={log.entityType} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Entity {log.entityId} | Actor {log.actorUserId ?? "system"} | Request {log.requestId}
              </p>
            </article>
          ))}
        </div>
      </PageCard>
    </div>
  );
};
