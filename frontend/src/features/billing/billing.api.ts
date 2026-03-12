import { apiClient } from "../../shared/api/axios";
import type {
  ApiSuccess,
  BillingTriggerRecord,
  BillingTransitionEvent,
} from "../../shared/types/api";

interface CreateBillingTriggerPayload {
  patientId?: string;
  treatmentPlanId?: string;
  sourceEntityType: string;
  sourceEntityId: string;
  triggerType: string;
  payload?: Record<string, unknown>;
}

interface TransitionBillingTriggerPayload {
  event: BillingTransitionEvent;
  failureReason?: string;
  reason?: string;
  version: number;
}

export const listBillingTriggersRequest = async (): Promise<BillingTriggerRecord[]> => {
  const response = await apiClient.get<ApiSuccess<BillingTriggerRecord[]>>("/v1/billing-triggers");
  return response.data.data;
};

export const createBillingTriggerRequest = async (payload: CreateBillingTriggerPayload): Promise<BillingTriggerRecord> => {
  const response = await apiClient.post<ApiSuccess<BillingTriggerRecord>>("/v1/billing-triggers", payload);
  return response.data.data;
};

export const transitionBillingTriggerRequest = async (
  billingTriggerId: string,
  payload: TransitionBillingTriggerPayload,
): Promise<BillingTriggerRecord> => {
  const response = await apiClient.post<ApiSuccess<BillingTriggerRecord>>(`/v1/billing-triggers/${billingTriggerId}/transition`, payload);
  return response.data.data;
};
