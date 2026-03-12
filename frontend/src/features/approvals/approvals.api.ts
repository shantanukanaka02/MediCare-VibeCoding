import { apiClient } from "../../shared/api/axios";
import type {
  ApiSuccess,
  ApprovalRecord,
  ApprovalTransitionEvent,
} from "../../shared/types/api";

interface CreateApprovalPayload {
  patientId?: string;
  treatmentPlanId?: string;
  approvalType: "CONTROLLED_SUBSTANCE" | "INSURANCE_PREAUTH" | "CLINICAL_REVIEW";
  requiredRole?: string;
  estimatedCost?: number;
  insuranceLimit?: number;
  medicationClass?: string;
}

interface TransitionApprovalPayload {
  event: ApprovalTransitionEvent;
  reason?: string;
  version: number;
}

export const listApprovalsRequest = async (): Promise<ApprovalRecord[]> => {
  const response = await apiClient.get<ApiSuccess<ApprovalRecord[]>>("/v1/approvals");
  return response.data.data;
};

export const createApprovalRequest = async (payload: CreateApprovalPayload): Promise<ApprovalRecord> => {
  const response = await apiClient.post<ApiSuccess<ApprovalRecord>>("/v1/approvals", payload);
  return response.data.data;
};

export const transitionApprovalRequest = async (
  approvalId: string,
  payload: TransitionApprovalPayload,
): Promise<ApprovalRecord> => {
  const response = await apiClient.post<ApiSuccess<ApprovalRecord>>(`/v1/approvals/${approvalId}/transition`, payload);
  return response.data.data;
};
