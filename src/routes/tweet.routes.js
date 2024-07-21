import { Router } from "express";
import { createTweet } from "../controllers/tweet.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.route("/create-tweet").post(verifyJWT, createTweet);

export default router;