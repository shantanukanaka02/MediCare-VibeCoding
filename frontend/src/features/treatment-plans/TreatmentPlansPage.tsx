import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createTreatmentPlanRequest, listTreatmentPlansRequest, transitionTreatmentPlanRequest } from "./treatment-plans.api";
import { useAuth } from "../../shared/auth/auth-context";
import { hasPermission } from "../../shared/auth/access-control";
import type { TreatmentTransitionEvent } from "../../shared/types/api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

const transitionsByStatus: Record<string, TreatmentTransitionEvent[]> = {
  DRAFT: ["submit_review"],
  REVIEW: ["approve", "request_changes"],
  APPROVED: ["activate"],
  ACTIVE: ["modify", "close"],
  MODIFIED: ["reactivate", "close"],
  CLOSED: [],
};

export const TreatmentPlansPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(user, "treatment_plan:create");
  const canTransition = hasPermission(user, "treatment_plan:transition");

  const [patientId, setPatientId] = useState("");
  const [diagnoses, setDiagnoses] = useState("Hypertension");
  const [medications, setMedications] = useState("Med-A:controlled:5mg");

  const plansQuery = useQuery({
    queryKey: ["treatment-plans"],
    queryFn: listTreatmentPlansRequest,
  });

  const createMutation = useMutation({
    mutationFn: createTreatmentPlanRequest,
    onSuccess: () => {
      setPatientId("");
      void queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      treatmentPlanId,
      event,
      version,
    }: {
      treatmentPlanId: string;
      event: TreatmentTransitionEvent;
      version: number;
    }) => transitionTreatmentPlanRequest(treatmentPlanId, { event, version }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Treatment Plan Management</h1>
      {canCreate ? (
        <PageCard title="Create Treatment Plan">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className=""
              placeholder="Patient ID"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
            />
            <input
              className=""
              placeholder="Diagnoses (comma separated)"
              value={diagnoses}
              onChange={(event) => setDiagnoses(event.target.value)}
            />
            <input
              className="md:col-span-2"
              placeholder="Medications name:class:dosage (comma separated)"
              value={medications}
              onChange={(event) => setMedications(event.target.value)}
            />
            <button
              className="app-btn-primary md:col-span-2"
              disabled={!patientId || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  patientId,
                  diagnoses: diagnoses.split(",").map((item) => item.trim()).filter(Boolean),
                  medications: medications
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item) => {
                      const [name, medicationClass, dosage] = item.split(":");
                      return {
                        name: name ?? "Medication",
                        class: medicationClass,
                        dosage,
                      };
                    }),
                  labTests: [],
                  procedures: [],
                })
              }
            >
              {createMutation.isPending ? "Creating..." : "Create plan"}
            </button>
          </div>
        </PageCard>
      ) : null}
      <PageCard title="Treatment Plans">
        {plansQuery.isLoading ? <p>Loading treatment plans...</p> : null}
        <div className="space-y-2">
          {plansQuery.data?.map((plan) => (
            <article key={plan.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Plan {plan.id}</p>
                <StatusBadge value={plan.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Patient {plan.patientId} | Version {plan.version}</p>
              {canTransition && transitionsByStatus[plan.status]?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {transitionsByStatus[plan.status].map((event) => (
                    <button
                      key={event}
                      className="app-btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        transitionMutation.mutate({
                          treatmentPlanId: plan.id,
                          event,
                          version: plan.version,
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
