import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config";

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

// Verifies the Bearer token. On success, stashes the identity on the request
// so the proxy layer can forward it downstream as trusted headers.
export function verifyJwt(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "missing or malformed Authorization header",
      code: "UNAUTHORIZED",
    });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId = payload.sub;
    req.userRole = payload.role;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "invalid or expired token",
      code: "UNAUTHORIZED",
    });
  }
}
