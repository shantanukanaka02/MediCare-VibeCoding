import { apiClient } from "../../shared/api/axios";
import type {
  ApiSuccess,
  TriageCaseRecord,
  TriageTransitionEvent,
} from "../../shared/types/api";

interface CreateTriagePayload {
  patientId: string;
  symptoms: string[];
  age?: number;
  bloodPressureSystolic?: number;
  assignedDoctorId?: string;
}

interface TransitionTriagePayload {
  event: TriageTransitionEvent;
  reason?: string;
  version: number;
}

export const listTriageCasesRequest = async (): Promise<TriageCaseRecord[]> => {
  const response = await apiClient.get<ApiSuccess<TriageCaseRecord[]>>("/v1/triage-cases");
  return response.data.data;
};

export const createTriageCaseRequest = async (payload: CreateTriagePayload): Promise<TriageCaseRecord> => {
  const response = await apiClient.post<ApiSuccess<TriageCaseRecord>>("/v1/triage-cases", payload);
  return response.data.data;
};

export const transitionTriageCaseRequest = async (
  triageCaseId: string,
  payload: TransitionTriagePayload,
): Promise<TriageCaseRecord> => {
  const response = await apiClient.post<ApiSuccess<TriageCaseRecord>>(`/v1/triage-cases/${triageCaseId}/transition`, payload);
  return response.data.data;
};
