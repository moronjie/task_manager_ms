import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";

export interface TokenUser {
  id: string;
  email: string;
  role: string;
}

export function signAccessToken(user: TokenUser): string {
  const options: SignOptions = { expiresIn: config.accessTokenTtl as SignOptions["expiresIn"] };
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    options
  );
}
