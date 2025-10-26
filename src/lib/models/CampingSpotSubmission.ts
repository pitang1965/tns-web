import mongoose, { Schema, Document } from 'mongoose';
import { CampingSpotSubmission as CampingSpotSubmissionType } from '@/data/schemas/campingSpot';

export interface ICampingSpotSubmission extends CampingSpotSubmissionType, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampingSpotSubmissionSchema = new Schema<ICampingSpotSubmission>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: [Number],
      required: false,
      validate: {
        validator: function(v: number[]) {
          if (!v || v.length === 0) return true; // Optional field
          return v.length === 2 &&
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: '座標は[経度, 緯度]の形式で、有効な範囲内である必要があります',
      },
    },
    prefecture: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: '有効なURLを入力してください',
      },
    },
    type: {
      type: String,
      enum: ['roadside_station', 'sa_pa', 'rv_park', 'auto_campground', 'onsen_facility', 'convenience_store', 'parking_lot', 'other'],
      default: 'other',
    },
    hasRoof: {
      type: Boolean,
      default: false,
    },
    hasPowerOutlet: {
      type: Boolean,
      default: false,
    },
    isFree: {
      type: Boolean,
      default: true,
    },
    pricePerNight: {
      type: Number,
      min: 0,
    },
    priceNote: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    submitterEmail: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: '有効なメールアドレスを入力してください',
      },
    },
    submitterName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: String,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
CampingSpotSubmissionSchema.index({ status: 1, submittedAt: -1 });
CampingSpotSubmissionSchema.index({ coordinates: '2dsphere' });
CampingSpotSubmissionSchema.index({ prefecture: 1 });

const CampingSpotSubmission = mongoose.models.CampingSpotSubmission ||
  mongoose.model<ICampingSpotSubmission>('CampingSpotSubmission', CampingSpotSubmissionSchema);

export default CampingSpotSubmission;