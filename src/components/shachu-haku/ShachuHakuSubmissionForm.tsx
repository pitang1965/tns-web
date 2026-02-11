'use client';

import { useState, useDeferredValue } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/common/LoadingState';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAutoSetSpotType } from '@/hooks/useAutoSetSpotType';
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupText,
} from '@/components/ui/input-group';
import { Send, Info, MapPin, Map, Link, ExternalLink, X } from 'lucide-react';
import {
  CampingSpotTypeLabels,
  PrefectureOptions,
  CampingSpotType,
} from '@/data/schemas/campingSpot';
import dynamic from 'next/dynamic';
import { CoordinatesFromClipboardButton } from '@/components/itinerary/CoordinatesFromClipboardButton';
import { celebrateSubmission } from '@/lib/confetti';

// Dynamically import map component to avoid SSR issues
const SimpleLocationPicker = dynamic(
  () => import('@/components/common/SimpleLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <LoadingState variant='card' message='地図を読み込み中...' />
    ),
  }
);

// Form validation schema
const SubmissionFormSchema = z.object({
  name: z.string().min(1, '名称を入力してください').trim(),
  lat: z
    .string()
    .refine((val) => val === '' || !isNaN(Number(val)), {
      message: '有効な緯度を入力してください',
    })
    .optional()
    .or(z.literal('')),
  lng: z
    .string()
    .refine((val) => val === '' || !isNaN(Number(val)), {
      message: '有効な経度を入力してください',
    })
    .optional()
    .or(z.literal('')),
  prefecture: z.string().min(1, '都道府県を選択してください'),
  url: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  type: z.string().min(1, 'スポットタイプを選択してください'),
  hasRoof: z.boolean().default(false),
  hasPowerOutlet: z.boolean().default(false),
  pricePerNight: z.string().optional(),
  priceNote: z.string().optional(),
  notes: z.string().optional(),
  submitterName: z.string().optional(),
  submitterEmail: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .optional()
    .or(z.literal('')),
  agreement: z.boolean().refine((val) => val === true, {
    message: '利用規約に同意してください',
  }),
});

type SubmissionFormData = z.infer<typeof SubmissionFormSchema>;

type ShachuHakuSubmissionFormProps = {
  onSuccess?: () => void;
};

