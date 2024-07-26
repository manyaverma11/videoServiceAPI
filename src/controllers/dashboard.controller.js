import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(404, "Channel not found");
  }

  const channel = await User.findById(channelId);
  const totalVideos = await Video.countDocuments({ owner: channel._id });

  const totalSubscribers = await Subscription.countDocuments({
    channel: channel._id,
  });

  // Aggregate total views
  const videoViewsAggregation = await Video.aggregate([
    { $match: { owner: channel._id } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);

  const totalVideoViews = videoViewsAggregation[0]?.totalViews || 0;
  explain;

  // Aggregate total likes
  const videoIds = await Video.find({ owner: channel._id }).distinct("_id");
  const totalLikesAggregation = await Like.aggregate([
    { $match: { video: { $in: videoIds } } },
    { $group: { _id: null, totalLikes: { $sum: 1 } } },
  ]);

  const totalLikes = totalLikesAggregation[0]?.totalLikes || 0;

  const response = {
    totalVideoViews,
    totalSubscribers,
    totalVideos,
    totalLikes,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, response, "Channel Stats retrieved successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // Extract pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  // Validate pagination parameters
  if (page <= 0 || limit <= 0) {
    throw new ApiError(400, "Page and limit must be positive integers.");
  }

  // Calculate skip value
  const skip = (page - 1) * limit;

  // Fetch paginated videos
  const videos = await Video.find({ owner: channel._id })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); // Optional: Sort by creation date

  // Get total count for pagination metadata
  const totalVideosCount = await Video.countDocuments({ owner: channel._id });

  const response = {
    videos,
    totalCount: totalVideosCount,
    totalPages: Math.ceil(totalVideosCount / limit),
    currentPage: page,
    pageSize: limit,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Videos retrieved successfully"));
});

export { getChannelStats, getChannelVideos };
