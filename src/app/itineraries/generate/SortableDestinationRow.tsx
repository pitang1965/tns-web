'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceNameAutocomplete } from '@/components/itinerary/forms/PlaceNameAutocomplete';
import type { NamedPlace } from '@/lib/itineraryDraft/types';

export type PlaceField = {
  id: string;
  text: string;
  place: NamedPlace | null;
};

// 目的地行の安定キー生成。dnd-kitの並び替えには要素ごとに不変のidが要る。
let destinationIdSeq = 0;
export const newPlaceField = (): PlaceField => ({
  id: `dest-${destinationIdSeq++}`,
  text: '',
  place: null,
});

// 候補選択の確認表示。選択済みなら住所つきで確定を示し、入力中で未選択なら選択を促す。
export function PlaceSelectionHint({ field }: { field: PlaceField }) {
  if (field.place) {
    return (
      <p className="mt-1 text-xs text-green-600 dark:text-green-400">
        ✓ {field.place.name}
        {field.place.address ? `（${field.place.address}）` : ''}
      </p>
    );
  }
  if (field.text.trim()) {
    return (
      <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
        候補から場所を選択してください（座標を確定するため）
      </p>
    );
  }
  return null;
}

// PlaceNameAutocompleteが渡す選択結果の形（同コンポーネント内のSelectedPlaceと一致）。
type SelectedPlace = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type SortableDestinationRowProps = {
  field: PlaceField;
  index: number;
  showControls: boolean;
  onChangeText: (value: string) => void;
  onSelectPlace: (place: SelectedPlace) => void;
  onRemove: () => void;
};

// 目的地1件分の入力行。左のハンドルでドラッグ並び替え、右で削除。
// 入力欄はドラッグ対象にせず、ハンドルにのみlistenersを付けてタイプ操作と競合させない。
export function SortableDestinationRow({
  field,
  index,
  showControls,
  onChangeText,
  onSelectPlace,
  onRemove,
}: SortableDestinationRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 ${isDragging ? 'opacity-40' : ''}`}
    >
      {showControls && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-2 shrink-0 cursor-grab active:cursor-grabbing rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors touch-none"
          title="ドラッグして並び替え"
          aria-label={`目的地${index + 1}を並び替え`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="flex-1">
        <PlaceNameAutocomplete
          value={field.text}
          onChange={onChangeText}
          onPlaceSelect={onSelectPlace}
        />
        <PlaceSelectionHint field={field} />
      </div>
      {showControls && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRemove}
          aria-label="この目的地を削除"
          title="この目的地を削除"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
