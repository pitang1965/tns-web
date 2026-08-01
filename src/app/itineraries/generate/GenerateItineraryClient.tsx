'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDraftAccess } from '@/hooks/useDraftAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { PlaceNameAutocomplete } from '@/components/itinerary/forms/PlaceNameAutocomplete';
import { DayPlanView } from '@/components/itinerary/DayPlanView';
import { X, Plus, Sparkles } from 'lucide-react';
import { createItineraryAction } from '@/actions/createItinerary';
import { clearItineraryCache } from '@/lib/cacheUtils';
import {
  generateItineraryDraftAction,
  type GenerateDraftResult,
} from '@/app/actions/generateItineraryDraft';
import type { NamedPlace, DepartureTimeOfDay } from '@/lib/itineraryDraft/types';
import type { PersonaType } from '@/data/schemas/diagnosisSchema';

const PERSONA_OPTIONS: { value: PersonaType; label: string }[] = [
  { value: 'onsen', label: '温泉満喫派' },
  { value: 'machiyoru', label: '街なか晩酌派' },
  { value: 'outdoor', label: 'アウトドア派' },
  { value: 'easy', label: 'お手軽派' },
  { value: 'comfort', label: '快適装備派' },
  { value: 'pet', label: 'ペット優先派' },
  { value: 'cospa', label: 'コスパ重視派' },
  { value: 'quiet', label: '静寂派' },
];

const DISTANCE_OPTIONS = [100, 150, 200, 250, 300, 400];

const NIGHTS_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1);

const DEPARTURE_OPTIONS: { value: DepartureTimeOfDay; label: string }[] = [
  { value: 'morning', label: '朝発' },
  { value: 'afternoon', label: '午後発' },
  { value: 'evening', label: '夕方発' },
];

type PlaceField = { text: string; place: NamedPlace | null };

