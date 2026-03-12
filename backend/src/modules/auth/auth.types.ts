export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    organizationId: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}