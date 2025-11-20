import mongoose, { Document, Schema } from 'mongoose';

export interface ICampingSpot extends Document {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  prefecture: string;
  address?: string;
  url?: string;
  type: 'roadside_station' | 'sa_pa' | 'rv_park' | 'auto_campground' | 'onsen_facility' | 'convenience_store' | 'parking_lot' | 'other';
  distanceToToilet?: number; // meters
  distanceToBath?: number; // meters
  distanceToConvenience?: number; // meters
  nearbyToiletCoordinates?: [number, number]; // [lng, lat]
  nearbyConvenienceCoordinates?: [number, number]; // [lng, lat]
  nearbyBathCoordinates?: [number, number]; // [lng, lat]
  elevation: number; // meters
  // 旧評価システム（段階的廃止予定）
  quietnessLevel?: 1 | 2 | 3 | 4 | 5; // 1=noisy, 5=very quiet
  securityLevel?: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  overallRating?: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  // 新評価システム（客観的データベース）
  security: {
    hasGate: boolean;
    hasLighting: boolean;
    hasStaff: boolean;
  };
  nightNoise: {
    hasNoiseIssues: boolean;
    nearBusyRoad: boolean;
    isQuietArea: boolean;
  };
  hasRoof: boolean;
  hasPowerOutlet: boolean;
  pricing: {
    isFree: boolean;
    pricePerNight?: number;
    priceNote?: string;
  };
  capacity?: number; // number of regular vehicles
  capacityLarge?: number; // number of large vehicles
  restrictions: string[];
  amenities: string[];
  notes?: string;
  isVerified: boolean;
  submittedBy?: string;
  lastVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campingSpotSchema = new Schema<ICampingSpot>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v: number[]) {
        return v.length === 2
          &&
               v[0] >= -180 && v[0] <= 180 && // longitude
               v[1] >= -90 && v[1] <= 90;     // latitude
      },
      message: 'Coordinates must be [longitude, latitude] within valid ranges'
    }
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
        if (!v) return true; // optional field
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'URLの形式が正しくありません'
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['roadside_station', 'sa_pa', 'rv_park', 'auto_campground', 'onsen_facility', 'convenience_store', 'parking_lot', 'other'],
  },
  distanceToToilet: {
    type: Number,
    min: 0,
  },
  distanceToBath: {
    type: Number,
    min: 0,
  },
  distanceToConvenience: {
    type: Number,
    min: 0,
  },
  nearbyToiletCoordinates: [Number],
  nearbyConvenienceCoordinates: [Number],
  nearbyBathCoordinates: [Number],
  elevation: {
    type: Number,
    required: true,
    min: -10,
    max: 3776,
  },
  // 旧評価システム（段階的廃止予定）
  quietnessLevel: {
    type: Number,
    min: 1,
    max: 5,
  },
  securityLevel: {
    type: Number,
    min: 1,
    max: 5,
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  // 新評価システム（客観的データベース）
  security: {
    hasGate: {
      type: Boolean,
      default: false,
    },
    hasLighting: {
      type: Boolean,
      default: false,
    },
    hasStaff: {
      type: Boolean,
      default: false,
    },
  },
  nightNoise: {
    hasNoiseIssues: {
      type: Boolean,
      default: false,
    },
    nearBusyRoad: {
      type: Boolean,
      default: false,
    },
    isQuietArea: {
      type: Boolean,
      default: false,
    },
  },
  hasRoof: {
    type: Boolean,
    required: true,
    default: false,
  },
  hasPowerOutlet: {
    type: Boolean,
    required: true,
    default: false,
  },
  pricing: {
    isFree: {
      type: Boolean,
      required: true,
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
  },
  capacity: {
    type: Number,
    min: 1,
  },
  capacityLarge: {
    type: Number,
    min: 1,
  },
  restrictions: [{
    type: String,
    trim: true,
  }],
  amenities: [{
    type: String,
    trim: true,
  }],
  notes: {
    type: String,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  submittedBy: {
    type: String,
    trim: true,
  },
  lastVerified: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Pre-save validation for coordinate fields
campingSpotSchema.pre('save', function(next) {
  // Validate coordinate fields only if they exist and are not empty
  const validateCoordinates = (coords: number[], fieldName: string) => {
    if (coords && coords.length > 0) {
      if (coords.length !== 2) {
        return new Error(`${fieldName} must have exactly 2 elements [longitude, latitude]`);
      }
      if (coords[0] < -180 || coords[0] > 180 || coords[1] < -90 || coords[1] > 90) {
        return new Error(`${fieldName} must be within valid ranges: longitude (-180 to 180), latitude (-90 to 90)`);
      }
    }
    return null;
  };

  const toiletError = validateCoordinates(this.nearbyToiletCoordinates || [], 'nearbyToiletCoordinates');
  if (toiletError) return next(toiletError);

  const convenienceError = validateCoordinates(this.nearbyConvenienceCoordinates || [], 'nearbyConvenienceCoordinates');
  if (convenienceError) return next(convenienceError);

  const bathError = validateCoordinates(this.nearbyBathCoordinates || [], 'nearbyBathCoordinates');
  if (bathError) return next(bathError);

  next();
});

// Indexes for efficient filtering and geospatial queries
campingSpotSchema.index({ coordinates: '2dsphere' });
campingSpotSchema.index({ prefecture: 1 });
campingSpotSchema.index({ type: 1 });
campingSpotSchema.index({ 'pricing.isFree': 1 });
campingSpotSchema.index({ quietnessLevel: 1 });
campingSpotSchema.index({ securityLevel: 1 });
campingSpotSchema.index({ overallRating: 1 });

// Compound index for common filter combinations
campingSpotSchema.index({
  coordinates: '2dsphere',
  type: 1,
  'pricing.isFree': 1,
  quietnessLevel: 1,
  securityLevel: 1,
});

const CampingSpot = mongoose.models.CampingSpot || mongoose.model<ICampingSpot>('CampingSpot', campingSpotSchema);

export default CampingSpot;