import { apiClient } from "../../shared/api/axios";
import type {
  ApiSuccess,
  TreatmentPlanRecord,
  TreatmentTransitionEvent,
} from "../../shared/types/api";

interface CreateTreatmentPlanPayload {
  patientId: string;
  diagnoses: string[];
  medications: Array<{ name: string; class?: string; dosage?: string }>;
  labTests: string[];
  procedures: string[];
}

interface TransitionTreatmentPlanPayload {
  event: TreatmentTransitionEvent;
  reason?: string;
  version: number;
}

export const listTreatmentPlansRequest = async (): Promise<TreatmentPlanRecord[]> => {
  const response = await apiClient.get<ApiSuccess<TreatmentPlanRecord[]>>("/v1/treatment-plans");
  return response.data.data;
};

export const createTreatmentPlanRequest = async (payload: CreateTreatmentPlanPayload): Promise<TreatmentPlanRecord> => {
  const response = await apiClient.post<ApiSuccess<TreatmentPlanRecord>>("/v1/treatment-plans", payload);
  return response.data.data;
};

export const transitionTreatmentPlanRequest = async (
  treatmentPlanId: string,
  payload: TransitionTreatmentPlanPayload,
): Promise<TreatmentPlanRecord> => {
  const response = await apiClient.post<ApiSuccess<TreatmentPlanRecord>>(`/v1/treatment-plans/${treatmentPlanId}/transition`, payload);
  return response.data.data;
};
