import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addComment, getVideoComments, updateComment, deleteComment } from "../controllers/comment.controller.js";

const router = Router();
router.route("/create-tweet").post(verifyJWT, addComment);
router.route("/:videoId").get(verifyJWT, getVideoComments);
router.route("/update/:tweetId").patch(verifyJWT, updateComment);
router.route("/delete/:tweetId").delete(verifyJWT, deleteComment);

export default router;