export default function ShachuHakuSubmissionForm({
  onSuccess,
}: ShachuHakuSubmissionFormProps) {
  const router = useRouter();
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
      url: '',
      type: '',
      hasRoof: false,
      hasPowerOutlet: false,
      pricePerNight: '',
      priceNote: '',
      notes: '',
      submitterName: '',
      submitterEmail: '',
      agreement: false,
    },
  });

  // 名称から種別を自動設定する機能
  // INP問題を回避するため、名称の値を遅延させる
  const nameValue = form.watch('name');
  const deferredNameValue = useDeferredValue(nameValue);

  useAutoSetSpotType(
    deferredNameValue,
    form.watch('type'),
    form.setValue,
    toast
  );

  const onSubmit = async (data: SubmissionFormData) => {
    try {
      setLoading(true);

      // Convert form data to submission format
      const pricePerNight = data.pricePerNight
        ? Number(data.pricePerNight)
        : undefined;
      const submissionData = {
        name: data.name,
        coordinates:
          data.lng && data.lat
            ? [Number(data.lng), Number(data.lat)]
            : undefined,
        prefecture: data.prefecture,
        url: data.url || undefined,
        type: data.type as CampingSpotType,
        hasRoof: data.hasRoof,
        hasPowerOutlet: data.hasPowerOutlet,
        isFree: !pricePerNight || pricePerNight === 0,
        pricePerNight,
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
        const errorData = await response.json();
        const errorMessage = errorData.error || '投稿に失敗しました';
        const errorDetails = errorData.details;

        toast({
          title: 'エラー',
          description: errorDetails
            ? `${errorMessage}\n${errorDetails}`
            : errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // 投稿成功！くす玉のような紙吹雪でお祝い
      celebrateSubmission();

      toast({
        title: '🎉 投稿ありがとうございます！',
        description:
          '車中泊スポット情報を投稿いただきました。管理者の確認後に公開されます。コミュニティへのご貢献に感謝します！',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'エラー',
        description:
          error instanceof Error
            ? error.message
            : '投稿に失敗しました。もう一度お試しください。',
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

  const handleShowOnMap = () => {
    const lat = form.watch('lat');
    const lng = form.watch('lng');
    if (lat && lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  const handleCancel = () => {
    // フォームに入力内容があるかチェック（同意チェックは除外）
    const values = form.getValues();
    const hasInput =
      values.name ||
      values.lat ||
      values.lng ||
      values.prefecture ||
      values.url ||
      values.type ||
      values.hasRoof ||
      values.hasPowerOutlet ||
      values.pricePerNight ||
      values.priceNote ||
      values.notes ||
      values.submitterName ||
      values.submitterEmail;

    if (hasInput) {
      if (window.confirm('入力内容が失われますが、よろしいですか？')) {
        router.push('/shachu-haku');
      }
    } else {
      router.push('/shachu-haku');
    }
  };

  return (
    <Card className='w-full max-w-4xl mx-auto'>
      <CardHeader>
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-start gap-2'>
            <Info className='w-5 h-5 text-blue-600 mt-0.5 shrink-0' />
            <div className='text-sm text-blue-800'>
              <p className='font-medium mb-1'>注意</p>
              <ul className='space-y-1 text-blue-700'>
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              // Enterキーでの送信を無効化（textareaでの改行は許可）
              if (
                e.key === 'Enter' &&
                (e.target as HTMLElement).tagName !== 'TEXTAREA'
              ) {
                e.preventDefault();
              }
            }}
            className='space-y-6'
          >
            {/* 基本情報 */}
            <div className='space-y-4'>
              <h2 className='text-lg font-semibold'>基本情報</h2>

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      名称
                    </FormLabel>
                    <FormControl>
                      <Input placeholder='例: 道の駅○○' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        種別
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='cursor-pointer'>
                            <SelectValue placeholder='車中泊場所の種別を選択' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CampingSpotTypeLabels).map(
                            ([key, label]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className='cursor-pointer'
                              >
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='prefecture'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        都道府県
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='cursor-pointer'>
                            <SelectValue placeholder='都道府県を選択' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PrefectureOptions.map((prefecture) => (
                            <SelectItem
                              key={prefecture}
                              value={prefecture}
                              className='cursor-pointer'
                            >
                              {prefecture}
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
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>参考URL</FormLabel>
                    <FormControl>
                      <InputGroup className='has-[[data-slot=input-group-control]:focus-visible]:ring-0'>
                        <InputGroupAddon className='border-r-0'>
                          <Link className='h-4 w-4' />
                        </InputGroupAddon>
                        <InputGroupInput
                          type='url'
                          className='border-l-0 border-r-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
                          placeholder='例: https://www.example.com'
                          {...field}
                        />
                        <InputGroupAddon
                          align='inline-end'
                          className='border-l-0 pr-2'
                        >
                          <InputGroupButton
                            type='button'
                            variant='ghost'
                            size='icon-sm'
                            disabled={!field.value}
                            onClick={() =>
                              field.value &&
                              window.open(
                                field.value,
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
                            title='新しいタブで開く'
                            className='h-8 w-8'
                          >
                            <ExternalLink className='h-4 w-4' />
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      公式サイトや詳細情報のURLがあれば入力してください
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 位置情報 */}
            <div className='space-y-4'>
              <h2 className='text-lg font-semibold'>位置情報</h2>

              <div className='space-y-2'>
                <FormLabel>座標</FormLabel>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='lat'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputGroup className='has-[[data-slot=input-group-control]:focus-visible]:ring-0'>
                            <InputGroupAddon className='border-r-0'>
                              <InputGroupText className='text-xs'>
                                緯度
                              </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              type='number'
                              step='any'
                              placeholder='35.6762'
                              className='text-right border-l-0 border-r-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
                              onWheel={(e) => e.currentTarget.blur()}
                              {...field}
                            />
                            <InputGroupAddon
                              align='inline-end'
                              className='border-l-0'
                            >
                              <InputGroupText>°</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='lng'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputGroup className='has-[[data-slot=input-group-control]:focus-visible]:ring-0'>
                            <InputGroupAddon className='border-r-0'>
                              <InputGroupText className='text-xs'>
                                経度
                              </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              type='number'
                              step='any'
                              placeholder='139.6503'
                              className='text-right border-l-0 border-r-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0'
                              onWheel={(e) => e.currentTarget.blur()}
                              {...field}
                            />
                            <InputGroupAddon
                              align='inline-end'
                              className='border-l-0'
                            >
                              <InputGroupText>°</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className='space-y-4'>
                <div className='space-y-1'>
                  <ButtonGroup className='w-full flex-col sm:flex-row'>
                    <CoordinatesFromClipboardButton
                      onCoordinatesExtracted={(latitude, longitude) => {
                        form.setValue('lat', latitude.toString());
                        form.setValue('lng', longitude.toString());
                      }}
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setShowMap(!showMap)}
                      className='flex-1 cursor-pointer'
                    >
                      <MapPin className='w-4 h-4' />
                      {showMap ? '選択完了' : '地図で選択'}
                    </Button>
                  </ButtonGroup>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Google Maps の URL
                    や座標をコピーしてから「クリップボードから取得」、または地図上でクリックして位置を選択できます
                  </p>
                </div>

                {showMap && (
                  <div className='border-2 border-red-500 rounded-lg overflow-hidden bg-white dark:bg-gray-800'>
                    {/* 注意バナー */}
                    <div className='bg-yellow-100/90 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 px-4 py-2 text-sm font-medium text-center'>
                      📍 地図をクリックして座標を選択してください
                    </div>
                    <SimpleLocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialLat={
                        form.watch('lat') ? Number(form.watch('lat')) : 35.6762
                      }
                      initialLng={
                        form.watch('lng') ? Number(form.watch('lng')) : 139.6503
                      }
                    />
                  </div>
                )}

                <div className='space-y-1'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleShowOnMap}
                    disabled={!form.watch('lat') || !form.watch('lng')}
                    className='w-full cursor-pointer'
                  >
                    <Map className='w-4 h-4' />
                    地図で表示
                  </Button>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    入力した座標をGoogle Mapsで確認できます
                  </p>
                </div>
              </div>
            </div>

            {/* 施設情報 */}
            <div className='space-y-4'>
              <h2 className='text-lg font-semibold'>施設情報</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='hasRoof'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>屋根あり</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='hasPowerOutlet'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>電源あり</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 料金情報 */}
            <div className='space-y-4'>
              <h2 className='text-lg font-semibold'>料金情報</h2>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                無料の場合は空欄のままにしてください
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='pricePerNight'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1泊料金（円）</FormLabel>
                      <FormControl>
                        <Input type='number' placeholder='1000' onWheel={(e) => e.currentTarget.blur()} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='priceNote'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>料金備考</FormLabel>
                      <FormControl>
                        <Input placeholder='例: 軽自動車のみ' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 備考 */}
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備考・コメント</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='利用時の注意点、おすすめポイントなど'
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 投稿者情報 */}
            <div className='space-y-4'>
              <h2 className='text-lg font-semibold'>投稿者情報（任意）</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='submitterName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>お名前</FormLabel>
                      <FormControl>
                        <Input placeholder='匿名希望' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='submitterEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='example@email.com'
                          {...field}
                        />
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
              name='agreement'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      投稿内容が正確であることを確認し、利用規約に同意します
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex flex-col sm:flex-row gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={handleCancel}
                disabled={loading}
                className='order-2 sm:order-1 cursor-pointer'
              >
                <X className='w-4 h-4 mr-2' />
                キャンセル
              </Button>
              <Button
                type='submit'
                disabled={loading}
                className='order-1 sm:order-2 flex-1 cursor-pointer'
              >
                <Send className='w-4 h-4 mr-2' />
                {loading ? '投稿中...' : '投稿する'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
