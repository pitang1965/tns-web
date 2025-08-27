'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { importCampingSpotsFromCSV } from '../../app/actions/campingSpots';

interface CSVImportDialogProps {
  onClose: () => void;
  onSuccess: (result: { success: number; errors: any[] }) => void;
}

export default function CSVImportDialog({
  onClose,
  onSuccess,
}: CSVImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    errors: any[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast({
        title: 'エラー',
        description: 'CSVファイルを選択してください',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setImporting(true);

      const csvText = await file.text();
      const importResult = await importCampingSpotsFromCSV(csvText);

      setResult(importResult);

      if (importResult.success > 0) {
        onSuccess(importResult);
      } else {
        toast({
          title: 'エラー',
          description: 'インポートできるデータがありませんでした',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'エラー',
        description: 'インポート処理でエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'スポット名',
      '緯度',
      '経度',
      '都道府県',
      '住所',
      'URL',
      'タイプ',
      'トイレまでの距離(m)',
      'お風呂までの距離(m)',
      'コンビニまでの距離(m)',
      'トイレ緯度',
      'トイレ経度',
      'コンビニ緯度',
      'コンビニ経度',
      'お風呂緯度',
      'お風呂経度',
      '標高(m)',
      '静寂レベル(1-5)',
      '治安レベル(1-5)',
      '総合評価(1-5)',
      '屋根あり(true/false)',
      '電源あり(true/false)',
      'ゲート付き(true/false)',
      '無料(true/false)',
      '1泊料金',
      '料金備考',
      '収容台数',
      '制限事項',
      '設備',
      '備考',
    ];

    const sampleData = [
      '道の駅サンプル',        // スポット名
      '35.6762',              // 緯度
      '139.6503',             // 経度
      '東京都',               // 都道府県
      '東京都千代田区',       // 住所
      '',                     // URL - 任意
      'roadside_station',     // タイプ
      '',                     // トイレまでの距離(m) - 任意
      '',                     // お風呂までの距離(m) - 任意
      '',                     // コンビニまでの距離(m) - 任意
      '',                     // トイレ緯度 - 任意
      '',                     // トイレ経度 - 任意
      '',                     // コンビニ緯度 - 任意
      '',                     // コンビニ経度 - 任意
      '',                     // お風呂緯度 - 任意
      '',                     // お風呂経度 - 任意
      '',                     // 標高(m) - 任意
      '',                     // 静寂レベル(1-5) - 任意
      '',                     // 治安レベル(1-5) - 任意
      '',                     // 総合評価(1-5) - 任意
      'true',                 // 屋根あり(true/false)
      'false',                // 電源あり(true/false)
      'false',                // ゲート付き(true/false)
      'true',                 // 無料(true/false)
      '',                     // 1泊料金
      '',                     // 料金備考
      '',                     // 収容台数 - 任意
      '大型車不可',           // 制限事項
      'トイレ,自販機',        // 設備
      '',                     // 備考 - 任意
    ];

    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'camping-spots-template.csv';
    link.click();
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-4xl max-h-[90vh] overflow-auto'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Upload className='w-5 h-5' />
            CSVインポート
          </CardTitle>
          <Button variant='outline' size='sm' onClick={onClose}>
            <X className='w-4 h-4' />
          </Button>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Instructions */}
          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4'>
            <h3 className='font-semibold text-blue-800 dark:text-blue-200 mb-2'>
              CSVフォーマット
            </h3>
            <div className='text-sm text-blue-700 dark:text-blue-300 space-y-1'>
              <p>• ヘッダー行は必須です</p>
              <p>
                • 座標は小数点形式で入力してください（例: 35.6762, 139.6503）
              </p>
              <p>• 評価レベルは1-5の整数で入力してください</p>
              <p>• 真偽値は true/false で入力してください</p>
              <p>• 制限事項・設備は カンマ区切り で複数入力可能です</p>
              <p>
                • 重複チェック: 100m以内の既存スポットは重複として扱われます
              </p>
            </div>
            <div className='mt-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={downloadTemplate}
                className='text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              >
                <Download className='w-4 h-4 mr-2' />
                テンプレートをダウンロード
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className='space-y-4'>
            <div className='border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center'>
              <input
                ref={fileInputRef}
                type='file'
                accept='.csv'
                onChange={handleFileSelect}
                className='hidden'
              />
              <FileText className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4' />
              <p className='text-gray-600 dark:text-gray-300 mb-4'>
                CSVファイルを選択してください
              </p>
              <Button
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                ファイルを選択
              </Button>
            </div>

            {file && (
              <div className='flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <FileText className='w-5 h-5 text-green-600' />
                  <div>
                    <p className='font-medium text-green-800'>{file.name}</p>
                    <p className='text-sm text-green-600'>
                      サイズ: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className='bg-green-600 hover:bg-green-700'
                >
                  {importing ? 'インポート中...' : 'インポート開始'}
                </Button>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card className='bg-green-50 border-green-200'>
                  <CardContent className='p-4 flex items-center gap-3'>
                    <CheckCircle className='w-8 h-8 text-green-600' />
                    <div>
                      <div className='text-2xl font-bold text-green-800'>
                        {result.success}
                      </div>
                      <div className='text-sm text-green-600'>成功</div>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={
                    result.errors.length > 0
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }
                >
                  <CardContent className='p-4 flex items-center gap-3'>
                    <AlertTriangle
                      className={`w-8 h-8 ${
                        result.errors.length > 0
                          ? 'text-red-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <div
                        className={`text-2xl font-bold ${
                          result.errors.length > 0
                            ? 'text-red-800'
                            : 'text-gray-600'
                        }`}
                      >
                        {result.errors.length}
                      </div>
                      <div
                        className={`text-sm ${
                          result.errors.length > 0
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}
                      >
                        エラー
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {result.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-red-600'>エラー詳細</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className='h-64'>
                      <div className='space-y-3'>
                        {result.errors.map((error, index) => (
                          <div
                            key={index}
                            className='border border-red-200 rounded-lg p-3 bg-red-50'
                          >
                            <div className='flex items-start gap-2'>
                              <Badge variant='destructive' className='text-xs'>
                                行 {error.row}
                              </Badge>
                              <div className='flex-1'>
                                <p className='text-sm text-red-800 font-medium'>
                                  {error.error}
                                </p>
                                <p className='text-xs text-red-600 mt-1'>
                                  データ:{' '}
                                  {typeof error.data === 'string'
                                    ? error.data
                                    : JSON.stringify(error.data)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                >
                  新しいファイルを選択
                </Button>
                <Button onClick={onClose}>閉じる</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
