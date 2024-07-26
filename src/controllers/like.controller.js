import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  // Check if the video exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    // Remove the like
    await Like.findByIdAndDelete(existingLike._id);

    // Decrement likeCount
    await Video.findByIdAndUpdate(videoId, { $inc: { likeCount: -1 } });

    res.status(200).json({ message: "Video unliked successfully" });
  } else {
    // Add a new like
    await Like.create({ video: videoId, likedBy: req.user._id });

    // Increment likeCount
    await Video.findByIdAndUpdate(videoId, { $inc: { likeCount: 1 } });

    res.status(200).json({ message: "Video liked successfully" });
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  // Check if the comment exists
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    // Remove the like
    await Like.findByIdAndDelete(existingLike._id);

    // Decrement likeCount
    await Comment.findByIdAndUpdate(commentId, { $inc: { likeCount: -1 } });

    res.status(200).json({ message: "Comment unliked successfully" });
  } else {
    // Add a new like
    await Like.create({ comment: commentId, likedBy: req.user._id });

    // Increment likeCount
    await Comment.findByIdAndUpdate(commentId, { $inc: { likeCount: 1 } });

    res.status(200).json({ message: "Comment liked successfully" });
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  // Check if the tweet exists
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    // Remove the like
    await Like.findByIdAndDelete(existingLike._id);

    // Decrement likeCount
    await Tweet.findByIdAndUpdate(tweetId, { $inc: { likeCount: -1 } });

    res.status(200).json({ message: "Tweet unliked successfully" });
  } else {
    // Add a new like
    await Like.create({ tweet: tweetId, likedBy: req.user._id });

    // Increment likeCount
    await Tweet.findByIdAndUpdate(tweetId, { $inc: { likeCount: 1 } });

    res.status(200).json({ message: "Tweet liked successfully" });
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Access userId directly from req.user
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (
    isNaN(pageNumber) ||
    pageNumber <= 0 ||
    isNaN(limitNumber) ||
    limitNumber <= 0
  ) {
    throw new ApiError(
      400,
      "Invalid page or limit. Both page and limit must be positive integers."
    );
  }

  // Query to get total count of liked videos
  const total = await Like.countDocuments({
    likedBy: userId,
    video: { $exists: true },
  });

  // Query to fetch liked videos with pagination and sorting
  const data = await Like.find({ likedBy: userId, video: { $exists: true } })
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data, total },
        "Liked videos retrieved successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
