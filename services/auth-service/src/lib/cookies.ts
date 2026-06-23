import { Response } from "express";
import { config } from "../config";

export const REFRESH_COOKIE = config.cookieName;

const baseOptions = {
  httpOnly: true, 
  secure: config.cookieSecure, 
  sameSite: config.cookieSameSite,
  path: config.cookiePath,
};

// Set the refresh token as an httpOnly cookie.
export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(config.cookieName, token, {
    ...baseOptions,
    maxAge: config.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });
}

// Clear the refresh cookie (logout). Options must match those used to set it.
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(config.cookieName, baseOptions);
}
