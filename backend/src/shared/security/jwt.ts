import jwt, { type SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env";
import type { AuthTokenClaims } from "../types/request-context";

interface TokenPayloadInput {
  sub: string;
  organization_id: string;
  role_ids: string[];
  permissions: string[];
}

export const createJti = (): string => uuidv4();

const accessOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
};

const refreshOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
};

export const signAccessToken = (payload: TokenPayloadInput): string =>
  jwt.sign(
    {
      ...payload,
      type: "access",
      jti: createJti(),
    },
    env.JWT_ACCESS_SECRET,
    accessOptions,
  );

export const signRefreshToken = (
  payload: Omit<TokenPayloadInput, "permissions"> & { permissions?: string[] },
  jti: string,
): string =>
  jwt.sign(
    {
      ...payload,
      permissions: payload.permissions ?? [],
      type: "refresh",
      jti,
    },
    env.JWT_REFRESH_SECRET,
    refreshOptions,
  );

export const verifyAccessToken = (token: string): AuthTokenClaims =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenClaims;

export const verifyRefreshToken = (token: string): AuthTokenClaims =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenClaims;

export const decodeTokenExpiry = (token: string): Date => {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new Error("Token does not contain expiration");
  }
  return new Date(decoded.exp * 1000);
};