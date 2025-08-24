import mongoose, { Document, Schema } from 'mongoose';

export interface ICampingSpot extends Document {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  prefecture: string;
  address?: string;
  type: 'roadside_station' | 'paid_parking' | 'sa_pa' | 'park' | 'shrine_temple' | 'beach' | 'mountain' | 'rv_park' | 'convenience_store' | 'other';
  distanceToToilet?: number; // meters
  distanceToBath?: number; // meters
  distanceToConvenience?: number; // meters
  elevation?: number; // meters, null if no bath nearby
  quietnessLevel?: 1 | 2 | 3 | 4 | 5; // 1=noisy, 5=very quiet
  securityLevel?: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  overallRating?: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  hasRoof: boolean;
  hasPowerOutlet: boolean;
  hasGate: boolean;
  pricing: {
    isFree: boolean;
    pricePerNight?: number;
    priceNote?: string;
  };
  capacity?: number; // number of vehicles
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
        return v.length === 2 && 
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
  type: {
    type: String,
    required: true,
    enum: ['roadside_station', 'paid_parking', 'sa_pa', 'park', 'shrine_temple', 'beach', 'mountain', 'rv_park', 'convenience_store', 'other'],
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
  elevation: {
    type: Number,
    min: 0,
  },
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
  hasGate: {
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