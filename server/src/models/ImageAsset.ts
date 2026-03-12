import { Schema, model } from 'mongoose';

export interface IImageAsset {
  filename: string;
  url: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ImageAssetSchema = new Schema<IImageAsset>(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
  },
  { timestamps: true, collection: 'image_assets' }
);

ImageAssetSchema.index({ userId: 1, createdAt: -1 });

const ImageAsset = model<IImageAsset>('ImageAsset', ImageAssetSchema);

export default ImageAsset;
