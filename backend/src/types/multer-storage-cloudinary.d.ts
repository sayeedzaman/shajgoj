declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  import { v2 as cloudinary } from 'cloudinary';
  import { Request } from 'express';

  interface CloudinaryParams {
    folder?: string;
    format?: string;
    public_id?: string;
    allowed_formats?: string[];
    transformation?: Array<{
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      fetch_format?: string;
    }>;
    resource_type?: string;
  }

  interface CloudinaryStorageOptions {
    cloudinary: typeof cloudinary;
    params:
      | CloudinaryParams
      | ((
          req: Request,
          file: Express.Multer.File
        ) => Promise<CloudinaryParams>);
  }

  // Factory function that returns a StorageEngine
  function CloudinaryStorage(options: CloudinaryStorageOptions): StorageEngine;

  export = CloudinaryStorage;
}
