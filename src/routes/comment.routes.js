import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addComment,
  getVideoComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = Router();
router.route("/get-comments/:videoId").get(verifyJWT, getVideoComments);
router.route("/create-comment/:videoId").post(verifyJWT, addComment);
router.route("/update/:commentId").patch(verifyJWT, updateComment);
router.route("/delete/:commentId").delete(verifyJWT, deleteComment);

export default router;
