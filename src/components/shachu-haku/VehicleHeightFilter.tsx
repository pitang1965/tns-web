'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type VehicleHeightFilterProps = {
  vehicleHeight: number | null;
  includeUnknownHeight: boolean;
  onChange: (vehicleHeight: number | null, includeUnknownHeight: boolean) => void;
};

/**
 * 車高フィルタ。quickFilterチップ列に置くチップ＋設定ダイアログ。
 * - 未設定: 「🚐 車高を設定」
 * - 設定(不明含む): 「🚐 車高 200cm」
 * - 設定(不明除外): 「🚐 車高 200cm (不明なし)」
 * 車高は呼び出し側で clientFilters 経由 localStorage に保存される。
 */
export function VehicleHeightFilter({
  vehicleHeight,
  includeUnknownHeight,
  onChange,
}: VehicleHeightFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftCm, setDraftCm] = useState('');
  const [draftInclude, setDraftInclude] = useState(true);

  const isActive = vehicleHeight != null;
  const label = !isActive
    ? '🚐 車高を設定'
    : `🚐 車高 ${vehicleHeight}cm${includeUnknownHeight ? '' : ' (不明なし)'}`;

  const openDialog = () => {
    setDraftCm(vehicleHeight != null ? String(vehicleHeight) : '');
    setDraftInclude(includeUnknownHeight);
    setOpen(true);
  };

  const apply = () => {
    const trimmed = draftCm.trim();
    const num = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(num) || num <= 0) {
      // 空・不正 → フィルタ解除
      onChange(null, draftInclude);
    } else {
      onChange(Math.round(num), draftInclude);
    }
    setOpen(false);
  };

  const clear = () => {
    onChange(null, true);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={`shrink-0 h-7 px-3 text-xs rounded-full border cursor-pointer transition-colors ${
          isActive
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-background text-foreground border-input hover:bg-accent'
        }`}
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>車高で絞り込み</DialogTitle>
            <DialogDescription>
              入力した車高で入れないスポット（全高制限がそれ未満）を除外します。「高さ制限なし」は常に表示します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-height-cm">車高（cm）</Label>
              <Input
                id="vehicle-height-cm"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="例: 229（ハイエース スーパーロング）"
                value={draftCm}
                onChange={(e) => setDraftCm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    apply();
                  }
                }}
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={draftInclude}
                onCheckedChange={(c) => setDraftInclude(c === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground">
                高さ不明のスポットも表示する
              </span>
            </label>
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={clear}
              className="cursor-pointer"
            >
              クリア
            </Button>
            <Button type="button" onClick={apply} className="cursor-pointer">
              設定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
