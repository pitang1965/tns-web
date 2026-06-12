'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  getItinerariesForExport,
  ItineraryCSVImportResult,
} from '@/app/actions/itineraryCSV';
import { downloadItinerariesCSV } from '@/lib/csv/itineraries';

const ItineraryCSVImportDialog = dynamic(
  () => import('@/components/admin/ItineraryCSVImportDialog'),
  {
    ssr: false,
  },
);

export function AdminItineraryCSVControls() {
  const router = useRouter();
  const { toast } = useToast();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const itineraries = await getItinerariesForExport();
      downloadItinerariesCSV(itineraries);

      toast({
        title: 'エクスポート完了',
        description: `${itineraries.length}件の旅程をエクスポートしました`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'エラー',
        description: 'エクスポート処理でエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportSuccess = (result: ItineraryCSVImportResult) => {
    toast({
      title: 'インポート完了',
      description: `新規追加${result.success}件、更新${result.updated}件の旅程をインポートしました`,
    });
    if (result.errors.length > 0) {
      toast({
        title: '警告',
        description: `${result.errors.length}件のエラーがありました`,
        variant: 'destructive',
      });
    }
    // Reload the server-fetched itinerary list
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={handleExportCSV}
        variant="outline"
        size="sm"
        disabled={exporting}
        className="cursor-pointer"
      >
        <Download className="w-4 h-4 mr-1" />
        {exporting ? 'エクスポート中...' : 'CSVエクスポート'}
      </Button>
      <Button
        onClick={() => setShowImportDialog(true)}
        variant="outline"
        size="sm"
        className="cursor-pointer"
      >
        <Upload className="w-4 h-4 mr-1" />
        CSVインポート
      </Button>

      {showImportDialog && (
        <ItineraryCSVImportDialog
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}
