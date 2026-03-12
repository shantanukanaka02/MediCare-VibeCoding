import { apiClient } from "../../shared/api/axios";
import type {
  ApiSuccess,
  LabOrderRecord,
  LabTransitionEvent,
} from "../../shared/types/api";

interface CreateLabOrderPayload {
  patientId: string;
  testCode: string;
  testName: string;
}

interface TransitionLabOrderPayload {
  event: LabTransitionEvent;
  resultSummary?: string;
  resultDocumentUrl?: string;
  reason?: string;
  version: number;
}

export const listLabOrdersRequest = async (): Promise<LabOrderRecord[]> => {
  const response = await apiClient.get<ApiSuccess<LabOrderRecord[]>>("/v1/lab-orders");
  return response.data.data;
};

export const createLabOrderRequest = async (payload: CreateLabOrderPayload): Promise<LabOrderRecord> => {
  const response = await apiClient.post<ApiSuccess<LabOrderRecord>>("/v1/lab-orders", payload);
  return response.data.data;
};

export const transitionLabOrderRequest = async (
  labOrderId: string,
  payload: TransitionLabOrderPayload,
): Promise<LabOrderRecord> => {
  const response = await apiClient.post<ApiSuccess<LabOrderRecord>>(`/v1/lab-orders/${labOrderId}/transition`, payload);
  return response.data.data;
};
