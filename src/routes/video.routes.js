import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getAllVideos,
} from "../controllers/video.controller.js";

const router = Router();

// Route to publish a new video

router.route("/publish-video").post(
  verifyJWT,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

// Route to get all videos with pagination, sorting, and filtering
router.route("/videos").get(verifyJWT, getAllVideos);

// Route to get a video by ID
router.route("/:videoId").get(verifyJWT, getVideoById);

// Route to update video details

router.route("/update-video/:videoId").patch(
  verifyJWT,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateVideo
);

// Route to delete a video by ID
router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);

// Route to toggle publish status
router.patch("/:videoId/publish", verifyJWT, togglePublishStatus);

export default router;
