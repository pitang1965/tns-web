import { atom } from 'jotai';

export type ItineraryMetadata = {
  id?: string;
  title: string;
  description: string;
  isPublic: boolean;
  numberOfDays?: number;
  totalDays?: number;
  startDate?: string;
  endDate?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  sharedWith?: { id: string; name: string; email: string }[];
  dayPlans?: {
    date: string | null;
    activities: any[];
    notes?: string;
  }[];
  dayPlanSummaries?: {
    date: string | null;
    notes?: string;
    activities?: {
      id?: string;
      title: string;
    }[];
  }[];
  createdAt?: string;
  updatedAt?: string;
};

// メタデータのみを含むアトムを作成
export const itineraryMetadataAtom = atom<ItineraryMetadata>({
  title: '',
  description: '',
  isPublic: false,
  totalDays: 0,
  dayPlanSummaries: [],
});
