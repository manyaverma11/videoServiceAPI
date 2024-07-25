import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });
    console.log("File has been deleted from Cloudinary:", response); 
    return response;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

const deleteFromCloudinaryVideo = async (publicId) => {
  if (!publicId) return null;
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
    console.log("File has been deleted from Cloudinary:", response); 
    return response;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

export { deleteFromCloudinary, deleteFromCloudinaryVideo };
