import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";

export interface TokenUser {
  id: string;
  email: string;
  role: string;
}

// Sign a JWT carrying the user's identity. The gateway later verifies this
// with the same shared secret.
export function signToken(user: TokenUser): string {
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    options
  );
}
