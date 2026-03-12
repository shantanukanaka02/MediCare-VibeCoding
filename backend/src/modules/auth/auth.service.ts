import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env";
import {
  bruteForceLocked,
  unauthorized,
} from "../../shared/errors/error-factory";
import { comparePassword } from "../../shared/security/password";
import {
  decodeTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../shared/security/jwt";
import { sha256 } from "../../shared/utils/hash";
import { clearFailedAttempts, registerFailedAttempt } from "../../infra/middleware/brute-force.middleware";
import { AuthRepository } from "./auth.repository";
import type { AuthResponse } from "./auth.types";

interface LoginInput {
  organizationId: string;
  email: string;
  password: string;
  ip: string;
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepository.findUserByEmail(input.organizationId, input.email);
    if (!user) {
      await registerFailedAttempt(input.ip, input.email);
      throw unauthorized("Invalid credentials");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw bruteForceLocked("Account is locked due to failed login attempts");
    }

    const validPassword = await comparePassword(input.password, user.passwordHash);
    if (!validPassword) {
      const nextCount = user.failedLoginCount + 1;
      const shouldLock = nextCount >= env.BRUTE_FORCE_MAX_ATTEMPTS;
      const lockUntil = shouldLock
        ? new Date(Date.now() + env.LOCKOUT_MINUTES * 60 * 1000)
        : null;

      await this.authRepository.recordFailedLogin(user.userId, lockUntil);
      await registerFailedAttempt(input.ip, input.email);
      throw unauthorized("Invalid credentials");
    }

    await this.authRepository.clearFailedLogin(user.userId);
    await clearFailedAttempts(input.ip, input.email);

    const roleIds = user.roles.map((role) => role.id);
    const roleNames = user.roles.map((role) => role.name);

    const accessToken = signAccessToken({
      sub: user.userId,
      organization_id: user.organizationId,
      role_ids: roleIds,
      permissions: user.permissions,
    });

    const familyId = uuidv4();
    const refreshJti = uuidv4();
    const refreshToken = signRefreshToken(
      {
        sub: user.userId,
        organization_id: user.organizationId,
        role_ids: roleIds,
        permissions: user.permissions,
      },
      refreshJti,
    );

    await this.authRepository.createRefreshToken({
      userId: user.userId,
      organizationId: user.organizationId,
      tokenHash: sha256(refreshToken),
      familyId,
      jti: refreshJti,
      expiresAt: decodeTokenExpiry(refreshToken),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.userId,
        organizationId: user.organizationId,
        email: user.email,
        roles: roleNames,
        permissions: user.permissions,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const claims = verifyRefreshToken(refreshToken);
    if (claims.type !== "refresh") {
      throw unauthorized("Invalid token type");
    }

    const tokenRecord = await this.authRepository.findRefreshTokenByJti(claims.jti);
    if (!tokenRecord || tokenRecord.organizationId !== claims.organization_id) {
      throw unauthorized("Refresh token not found");
    }

    if (tokenRecord.revokedAt) {
      await this.authRepository.revokeRefreshFamily(tokenRecord.familyId, tokenRecord.organizationId);
      throw unauthorized("Refresh token already revoked");
    }

    if (tokenRecord.expiresAt <= new Date()) {
      throw unauthorized("Refresh token expired");
    }

    const incomingHash = sha256(refreshToken);
    if (incomingHash !== tokenRecord.tokenHash) {
      await this.authRepository.revokeRefreshFamily(tokenRecord.familyId, tokenRecord.organizationId);
      throw unauthorized("Refresh token mismatch");
    }

    const user = await this.authRepository.findUserById(claims.organization_id, claims.sub);
    if (!user) {
      throw unauthorized("User no longer exists");
    }

    const roleIds = user.roles.map((role) => role.id);
    const roleNames = user.roles.map((role) => role.name);

    const nextJti = uuidv4();
    const nextRefreshToken = signRefreshToken(
      {
        sub: user.userId,
        organization_id: user.organizationId,
        role_ids: roleIds,
        permissions: user.permissions,
      },
      nextJti,
    );

    const nextAccessToken = signAccessToken({
      sub: user.userId,
      organization_id: user.organizationId,
      role_ids: roleIds,
      permissions: user.permissions,
    });

    await this.authRepository.rotateRefreshToken(tokenRecord.jti, tokenRecord.organizationId, nextJti, {
      userId: user.userId,
      organizationId: user.organizationId,
      tokenHash: sha256(nextRefreshToken),
      familyId: tokenRecord.familyId,
      jti: nextJti,
      expiresAt: decodeTokenExpiry(nextRefreshToken),
    });

    return {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      user: {
        id: user.userId,
        organizationId: user.organizationId,
        email: user.email,
        roles: roleNames,
        permissions: user.permissions,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const claims = verifyRefreshToken(refreshToken);
    const tokenRecord = await this.authRepository.findRefreshTokenByJti(claims.jti);
    if (!tokenRecord) {
      return;
    }

    await this.authRepository.revokeRefreshFamily(tokenRecord.familyId, tokenRecord.organizationId);
  }

  async me(userId: string, organizationId: string): Promise<AuthResponse["user"]> {
    const user = await this.authRepository.findUserById(organizationId, userId);
    if (!user) {
      throw unauthorized("User not found");
    }

    return {
      id: user.userId,
      organizationId: user.organizationId,
      email: user.email,
      roles: user.roles.map((role) => role.name),
      permissions: user.permissions,
    };
  }
}