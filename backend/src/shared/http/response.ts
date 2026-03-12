export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
}

export const success = <T>(data: T): { data: T } => ({ data });