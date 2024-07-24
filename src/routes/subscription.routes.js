import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels} from "../controllers/subscription.controller.js";

const router = Router();
router.route("/toggle/:channelId").post(verifyJWT, toggleSubscription);
router.route("/subscribers/:channelId").get(verifyJWT, getUserChannelSubscribers);
router.route("/subscribed-channels").get(verifyJWT, getSubscribedChannels);
export default router;