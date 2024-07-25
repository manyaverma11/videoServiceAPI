import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  try {
    // Extract videoId from request parameters
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Validate page and limit to ensure they are positive numbers
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

    // Query to get total count of comments for pagination
    const total = await Comment.countDocuments({ video: videoId });

    // Query to fetch comments with pagination and sorting
    const data = await Comment.find( { video: videoId } )
      .sort({ createdAt: -1 }) // Sort comments by createdAt in descending order
      .skip((pageNumber - 1) * limitNumber) // Skip documents based on page number
      .limit(limitNumber); // Limit the number of documents per page

    // Return response with comments data and total count
    return res
      .status(200)
      .json(
        new ApiResponse(200, { data, total }, "Comments retrieved successfully")
      );
  } catch (error) {
    // Handle any errors that occur during the query
    throw new ApiError(500, "An error occurred while retrieving comments");
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized");
  }

  const { content } = req.body;
  const { videoId } = req.params;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Can't send empty comment");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const comment = await Comment.create({
    content,
    owner: req.user._id,
    video: new mongoose.Types.ObjectId(videoId),
  });

  await Video.findByIdAndUpdate(
    videoId,
    { $push: { comments: comment._id } },
    { new: true } // Return the updated document
  );

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // Extract content and commentId from request
  const { content } = req.body;
  const { commentId } = req.params;

  // Validate content
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content cannot be empty.");
  }

  // Validate commentId
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
}

  // Update the comment
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    {
      new: true, // Return the updated document
      runValidators: true, // Validate the update operation
    }
  );

  // Handle case where comment is not found
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Return success response
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
}

  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
