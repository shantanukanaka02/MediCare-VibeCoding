import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createAppointmentRequest, listAppointmentsRequest, transitionAppointmentRequest } from "./appointments.api";
import { hasPermission } from "../../shared/auth/access-control";
import { useAuth } from "../../shared/auth/auth-context";
import type { AppointmentTransitionEvent } from "../../shared/types/api";
import { PageCard } from "../../shared/ui/PageCard";
import { StatusBadge } from "../../shared/ui/StatusBadge";

const transitionsByStatus: Record<string, AppointmentTransitionEvent[]> = {
  SCHEDULED: ["check_in", "cancel", "mark_no_show"],
  CHECKED_IN: ["complete", "cancel"],
  NO_SHOW: ["reschedule"],
  CANCELED: ["reopen"],
  COMPLETED: [],
};

export const AppointmentsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(user, "appointment:create");
  const canTransition = hasPermission(user, "appointment:transition");

  const [form, setForm] = useState({
    patientId: "",
    providerUserId: user?.id ?? "",
    appointmentType: "Follow-up",
    scheduledAt: "",
    durationMinutes: "30",
    requiresOperatingRoom: false,
  });

  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointmentsRequest,
  });

  const createMutation = useMutation({
    mutationFn: createAppointmentRequest,
    onSuccess: () => {
      setForm((prev) => ({ ...prev, patientId: "", scheduledAt: "" }));
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      appointmentId,
      event,
      version,
    }: {
      appointmentId: string;
      event: AppointmentTransitionEvent;
      version: number;
    }) => transitionAppointmentRequest(appointmentId, { event, version }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="app-title">Appointment & Scheduling</h1>

      {canCreate ? (
        <PageCard title="Schedule Appointment">
          <div className="grid gap-2 md:grid-cols-3">
            <input
              className=""
              placeholder="Patient ID (UUID)"
              value={form.patientId}
              onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))}
            />
            <input
              className=""
              placeholder="Provider User ID (UUID)"
              value={form.providerUserId}
              onChange={(event) => setForm((prev) => ({ ...prev, providerUserId: event.target.value }))}
            />
            <input
              className=""
              placeholder="Type (e.g. Surgery)"
              value={form.appointmentType}
              onChange={(event) => setForm((prev) => ({ ...prev, appointmentType: event.target.value }))}
            />
            <input
              className=""
              placeholder="Scheduled At (ISO)"
              value={form.scheduledAt}
              onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
            />
            <input
              className=""
              placeholder="Duration (minutes)"
              value={form.durationMinutes}
              onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
            />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={form.requiresOperatingRoom}
                onChange={(event) => setForm((prev) => ({ ...prev, requiresOperatingRoom: event.target.checked }))}
              />
              Requires operating room
            </label>
            <button
              className="app-btn-primary md:col-span-3"
              disabled={
                !form.patientId ||
                !form.providerUserId ||
                !form.scheduledAt ||
                !form.appointmentType ||
                createMutation.isPending
              }
              onClick={() =>
                createMutation.mutate({
                  patientId: form.patientId,
                  providerUserId: form.providerUserId,
                  appointmentType: form.appointmentType,
                  scheduledAt: form.scheduledAt,
                  durationMinutes: Number(form.durationMinutes),
                  requiresOperatingRoom: form.requiresOperatingRoom,
                })
              }
            >
              {createMutation.isPending ? "Scheduling..." : "Create appointment"}
            </button>
          </div>
        </PageCard>
      ) : null}

      <PageCard title="Appointments">
        {appointmentsQuery.isLoading ? <p>Loading appointments...</p> : null}
        <div className="space-y-2">
          {appointmentsQuery.data?.map((appointment) => (
            <article key={appointment.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{appointment.appointmentType}</p>
                <StatusBadge value={appointment.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Patient: {appointment.patientId} | Provider: {appointment.providerUserId} | Version {appointment.version}
              </p>
              {canTransition && transitionsByStatus[appointment.status]?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {transitionsByStatus[appointment.status].map((event) => (
                    <button
                      key={event}
                      className="app-btn-secondary px-2 py-1 text-xs"
                      onClick={() =>
                        transitionMutation.mutate({
                          appointmentId: appointment.id,
                          event,
                          version: appointment.version,
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
