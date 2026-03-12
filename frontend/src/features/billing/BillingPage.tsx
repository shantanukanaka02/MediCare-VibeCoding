import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createBillingTriggerRequest, listBillingTriggersRequest, transitionBillingTriggerRequest } from "./billing.api";
import { hasPermission } from "../../shared/auth/access-control";
import { useAuth } from "../../shared/auth/auth-context";
import type { BillingTransitionEvent } from "../../shared/types/api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

const transitionsByStatus: Record<string, BillingTransitionEvent[]> = {
  PENDING: ["emit", "fail"],
  FAILED: ["retry"],
  EMITTED: [],
};

export const BillingPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(user, "billing_trigger:create");
  const canTransition = hasPermission(user, "billing_trigger:transition");

  const [sourceEntityType, setSourceEntityType] = useState("treatment_plan");
  const [sourceEntityId, setSourceEntityId] = useState("");
  const [triggerType, setTriggerType] = useState("INSURANCE_PREAUTH");
  const [patientId, setPatientId] = useState("");

  const billingQuery = useQuery({
    queryKey: ["billing-triggers"],
    queryFn: listBillingTriggersRequest,
  });

  const createMutation = useMutation({
    mutationFn: createBillingTriggerRequest,
    onSuccess: () => {
      setSourceEntityId("");
      setPatientId("");
      void queryClient.invalidateQueries({ queryKey: ["billing-triggers"] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      billingTriggerId,
      event,
      version,
    }: {
      billingTriggerId: string;
      event: BillingTransitionEvent;
      version: number;
    }) =>
      transitionBillingTriggerRequest(billingTriggerId, {
        event,
        version,
        failureReason: event === "fail" ? "Manual billing failure simulation" : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing-triggers"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Billing Triggers</h1>
      {canCreate ? (
        <PageCard title="Create Billing Trigger">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className=""
              placeholder="Source entity type"
              value={sourceEntityType}
              onChange={(event) => setSourceEntityType(event.target.value)}
            />
            <input
              className=""
              placeholder="Source entity ID"
              value={sourceEntityId}
              onChange={(event) => setSourceEntityId(event.target.value)}
            />
            <input
              className=""
              placeholder="Trigger type"
              value={triggerType}
              onChange={(event) => setTriggerType(event.target.value)}
            />
            <input
              className=""
              placeholder="Patient ID (optional)"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
            />
            <button
              className="app-btn-primary md:col-span-2"
              disabled={!sourceEntityType || !sourceEntityId || !triggerType || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  sourceEntityType,
                  sourceEntityId,
                  triggerType,
                  patientId: patientId || undefined,
                })
              }
            >
              {createMutation.isPending ? "Creating..." : "Create trigger"}
            </button>
          </div>
        </PageCard>
      ) : null}
      <PageCard title="Trigger Queue">
        {billingQuery.isLoading ? <p>Loading billing triggers...</p> : null}
        <div className="space-y-2">
          {billingQuery.data?.map((item) => (
            <article key={item.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.triggerType}</p>
                <StatusBadge value={item.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Source {item.sourceEntityType}:{item.sourceEntityId} | Version {item.version}
              </p>
              {canTransition && transitionsByStatus[item.status]?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {transitionsByStatus[item.status].map((event) => (
                    <button
                      key={event}
                      className="app-btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        transitionMutation.mutate({
                          billingTriggerId: item.id,
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
