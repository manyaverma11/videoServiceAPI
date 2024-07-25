import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinaryVideo = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video",
    });
    //file has been uploaded successfully
    console.log("File has been uploaded on Cloudinary", response);
    fs.unlinkSync(localFilePath);
    return {
      url: response.secure_url,  // Use 'response' instead of 'result'
      duration: response.duration,  // Use 'response' instead of 'result'
    };
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation failed
    return null;
  }
};

export { uploadOnCloudinaryVideo };
