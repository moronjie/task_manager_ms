import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { Errors } from "../lib/AppError";
import { sendSuccess } from "../lib/http";

// Strip the password hash before returning a user to the client.
function publicUser(user: User) {
  const { password, ...rest } = user;
  return rest;
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

  const token = signToken(user);
  return sendSuccess(res, { token, user: publicUser(user) }, "registered", 201);
}

export async function login(req: Request, res: Response) {
  // req.body is already validated by validateBody(loginSchema).
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Errors.unauthorized("invalid credentials");
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw Errors.unauthorized("invalid credentials");
  }

  const token = signToken(user);
  return sendSuccess(res, { token, user: publicUser(user) }, "logged in");
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
