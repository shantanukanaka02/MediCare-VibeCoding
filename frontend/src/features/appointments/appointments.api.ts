import { apiClient } from "../../shared/api/axios";
import type {
  ApiSuccess,
  AppointmentRecord,
  AppointmentTransitionEvent,
} from "../../shared/types/api";

interface CreateAppointmentPayload {
  patientId: string;
  providerUserId: string;
  appointmentType: string;
  scheduledAt: string;
  durationMinutes: number;
  requiresOperatingRoom?: boolean;
  roomId?: string;
  equipment?: string[];
}

interface TransitionAppointmentPayload {
  event: AppointmentTransitionEvent;
  reason?: string;
  version: number;
}

export const listAppointmentsRequest = async (): Promise<AppointmentRecord[]> => {
  const response = await apiClient.get<ApiSuccess<AppointmentRecord[]>>("/v1/appointments");
  return response.data.data;
};

export const createAppointmentRequest = async (payload: CreateAppointmentPayload): Promise<AppointmentRecord> => {
  const response = await apiClient.post<ApiSuccess<AppointmentRecord>>("/v1/appointments", payload);
  return response.data.data;
};

export const transitionAppointmentRequest = async (
  appointmentId: string,
  payload: TransitionAppointmentPayload,
): Promise<AppointmentRecord> => {
  const response = await apiClient.post<ApiSuccess<AppointmentRecord>>(`/v1/appointments/${appointmentId}/transition`, payload);
  return response.data.data;
};
