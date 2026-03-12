import { apiClient } from "../../shared/api/axios";
import type { ApiSuccess, PatientRecord } from "../../shared/types/api";

interface CreatePatientPayload {
  externalRef?: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
}

export const listPatientsRequest = async (): Promise<PatientRecord[]> => {
  const response = await apiClient.get<ApiSuccess<PatientRecord[]>>("/v1/patients?limit=100");
  return response.data.data;
};

export const createPatientRequest = async (payload: CreatePatientPayload): Promise<PatientRecord> => {
  const response = await apiClient.post<ApiSuccess<PatientRecord>>("/v1/patients", payload);
  return response.data.data;
};
