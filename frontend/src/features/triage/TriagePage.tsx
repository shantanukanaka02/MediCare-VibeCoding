import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createTriageCaseRequest, listTriageCasesRequest, transitionTriageCaseRequest } from "./triage.api";
import { useAuth } from "../../shared/auth/auth-context";
import { hasPermission } from "../../shared/auth/access-control";
import type { TriageTransitionEvent } from "../../shared/types/api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

const transitionsByState: Record<string, TriageTransitionEvent[]> = {
  DRAFT: ["submit"],
  SUBMITTED: ["queue_triage"],
  TRIAGE_PENDING: ["triage"],
  TRIAGED: ["assign_doctor"],
  ASSIGNED_TO_DOCTOR: ["consult"],
  CONSULTED: ["start_treatment", "mark_follow_up"],
  TREATMENT_STARTED: ["complete_case", "mark_follow_up"],
  COMPLETED: ["mark_follow_up"],
  FOLLOW_UP_REQUIRED: [],
};

export const TriagePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(user, "triage_case:create");
  const canTransition = hasPermission(user, "triage_case:transition");
  const [patientId, setPatientId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");

  const triageQuery = useQuery({
    queryKey: ["triage-cases"],
    queryFn: listTriageCasesRequest,
  });

  const createMutation = useMutation({
    mutationFn: createTriageCaseRequest,
    onSuccess: () => {
      setPatientId("");
      setSymptoms("");
      setAge("");
      setBloodPressure("");
      void queryClient.invalidateQueries({ queryKey: ["triage-cases"] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      triageCaseId,
      event,
      version,
    }: {
      triageCaseId: string;
      event: TriageTransitionEvent;
      version: number;
    }) => transitionTriageCaseRequest(triageCaseId, { event, version }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["triage-cases"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Clinical Triage Queue</h1>
      {canCreate ? (
        <PageCard title="Create Intake Case">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className=""
              placeholder="Patient ID"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
            />
            <input
              className=""
              placeholder="Symptoms (comma separated)"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
            />
            <input
              className=""
              placeholder="Age"
              value={age}
              onChange={(event) => setAge(event.target.value)}
            />
            <input
              className=""
              placeholder="Systolic BP"
              value={bloodPressure}
              onChange={(event) => setBloodPressure(event.target.value)}
            />
            <button
              className="app-btn-primary md:col-span-2"
              disabled={!patientId || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  patientId,
                  symptoms: symptoms.split(",").map((item) => item.trim()).filter(Boolean),
                  age: age ? Number(age) : undefined,
                  bloodPressureSystolic: bloodPressure ? Number(bloodPressure) : undefined,
                })
              }
            >
              {createMutation.isPending ? "Creating..." : "Create triage case"}
            </button>
          </div>
        </PageCard>
      ) : null}
      <PageCard title="Triage Cases">
        {triageQuery.isLoading ? <p>Loading triage queue...</p> : null}
        <div className="space-y-2">
          {triageQuery.data?.map((item) => (
            <article key={item.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Patient {item.patientId}</p>
                <div className="flex gap-2">
                  <StatusBadge value={item.intakeState} />
                  <StatusBadge value={item.priority} />
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">Version {item.version}</p>
              {canTransition && transitionsByState[item.intakeState]?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {transitionsByState[item.intakeState].map((event) => (
                    <button
                      key={event}
                      className="app-btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        transitionMutation.mutate({
                          triageCaseId: item.id,
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
