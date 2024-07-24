import { Router } from "express";
import { createTweet, getUserTweets,deleteTweet, updateTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.route("/create-tweet").post(verifyJWT, createTweet);
router.route("/:username").get(verifyJWT, getUserTweets);
router.route("/update/:tweetId").patch(verifyJWT, updateTweet);
router.route("/delete/:tweetId").delete(verifyJWT, deleteTweet);

export default router;