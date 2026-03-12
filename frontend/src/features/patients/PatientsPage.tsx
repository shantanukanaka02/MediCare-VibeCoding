import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createPatientRequest, listPatientsRequest } from "./patients.api";
import { useAuth } from "../../shared/auth/auth-context";
import { hasPermission } from "../../shared/auth/access-control";
import { PageCard } from "../../shared/ui/PageCard";

export const PatientsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(user, "patient:create");

  const [form, setForm] = useState({
    mrn: "",
    firstName: "",
    lastName: "",
    dob: "",
    externalRef: "",
  });

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: listPatientsRequest,
  });

  const createMutation = useMutation({
    mutationFn: createPatientRequest,
    onSuccess: () => {
      setForm({ mrn: "", firstName: "", lastName: "", dob: "", externalRef: "" });
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Patient Management</h1>
      {canCreate ? (
        <PageCard title="Register Patient Intake">
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className=""
              placeholder="MRN"
              value={form.mrn}
              onChange={(event) => setForm((prev) => ({ ...prev, mrn: event.target.value }))}
            />
            <input
              className=""
              placeholder="External Ref (optional)"
              value={form.externalRef}
              onChange={(event) => setForm((prev) => ({ ...prev, externalRef: event.target.value }))}
            />
            <input
              className=""
              placeholder="First name"
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
            />
            <input
              className=""
              placeholder="Last name"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
            />
            <input
              className=""
              placeholder="DOB YYYY-MM-DD"
              value={form.dob}
              onChange={(event) => setForm((prev) => ({ ...prev, dob: event.target.value }))}
            />
            <button
              className="app-btn-primary"
              disabled={!form.mrn || !form.firstName || !form.lastName || !form.dob || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  mrn: form.mrn,
                  firstName: form.firstName,
                  lastName: form.lastName,
                  dob: form.dob,
                  externalRef: form.externalRef || undefined,
                })
              }
            >
              {createMutation.isPending ? "Saving..." : "Create patient"}
            </button>
          </div>
        </PageCard>
      ) : null}
      <PageCard title="Patient List">
        {patientsQuery.isLoading ? <p>Loading patients...</p> : null}
        <div className="space-y-2">
          {patientsQuery.data?.map((patient) => (
            <article key={patient.id} className="rounded border p-3">
              <p className="font-medium">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-xs text-slate-500">
                MRN: {patient.mrn} | DOB: {patient.dob}
              </p>
            </article>
          ))}
        </div>
      </PageCard>
    </div>
  );
};
