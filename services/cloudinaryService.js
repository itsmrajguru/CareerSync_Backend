const cloudinary = require('cloudinary').v2;
require('dotenv').config();

/* setting up cloudinary with the credentials stored in the .env file */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/* function to upload a file buffer to cloudinary
logic : 1)take the buffer, the destination folder and the resource type
        2)open an upload stream to cloudinary
        3)return the secure url and public id once the upload is done */
const uploadToCloudinary = (buffer, folder, resourceType = 'image') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                // apply auto format and quality for image uploads only
                ...(resourceType === 'image' && { fetch_format: 'auto', quality: 'auto' })
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
};

module.exports = { uploadToCloudinary };
