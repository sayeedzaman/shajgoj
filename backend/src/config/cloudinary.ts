// Load .env here: ESM hoists imports, so server.ts's dotenv.config() runs after this module
import 'dotenv/config';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true, // Force HTTPS URLs
});

export default cloudinary;
