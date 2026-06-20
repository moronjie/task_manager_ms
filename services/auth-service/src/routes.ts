import { Router } from "express";
import { register, login, me, getUser } from "./controllers/authController";
import { asyncHandler } from "./lib/http";
import { validateBody } from "./lib/validate";
import { registerSchema, loginSchema } from "./schemas/authSchemas";

const router = Router();

router.post("/register", validateBody(registerSchema), asyncHandler(register));
router.post("/login", validateBody(loginSchema), asyncHandler(login));
router.get("/me", asyncHandler(me));
router.get("/users/:id", asyncHandler(getUser));

export default router;
