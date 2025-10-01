'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Send, Info, MapPin } from 'lucide-react';
import {
  CampingSpotTypeLabels,
  PrefectureOptions,
  CampingSpotType,
} from '@/data/schemas/campingSpot';
import dynamic from 'next/dynamic';
import { CoordinatesFromClipboardButton } from '@/components/itinerary/CoordinatesFromClipboardButton';

// Dynamically import map component to avoid SSR issues
const SimpleLocationPicker = dynamic(
  () => import('@/components/common/SimpleLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">地図を読み込み中...</div>
      </div>
    ),
  }
);

// Form validation schema
const SubmissionFormSchema = z.object({
  name: z.string().min(1, '名称を入力してください').trim(),
  lat: z.string().refine((val) => !isNaN(Number(val)), {
    message: '有効な緯度を入力してください',
  }),
  lng: z.string().refine((val) => !isNaN(Number(val)), {
    message: '有効な経度を入力してください',
  }),
  prefecture: z.string().min(1, '都道府県を選択してください'),
  address: z.string().optional(),
  url: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  type: z.string().min(1, 'スポットタイプを選択してください'),
  hasRoof: z.boolean().default(false),
  hasPowerOutlet: z.boolean().default(false),
  isFree: z.boolean().default(true),
  pricePerNight: z.string().optional(),
  priceNote: z.string().optional(),
  notes: z.string().optional(),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  agreement: z.boolean().refine((val) => val === true, {
    message: '利用規約に同意してください',
  }),
});

type SubmissionFormData = z.infer<typeof SubmissionFormSchema>;

interface CampingSpotSubmissionFormProps {
  onSuccess?: () => void;
}

export default function CampingSpotSubmissionForm({
  onSuccess,
}: CampingSpotSubmissionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(SubmissionFormSchema),
    defaultValues: {
      name: '',
      lat: '',
      lng: '',
      prefecture: '',
      address: '',
      url: '',
      type: '',
      hasRoof: false,
      hasPowerOutlet: false,
      isFree: true,
      pricePerNight: '',
      priceNote: '',
      notes: '',
      submitterName: '',
      submitterEmail: '',
      agreement: false,
    },
  });

  const isFree = form.watch('isFree');

  const onSubmit = async (data: SubmissionFormData) => {
    try {
      setLoading(true);

      // Convert form data to submission format
      const submissionData = {
        name: data.name,
        coordinates: [Number(data.lng), Number(data.lat)],
        prefecture: data.prefecture,
        address: data.address || undefined,
        url: data.url || undefined,
        type: data.type as CampingSpotType,
        hasRoof: data.hasRoof,
        hasPowerOutlet: data.hasPowerOutlet,
        isFree: data.isFree,
        pricePerNight: data.pricePerNight ? Number(data.pricePerNight) : undefined,
        priceNote: data.priceNote || undefined,
        notes: data.notes || undefined,
        submitterName: data.submitterName || undefined,
        submitterEmail: data.submitterEmail || undefined,
      };

      const response = await fetch('/api/camping-spots/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('投稿に失敗しました');
      }

      toast({
        title: '投稿完了',
        description: '車中泊スポット情報を投稿しました。管理者の確認後に公開されます。',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'エラー',
        description: '投稿に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    form.setValue('lat', lat.toString());
    form.setValue('lng', lng.toString());
    setShowMap(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">注意</p>
              <ul className="space-y-1 text-blue-700">
                <li>• 投稿された情報は管理者が確認後に公開されます</li>
                <li>• 正確な情報の提供にご協力ください</li>
                <li>• 個人の敷地や車中泊禁止場所は投稿しないでください</li>
              </ul>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">基本情報</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 道の駅○○" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prefecture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>都道府県 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="都道府県を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PrefectureOptions.map((prefecture) => (
                            <SelectItem key={prefecture} value={prefecture}>
                              {prefecture}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>種別 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="車中泊場所の種別を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CampingSpotTypeLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>住所</FormLabel>
                    <FormControl>
                      <Input placeholder="例: 〇〇県〇〇市〇〇町1-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>参考URL（任意）</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="例: https://www.example.com"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      公式サイトや詳細情報のURLがあれば入力してください
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 位置情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">位置情報</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>緯度 *</FormLabel>
                      <FormControl>
                        <Input placeholder="35.123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>経度 *</FormLabel>
                      <FormControl>
                        <Input placeholder="139.123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMap(!showMap)}
                    className="w-full"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {showMap ? '地図を閉じる' : '地図で位置を選択'}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    地図上でクリックして位置を選択できます
                  </p>
                </div>

                <div className="space-y-1">
                  <CoordinatesFromClipboardButton
                    onCoordinatesExtracted={(latitude, longitude) => {
                      form.setValue('lat', latitude);
                      form.setValue('lng', longitude);
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Google Maps の URL や「35.123456, 139.123456」形式の座標をコピーしてから押してください
                  </p>
                </div>
              </div>

              {showMap && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                  <SimpleLocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialLat={form.watch('lat') ? Number(form.watch('lat')) : 35.6762}
                    initialLng={form.watch('lng') ? Number(form.watch('lng')) : 139.6503}
                  />
                </div>
              )}
            </div>

            {/* 施設情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">施設情報</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hasRoof"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>屋根あり</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasPowerOutlet"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>電源あり</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 料金情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">料金情報</h3>

              <FormField
                control={form.control}
                name="isFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>無料</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {!isFree && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pricePerNight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>1泊料金（円）</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>料金備考</FormLabel>
                        <FormControl>
                          <Input placeholder="例: 軽自動車のみ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* 備考 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備考・コメント</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="利用時の注意点、おすすめポイントなど"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 投稿者情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">投稿者情報（任意）</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="submitterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>お名前</FormLabel>
                      <FormControl>
                        <Input placeholder="匿名希望" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="submitterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 利用規約 */}
            <FormField
              control={form.control}
              name="agreement"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      投稿内容が正確であることを確認し、利用規約に同意します *
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {loading ? '投稿中...' : '投稿する'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}