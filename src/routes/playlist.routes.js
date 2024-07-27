import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();
router.route("create-playlist").post(verifyJWT, createPlaylist);
router.route("/all-playlists/:userId").get(verifyJWT, getUserPlaylists);
router.route("/playlist/:playlistId").get(verifyJWT, getPlaylistById);
router
  .route("/add-video/:playlistId/:videoId")
  .post(verifyJWT, addVideoToPlaylist);
router
  .route("/remove-video/:playlistId/:videoId")
  .delete(verifyJWT, removeVideoFromPlaylist);
router.route("/delete/:playlistId").delete(verifyJWT, deletePlaylist);
router.route("/update/:playlistId").patch(verifyJWT, updatePlaylist);

export default router;
