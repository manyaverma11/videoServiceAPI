import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // Validate and parse page and limit
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

  // Validate sortType
  const validSortTypes = ["asc", "desc"];
  if (!validSortTypes.includes(sortType.toLowerCase())) {
    throw new ApiError(400, "Invalid sortType. Must be 'asc' or 'desc'.");
  }

  // Build query object for filtering
  const queryObject = {
    ...(query && { $text: { $search: query } }), // Full-text search if query is provided
    owner: userId, // Assuming userId filters the videos by owner
  };

  // Build sort object
  const sortObject = {};
  sortObject[sortBy] = sortType.toLowerCase() === "asc" ? 1 : -1;

  // Fetch videos with pagination, sorting, and filtering
  const videos = await Video.find(queryObject)
    .sort(sortObject)
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  // Get total count for pagination
  const totalCount = await Video.countDocuments(queryObject);

  return res.status(200).json({
    success: true,
    data: videos,
    totalCount,
    page: pageNumber,
    limit: limitNumber,
  });
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // TODO: get video, upload to cloudinary, create video
  const videoLocalPath = req.files?.video[0]?.path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  if (!video) {
    throw new ApiError(400, "Video file not found");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail file not found");
  }

  const publishedVideo = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: video.duration, // Duration from Cloudinary
    views: 0, // Initialize views count
    owner: req.user._id, // Set the owner from the authenticated user
    isPublished: false,
  });

  if (!publishedVideo) {
    throw new ApiError(500, "Something went wrong while publishing video");
  }

  togglePublishStatus(req, res, publishedVideo._id);

  return res
    .status(201)
    .json(new ApiResponse(200, publishedVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video found successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  // Check if at least one field is provided
  if (!title && !description && !req.files?.thumbnail) {
    throw new ApiError(
      400,
      "At least one field (title, description, or thumbnail) is required"
    );
  }

  // Handle thumbnail upload if provided
  let thumbnailUrl = null;
  if (req.files?.thumbnail) {
    const thumbnailLocalPath = req.files.thumbnail[0]?.path;
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail || !thumbnail.url) {
      throw new ApiError(400, "Thumbnail upload failed");
    }

    thumbnailUrl = thumbnail.url;
  }

  // Find the existing video to get the old thumbnail URL
  const oldVideo = await Video.findById(videoId).select("thumbnail");

  if (!oldVideo) {
    throw new ApiError(404, "Video not found");
  }

  const oldThumbnailUrl = oldVideo.thumbnail;
  const oldThumbnailPublicId = oldThumbnailUrl
    ? oldThumbnailUrl.split("/").pop().split(".")[0]
    : null;

  // Update the video document
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title || oldVideo.title,
        description: description || oldVideo.description,
        thumbnail: thumbnailUrl || oldVideo.thumbnail,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Failed to update video");
  }

  // Delete the old thumbnail from Cloudinary if it exists
  if (oldThumbnailPublicId) {
    try {
      await deleteFromCloudinary(oldThumbnailPublicId);
    } catch (error) {
      console.error("Error deleting old thumbnail:", error);
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // Find the video before deleting to access its URL and thumbnail
  const video = await Video.findById(videoId).select("videoFile thumbnail");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Delete the video file from Cloudinary
  const videoUrl = video.videoFile;
  const videoPublicId = videoUrl
    ? videoUrl.split("/").pop().split(".")[0]
    : null;

  if (videoPublicId) {
    try {
      await deleteFromCloudinary(videoPublicId); // Function to delete video from Cloudinary
    } catch (error) {
      console.error("Error deleting video from Cloudinary:", error);
    }
  }

  // Optionally delete the thumbnail from Cloudinary
  const oldThumbnailUrl = video.thumbnail;
  const oldThumbnailPublicId = oldThumbnailUrl
    ? oldThumbnailUrl.split("/").pop().split(".")[0]
    : null;

  if (oldThumbnailPublicId) {
    try {
      await deleteFromCloudinary(oldThumbnailPublicId); // Function to delete thumbnail from Cloudinary
    } catch (error) {
      console.error("Error deleting old thumbnail from Cloudinary:", error);
    }
  }

  // Delete the video document from the database
  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res, videoId) => {
  // Check if videoId is provided
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // Find the video to check if it exists
  const video = await Video.findById(videoId).select("isPublished");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Toggle the publish status
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: true,
      },
    },
    {
      new: true, // Return the updated document
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video publish status updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
