import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { signAccessToken } from "../lib/jwt";
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from "../lib/refreshTokens";
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE } from "../lib/cookies";
import { Errors } from "../lib/AppError";
import { sendSuccess } from "../lib/http";

// Strip the password hash before returning a user to the client.
function publicUser(user: User) {
  const { password, ...rest } = user;
  return rest;
}

// Issue a token pair: the refresh token goes into an httpOnly cookie; only the
// access token (+ user) is returned in the response body.
async function respondWithSession(
  res: Response,
  user: User,
  message: string,
  statusCode = 200
) {
  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);
  return sendSuccess(res, { accessToken, user: publicUser(user) }, message, statusCode);
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Errors.conflict("email already registered");
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name },
  });

  return respondWithSession(res, user, "registered", 201);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Errors.unauthorized("invalid credentials");
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw Errors.unauthorized("invalid credentials");
  }

  return respondWithSession(res, user, "logged in");
}

// Exchange the refresh-token cookie for a new access token; rotates the cookie
// (old token revoked, a fresh one set). The frontend only ever sees the access
// token in the body.
export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw Errors.unauthorized("missing refresh token");
  }

  const rotated = await rotateRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
  if (!user) {
    throw Errors.unauthorized("invalid or expired refresh token");
  }

  const accessToken = signAccessToken(user);
  setRefreshCookie(res, rotated.token);
  return sendSuccess(res, { accessToken }, "token refreshed");
}

// Revoke the refresh-token cookie (logout) and clear it. Idempotent.
export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await revokeRefreshToken(token);
  }
  clearRefreshCookie(res);
  return sendSuccess(res, null, "logged out");
}

// Reads x-user-id forwarded by the gateway after it verified the JWT.
export async function me(req: Request, res: Response) {
  const userId = req.header("x-user-id");
  if (!userId) {
    throw Errors.unauthorized("missing user context");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Errors.notFound("user not found");
  }
  return sendSuccess(res, { user: publicUser(user) });
}

// Internal lookup used by other services if they need user details.
export async function getUser(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    throw Errors.notFound("user not found");
  }
  return sendSuccess(res, { user: publicUser(user) });
}
