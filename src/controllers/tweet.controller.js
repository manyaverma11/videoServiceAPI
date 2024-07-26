import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  // Check if the user is authenticated
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized");
  }

  const { content } = req.body;

  // Ensure content is not empty
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Can't send empty tweet");
  }

  // Create the tweet
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  // Add the tweet to the user's list of tweets
  await User.findByIdAndUpdate(
    req.user._id,
    { $push: { tweets: tweet._id } },
    { new: true } // Return the updated document
  );

  // Return the created tweet in the response
  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // Ensure the user is authenticated
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized");
  }

  const { username } = req.params;

  // Find the user by username
  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Aggregation pipeline to get the user's tweets
  const userTweets = await User.aggregate([
    {
      $match: {
        _id: user._id,
      },
    },
    {
      $lookup: {
        from: "tweets", // collection name in MongoDB (should be lowercase)
        localField: "_id",
        foreignField: "owner",
        as: "tweets",
      },
    },
    {
      $unwind: {
        path: "$tweets",
        preserveNullAndEmptyArrays: true, // Keep users with no tweets
      },
    },
    {
      $sort: {
        "tweets.createdAt": -1, // Sort tweets by creation date in descending order
      },
    },
    {
      $project: {
        _id: "$tweets._id",
        content: "$tweets.content",
        createdAt: "$tweets.createdAt",
        updatedAt: "$tweets.updatedAt",
        username: "$username",
        email: "$email",
      },
    },
  ]);

  // Return the user tweets in the response
  return res
    .status(200)
    .json(
      new ApiResponse(200, userTweets, "User tweets retrieved successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;
  console.log(tweetId);

  if (!content || content?.trim() === "") {
    throw new ApiError(400, "Can't send empty tweet");
  }

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content },
    },
    {
      new: true, // Return the updated document
      runValidators: true, // Validate the update operation
    }
  );

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  await Like.findByIdAndDelete({ tweet: tweetId });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});
export { createTweet, getUserTweets, updateTweet, deleteTweet };