// 候補選択の確認表示。選択済みなら住所つきで確定を示し、入力中で未選択なら選択を促す。
function PlaceSelectionHint({ field }: { field: PlaceField }) {
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

export function GenerateItineraryClient() {
  const { user, isLoading } = useUser();
  const {
    unlimited,
    balance,
    reason: accessReason,
    isLoading: accessLoading,
    setBalance,
  } = useDraftAccess();
  const router = useRouter();
  // 無制限枠、または一度でも付与された人（残高ドキュメントあり）はフォームを表示する。
  const hasProgram = unlimited || balance !== null;
  // 今この瞬間に生成できるか（無制限枠 or 残高≥1）。
  const canGenerate = unlimited || (balance !== null && balance >= 1);

  const [start, setStart] = useState<PlaceField>({ text: '', place: null });
  const [destinations, setDestinations] = useState<PlaceField[]>([
    { text: '', place: null },
  ]);
  const [nights, setNights] = useState(2);
  const [distanceKm, setDistanceKm] = useState(200);
  const [persona, setPersona] = useState<PersonaType>('onsen');
  const [carHeightOver, setCarHeightOver] = useState(false);
  const [carLengthOver, setCarLengthOver] = useState(false);
  const [roundTrip, setRoundTrip] = useState(true);
  const [useExpressways, setUseExpressways] = useState(true);
  const [departureTimeOfDay, setDepartureTimeOfDay] =
    useState<DepartureTimeOfDay>('afternoon');
  const [startDate, setStartDate] = useState('');
  const [title, setTitle] = useState('');

  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<GenerateDraftResult | null>(null);

  // 生成中の経過秒（残り予測はできないので経過のみ表示。動いている安心感のため）
  useEffect(() => {
    if (!running) {
      setElapsedSec(0);
      return;
    }
    const started = Date.now();
    setElapsedSec(0);
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const updateDestination = (index: number, patch: Partial<PlaceField>) => {
    setDestinations((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  };

  const handleGenerate = async () => {
    if (!start.place) {
      toast({
        title: '出発地を選択してください',
        description: '候補リストから場所を選ぶと座標が確定します',
        variant: 'destructive',
      });
      return;
    }
    const selectedDestinations = destinations
      .map((d) => d.place)
      .filter((p): p is NamedPlace => p !== null);
    if (selectedDestinations.length < 1) {
      toast({
        title: '目的地を1つ以上選択してください',
        description: '候補リストから場所を選んでください',
        variant: 'destructive',
      });
      return;
    }

    setRunning(true);
    setResult(null);
    try {
      const res = await generateItineraryDraftAction({
        startLocation: start.place,
        destinations: selectedDestinations,
        numberOfNights: nights,
        dailyDistanceKm: distanceKm,
        roundTrip,
        persona,
        departureTimeOfDay,
        useExpressways,
        carHeightOver21m: carHeightOver || undefined,
        carLengthOver5m: carLengthOver || undefined,
        startDate: startDate || undefined,
        title: title.trim() || undefined,
      });
      setResult(res);
      if (res.success) {
        // 生成成功時の最新残高を即時反映（無制限枠は null）。
        setBalance(res.remaining);
      } else {
        toast({
          title: res.error,
          description: res.suggestion,
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: '生成に失敗しました',
        description: e instanceof Error ? e.message : '不明なエラー',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!result || !result.success) return;
    setSaving(true);
    try {
      const res = await createItineraryAction(result.draft);
      if (res.success) {
        await clearItineraryCache();
        router.push(`/itineraries/${res.id}/edit`);
      } else {
        toast({
          title: '保存に失敗しました',
          description: res.error,
          variant: 'destructive',
        });
        setSaving(false);
      }
    } catch (e) {
      toast({
        title: '保存に失敗しました',
        description: e instanceof Error ? e.message : '不明なエラー',
        variant: 'destructive',
      });
      setSaving(false);
    }
  };

  if (isLoading || accessLoading) {
    return (
      <main className="container mx-auto p-4">
        <LoadingSpinner />
      </main>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-2">
        <p className="text-gray-600 dark:text-gray-300">ログインが必要です。</p>
        <a className="text-blue-600 underline" href="/auth/login">
          ログイン
        </a>
      </div>
    );
  }

  if (!hasProgram) {
    // メール認証を促すケースだけ行動可能な案内を出し、それ以外（メール未提供の
    // ソーシャルログイン・未付与）は内部理由を見せず前向きな「先行提供中」に統一する。
    const isVerifyPrompt =
      accessReason === 'メールアドレスの認証を完了してください';
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <h1 className="text-2xl font-bold text-amber-600">準備中</h1>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-md">
          {isVerifyPrompt
            ? 'メールアドレスの認証を完了すると、ご利用いただけるようになります。'
            : 'AIによる旅程ドラフトの生成は、現在一部の方への先行提供中です。順次ご利用いただけるようにしていく予定です。'}
        </p>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          AIで旅程の下書きを作る
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          出発地・目的地・泊数・好みから、実在の車中泊スポットを軸にした旅程ドラフトを生成します。
        </p>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-1 text-sm font-medium">
            {unlimited ? (
              '無制限'
            ) : (
              <>残り {balance ?? 0} アズキ</>
            )}
          </span>
          {!unlimited && (
            <span className="ml-2 text-xs text-muted-foreground">
              1回の生成で1アズキを使います
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>条件を入力</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">出発地（往復の帰着地）*</label>
            <PlaceNameAutocomplete
              value={start.text}
              onChange={(v) => setStart({ text: v, place: null })}
              onPlaceSelect={(p) =>
                setStart({
                  text: p.name,
                  place: {
                    name: p.name,
                    address: p.address,
                    location: { lat: p.latitude, lng: p.longitude },
                  },
                })
              }
            />
            <PlaceSelectionHint field={start} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">目的地・経由地（順番に）*</label>
            {destinations.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <PlaceNameAutocomplete
                    value={d.text}
                    onChange={(v) =>
                      updateDestination(i, { text: v, place: null })
                    }
                    onPlaceSelect={(p) =>
                      updateDestination(i, {
                        text: p.name,
                        place: {
                          name: p.name,
                          address: p.address,
                          location: { lat: p.latitude, lng: p.longitude },
                        },
                      })
                    }
                  />
                  <PlaceSelectionHint field={d} />
                </div>
                {destinations.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setDestinations((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    aria-label="目的地を削除"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setDestinations((prev) => [...prev, { text: '', place: null }])
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              目的地を追加
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={roundTrip}
                onCheckedChange={(c) => setRoundTrip(c === true)}
              />
              往復（出発地に戻る）
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={useExpressways}
                onCheckedChange={(c) => setUseExpressways(c === true)}
              />
              高速道路を使う
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">泊数*</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={nights}
                onChange={(e) => setNights(Number(e.target.value))}
              >
                {NIGHTS_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}泊
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">初日の出発</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={departureTimeOfDay}
                onChange={(e) =>
                  setDepartureTimeOfDay(e.target.value as DepartureTimeOfDay)
                }
              >
                {DEPARTURE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">開始日（任意）</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            初日の出発は渋滞を避ける時間帯の目安です。生成後に各日の時刻はずらせます。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">1日の走行距離の目安</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
              >
                {DISTANCE_OPTIONS.map((km) => (
                  <option key={km} value={km}>
                    約{km}km
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">車中泊の好み</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={persona}
                onChange={(e) => setPersona(e.target.value as PersonaType)}
              >
                {PERSONA_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={carHeightOver}
                onCheckedChange={(c) => setCarHeightOver(c === true)}
              />
              車高2.1m超
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={carLengthOver}
                onCheckedChange={(c) => setCarLengthOver(c === true)}
              />
              全長5m超
            </label>
          </div>

          <div>
            <label className="text-sm font-medium">タイトル（任意）</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="未入力ならAIが命名します"
            />
          </div>

          {!canGenerate && (
            <p className="text-sm text-red-600 dark:text-red-400">
              アズキが不足しています。付与を受けると生成できます。
            </p>
          )}
          <Button
            onClick={handleGenerate}
            disabled={running || !canGenerate}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {running
              ? `生成中… ${elapsedSec}秒（通常10〜30秒ほど）`
              : 'この条件で生成する'}
          </Button>
        </CardContent>
      </Card>

      {running && <LoadingSpinner />}

      {result && !result.success && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">生成できませんでした</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{result.error}</p>
            {result.suggestion && (
              <p className="text-muted-foreground">{result.suggestion}</p>
            )}
          </CardContent>
        </Card>
      )}

      {result && result.success && (
        <Card>
          <CardHeader>
            <CardTitle>{result.draft.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.draft.description && (
              <p className="text-sm text-muted-foreground">
                {result.draft.description}
              </p>
            )}

            {result.notes.length > 0 && (
              <div className="rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
                <ul className="list-disc pl-5">
                  {result.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.draft.dayPlans.map((dp, i) => (
              <DayPlanView key={i} day={dp} dayIndex={i} isOwner={true} />
            ))}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '保存中…' : 'この内容で保存して編集へ'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={running || saving || !canGenerate}
              >
                再生成
              </Button>
              <Button
                variant="ghost"
                onClick={() => setResult(null)}
                disabled={saving}
              >
                破棄
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
