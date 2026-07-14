import mongoose, { Document, Schema } from 'mongoose';

export interface IItinerary extends Document {
  title: string;
  description: string;
  numberOfDays: number;
  startDate?: string;
  dayPlans: Array<{
    date: string | null;
    activities: Array<Record<string, unknown>>;
    notes?: string;
  }>;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  isPublic: boolean;
  sharedWith: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ItinerarySchema = new Schema<IItinerary>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    numberOfDays: { type: Number, required: true },
    startDate: { type: String },
    // Mongooseの型定義がMixedの配列リテラルを受け付けないため、型のみキャスト（ランタイムは配列のまま）
    dayPlans: {
      type: [Schema.Types.Mixed] as unknown as typeof Schema.Types.Mixed,
      default: [],
    },
    owner: {
      id: { type: String, required: true },
      name: { type: String, default: '' },
      email: { type: String, required: true },
    },
    isPublic: { type: Boolean, default: false },
    sharedWith: {
      type: [Schema.Types.Mixed] as unknown as typeof Schema.Types.Mixed,
      default: [],
    },
  },
  { timestamps: true },
);

ItinerarySchema.index({ 'owner.id': 1 });
ItinerarySchema.index({ isPublic: 1, updatedAt: -1 });

export default mongoose.models.Itinerary ||
  mongoose.model<IItinerary>('Itinerary', ItinerarySchema);
