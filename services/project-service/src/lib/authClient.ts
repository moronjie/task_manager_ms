import { config } from "../config";
import { Errors } from "./AppError";

// Confirm a user exists in the auth service. Used before adding someone as a
// workspace member. Throws a validation error if the user is unknown.
export async function assertUserExists(userId: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${config.authServiceUrl}/users/${userId}`);
  } catch {
    throw new Error("auth service unreachable");
  }

  if (res.status === 404) {
    throw Errors.validation("user does not exist");
  }
  if (!res.ok) {
    throw new Error(`auth service returned ${res.status}`);
  }
}
