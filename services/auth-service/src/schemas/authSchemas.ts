import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "password must be at least 6 characters"),
  name: z.string().min(1, "name is required"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
