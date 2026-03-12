import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createApprovalRequest, listApprovalsRequest, transitionApprovalRequest } from "./approvals.api";
import { hasPermission } from "../../shared/auth/access-control";
import { useAuth } from "../../shared/auth/auth-context";
import type { ApprovalTransitionEvent } from "../../shared/types/api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

const transitionsByStatus: Record<string, ApprovalTransitionEvent[]> = {
  PENDING: ["approve", "reject", "escalate"],
  ESCALATED: ["approve", "reject"],
  REJECTED: ["reopen"],
  APPROVED: [],
};

export const ApprovalsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(user, "approval:create");
  const canTransition = hasPermission(user, "approval:transition");

  const [patientId, setPatientId] = useState("");
  const [approvalType, setApprovalType] = useState<"CONTROLLED_SUBSTANCE" | "INSURANCE_PREAUTH" | "CLINICAL_REVIEW">("CONTROLLED_SUBSTANCE");
  const [cost, setCost] = useState("");
  const [insuranceLimit, setInsuranceLimit] = useState("");

  const approvalsQuery = useQuery({
    queryKey: ["approvals"],
    queryFn: listApprovalsRequest,
  });

  const createMutation = useMutation({
    mutationFn: createApprovalRequest,
    onSuccess: () => {
      setPatientId("");
      setCost("");
      setInsuranceLimit("");
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      approvalId,
      event,
      version,
    }: {
      approvalId: string;
      event: ApprovalTransitionEvent;
      version: number;
    }) => transitionApprovalRequest(approvalId, { event, version }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Approval & Escalation</h1>
      {canCreate ? (
        <PageCard title="Create Approval Request">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className=""
              placeholder="Patient ID (optional)"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
            />
            <select
              className=""
              value={approvalType}
              onChange={(event) => setApprovalType(event.target.value as typeof approvalType)}
            >
              <option value="CONTROLLED_SUBSTANCE">CONTROLLED_SUBSTANCE</option>
              <option value="INSURANCE_PREAUTH">INSURANCE_PREAUTH</option>
              <option value="CLINICAL_REVIEW">CLINICAL_REVIEW</option>
            </select>
            <input
              className=""
              placeholder="Estimated cost"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
            />
            <input
              className=""
              placeholder="Insurance limit"
              value={insuranceLimit}
              onChange={(event) => setInsuranceLimit(event.target.value)}
            />
            <button
              className="app-btn-primary md:col-span-2"
              disabled={createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  patientId: patientId || undefined,
                  approvalType,
                  estimatedCost: cost ? Number(cost) : undefined,
                  insuranceLimit: insuranceLimit ? Number(insuranceLimit) : undefined,
                  medicationClass: approvalType === "CONTROLLED_SUBSTANCE" ? "controlled" : undefined,
                })
              }
            >
              {createMutation.isPending ? "Submitting..." : "Create approval"}
            </button>
          </div>
        </PageCard>
      ) : null}
      <PageCard title="Approval Queue">
        {approvalsQuery.isLoading ? <p>Loading approvals...</p> : null}
        <div className="space-y-2">
          {approvalsQuery.data?.map((item) => (
            <article key={item.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.approvalType}</p>
                <StatusBadge value={item.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Required role: {item.requiredRole} | Version {item.version}</p>
              {canTransition && transitionsByStatus[item.status]?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {transitionsByStatus[item.status].map((event) => (
                    <button
                      key={event}
                      className="app-btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        transitionMutation.mutate({
                          approvalId: item.id,
                          event,
                          version: item.version,
                        })
                      }
                    >
                      {event}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </PageCard>
    </div>
  );
};
