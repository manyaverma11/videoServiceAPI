import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { healthcheck } from "../controllers/healthcheck.controller.js";

const router = Router();
router.route("/healthcheck-ok").get(verifyJWT, healthcheck);

export default router;
