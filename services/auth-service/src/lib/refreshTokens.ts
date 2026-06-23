import crypto from "crypto";
import { prisma } from "./prisma";
import { config } from "../config";
import { Errors } from "./AppError";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return token;
}

export async function rotateRefreshToken(
  token: string
): Promise<{ userId: string; token: string }> {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw Errors.unauthorized("invalid or expired refresh token");
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const newToken = await issueRefreshToken(record.userId);
  return { userId: record.userId, token: newToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
