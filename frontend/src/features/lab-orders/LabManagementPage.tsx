import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createLabOrderRequest, listLabOrdersRequest, transitionLabOrderRequest } from "./lab-orders.api";
import { hasPermission } from "../../shared/auth/access-control";
import { useAuth } from "../../shared/auth/auth-context";
import type { LabTransitionEvent } from "../../shared/types/api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

const transitionsByStatus: Record<string, LabTransitionEvent[]> = {
  ORDERED: ["collect_sample"],
  SAMPLE_COLLECTED: ["process"],
  PROCESSING: ["upload_results"],
  RESULTS_UPLOADED: ["doctor_review"],
  DOCTOR_REVIEWED: ["notify_patient"],
  PATIENT_NOTIFIED: [],
};

export const LabManagementPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(user, "lab_order:create");
  const canTransition = hasPermission(user, "lab_order:transition");

  const [patientId, setPatientId] = useState("");
  const [testCode, setTestCode] = useState("LAB-CBC");
  const [testName, setTestName] = useState("Complete Blood Count");

  const labQuery = useQuery({
    queryKey: ["lab-orders"],
    queryFn: listLabOrdersRequest,
  });

  const createMutation = useMutation({
    mutationFn: createLabOrderRequest,
    onSuccess: () => {
      setPatientId("");
      void queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      labOrderId,
      event,
      version,
    }: {
      labOrderId: string;
      event: LabTransitionEvent;
      version: number;
    }) =>
      transitionLabOrderRequest(labOrderId, {
        event,
        version,
        resultSummary: event === "upload_results" ? "Results uploaded by lab" : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lab-orders"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Lab & Diagnostic Workflow</h1>
      {canCreate ? (
        <PageCard title="Order Lab Test">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className=""
              placeholder="Patient ID"
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
            />
            <input
              className=""
              placeholder="Test code"
              value={testCode}
              onChange={(event) => setTestCode(event.target.value)}
            />
            <input
              className=""
              placeholder="Test name"
              value={testName}
              onChange={(event) => setTestName(event.target.value)}
            />
            <button
              className="app-btn-primary"
              disabled={!patientId || !testCode || !testName || createMutation.isPending}
              onClick={() => createMutation.mutate({ patientId, testCode, testName })}
            >
              {createMutation.isPending ? "Ordering..." : "Create lab order"}
            </button>
          </div>
        </PageCard>
      ) : null}
      <PageCard title="Lab Orders">
        {labQuery.isLoading ? <p>Loading lab orders...</p> : null}
        <div className="space-y-2">
          {labQuery.data?.map((order) => (
            <article key={order.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {order.testCode} - {order.testName}
                </p>
                <StatusBadge value={order.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Patient {order.patientId} | Version {order.version}</p>
              {canTransition && transitionsByStatus[order.status]?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {transitionsByStatus[order.status].map((event) => (
                    <button
                      key={event}
                      className="app-btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        transitionMutation.mutate({
                          labOrderId: order.id,
                          event,
                          version: order.version,
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
