import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
  //write a tweet req.body
  //cant send empty tweet
  //set content, owner in database

  const { content } = req.body;

  if (content?.trim() === "") {
    throw new ApiError(400, "Can't send empty tweet");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user.username,
  });

  //add tweet to user's tweets
  await User.updateOne(
    { username: req.user.username },
    { $push: { tweets: tweet._id } }
  );
});

export { createTweet };
