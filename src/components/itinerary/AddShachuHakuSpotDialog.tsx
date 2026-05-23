'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LoadingState } from '@/components/common/LoadingState';
import { NearbyShachuHakuSpotsList } from './NearbyShachuHakuSpotsList';
import { getNearestCampingSpots } from '../../app/actions/campingSpots/public';
import {
  CampingSpotWithDistance,
  campingSpotToActivity,
  bathFacilityToActivity,
} from '@/lib/utils/campingSpotConverter';
import { toast } from 'sonner';
import { Droplets, MapPin, Search, Tent } from 'lucide-react';

const SimpleLocationPicker = dynamic(
  () => import('@/components/common/SimpleLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <LoadingState variant="card" message="地図を読み込み中..." />
    ),
  },
);

type CampingActivity =
  | ReturnType<typeof campingSpotToActivity>
  | ReturnType<typeof bathFacilityToActivity>;

type AddShachuHakuSpotDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (activities: CampingActivity[]) => void;
};

type Step = 'location' | 'spots' | 'loading' | 'confirm';

export function AddShachuHakuSpotDialog({
  open,
  onOpenChange,
  onAdd,
}: AddShachuHakuSpotDialogProps) {
  'use memo';
  const [step, setStep] = useState<Step>('location');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbySpots, setNearbySpots] = useState<CampingSpotWithDistance[]>([]);
  const [selectedSpot, setSelectedSpot] =
    useState<CampingSpotWithDistance | null>(null);
  const [addBath, setAddBath] = useState(true);
  const [bathPosition, setBathPosition] = useState<'before' | 'after' | null>(
    null,
  );

  // Reset state when dialog closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setStep('location');
        setSelectedLocation(null);
        setNearbySpots([]);
        setSelectedSpot(null);
        setAddBath(true);
        setBathPosition(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  // Handle location selection from map
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  }, []);

  // Search for nearby spots
  const handleSearchSpots = useCallback(async () => {
    if (!selectedLocation) {
      toast.error('座標を選択してください');
      return;
    }

    setStep('loading');

    try {
      const spots = await getNearestCampingSpots(
        selectedLocation.lat,
        selectedLocation.lng,
        5, // Get 5 nearest spots
      );

      setNearbySpots(spots);
      setSelectedSpot(null);
      setStep('spots');

      if (spots.length === 0) {
        toast.warning('近くに車中泊スポットが見つかりませんでした', {
          description: '別の地点を選択してください',
        });
      }
    } catch (error) {
      console.error('Failed to fetch nearby camping spots:', error);
      toast.error('車中泊スポットの検索に失敗しました', {
        description: 'もう一度お試しください',
      });
      setStep('location');
    }
  }, [selectedLocation]);

  // Handle spot selection
  const handleSpotSelect = useCallback((spot: CampingSpotWithDistance) => {
    setSelectedSpot(spot);
  }, []);

  // Add selected spot as activity (go to confirm step if bath facility exists)
  const handleAddActivity = useCallback(() => {
    if (!selectedSpot) {
      toast.error('車中泊スポットを選択してください');
      return;
    }

    if (selectedSpot.nearbyBathCoordinates) {
      setAddBath(true);
      setBathPosition(null);
      setStep('confirm');
      return;
    }

    onAdd([campingSpotToActivity(selectedSpot)]);
    handleOpenChange(false);
    toast.success('車中泊スポットを追加しました', {
      description: selectedSpot.name,
    });
  }, [selectedSpot, onAdd, handleOpenChange]);

  // Confirm and add camping spot (+ optional bath facility)
  const handleConfirmAdd = useCallback(() => {
    if (!selectedSpot) return;

    const campingActivity = campingSpotToActivity(selectedSpot);
    const activities: CampingActivity[] = [];

    if (addBath && selectedSpot.nearbyBathCoordinates) {
      const bathActivity = bathFacilityToActivity(selectedSpot);
      if (bathPosition === 'before') {
        activities.push(bathActivity, campingActivity);
      } else {
        activities.push(campingActivity, bathActivity);
      }
    } else {
      activities.push(campingActivity);
    }

    onAdd(activities);
    handleOpenChange(false);

    toast.success(`${activities.length}件のアクティビティを追加しました`, {
      description:
        activities.length > 1
          ? `${selectedSpot.name}、入浴施設`
          : selectedSpot.name,
    });
  }, [selectedSpot, addBath, bathPosition, onAdd, handleOpenChange]);

  // Go back to location selection
  const handleBackToLocation = useCallback(() => {
    setStep('location');
    setNearbySpots([]);
    setSelectedSpot(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>車中泊スポットを追加</DialogTitle>
          <DialogDescription>
            {step === 'location' &&
              '地図上で検索したい地点をクリックしてください'}
            {step === 'loading' && '車中泊スポットを検索しています...'}
            {step === 'spots' && '車中泊スポットを選択してアクティビティに追加'}
            {step === 'confirm' && '追加するアクティビティを確認してください'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Location Selection */}
          {step === 'location' && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <SimpleLocationPicker
                  initialLat={selectedLocation?.lat}
                  initialLng={selectedLocation?.lng}
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              {selectedLocation && (
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-md text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">選択した座標:</span>
                  <span className="text-muted-foreground">
                    {selectedLocation.lat.toFixed(6)},{' '}
                    {selectedLocation.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Loading */}
          {step === 'loading' && (
            <LoadingState variant="card" message="車中泊スポットを検索中..." />
          )}

          {/* Step 4: Confirm (bath facility option) */}
          {step === 'confirm' && selectedSpot && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-secondary/50">
                <Tent className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium">車中泊スポット</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSpot.name}
                  </p>
                </div>
              </div>

              <div className="p-3 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">入浴施設を追加</span>
                    {selectedSpot.distanceToBath !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        （約
                        {selectedSpot.distanceToBath < 1000
                          ? `${selectedSpot.distanceToBath}m`
                          : `${(selectedSpot.distanceToBath / 1000).toFixed(1)}km`}
                        ）
                      </span>
                    )}
                  </div>
                  <Switch checked={addBath} onCheckedChange={setAddBath} />
                </div>

                {addBath && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-muted-foreground">挿入位置</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          bathPosition === 'before' ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setBathPosition('before')}
                      >
                        車中泊の前
                      </Button>
                      <Button
                        type="button"
                        variant={
                          bathPosition === 'after' ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setBathPosition('after')}
                      >
                        車中泊の後
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Spots List */}
          {step === 'spots' && (
            <div className="space-y-4">
              {selectedLocation && (
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-md text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">検索地点:</span>
                  <span className="text-muted-foreground">
                    {selectedLocation.lat.toFixed(6)},{' '}
                    {selectedLocation.lng.toFixed(6)}
                  </span>
                </div>
              )}

              <NearbyShachuHakuSpotsList
                spots={nearbySpots}
                onSelect={handleSpotSelect}
                selectedSpotId={selectedSpot?._id}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'location' && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                キャンセル
              </Button>
              <Button
                onClick={handleSearchSpots}
                disabled={!selectedLocation}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                スポットを検索
              </Button>
            </>
          )}

          {step === 'spots' && (
            <>
              <Button variant="outline" onClick={handleBackToLocation}>
                地点を変更
              </Button>
              <Button
                onClick={handleAddActivity}
                disabled={!selectedSpot}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                アクティビティに追加
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('spots')}>
                戻る
              </Button>
              <Button
                onClick={handleConfirmAdd}
                disabled={addBath && bathPosition === null}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                追加する
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
