import { useState } from 'react';
import { useRouter } from 'next/navigation';

type UseFormNavigationProps = {
  isCreating: boolean;
  itineraryId?: string;
  formModified: boolean;
};

export function useFormNavigation({
  isCreating,
  itineraryId,
  formModified,
}: UseFormNavigationProps) {
  const router = useRouter();

  // 確認ダイアログの表示/非表示
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);

  // バックURLを保存する変数
  const [backUrlState, setBackUrlState] = useState('');

  // 戻るボタン処理
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // ルーティング先を確認する
    const backUrl = isCreating
      ? '/itineraries'
      : itineraryId
      ? `/itineraries/${itineraryId}`
      : '/itineraries';

    setBackUrlState(backUrl);

    if (formModified) {
      // 変更がある場合は確認ダイアログを表示
      setIsBackConfirmOpen(true);
    } else {
      // 変更がない場合は確認なしで戻る
      router.push(backUrl);
    }
  };

  // 確認ダイアログで「はい」を選択した際の処理
  const handleConfirmedBack = async (): Promise<void> => {
    router.push(backUrlState);
    return Promise.resolve();
  };

  return {
    isBackConfirmOpen,
    setIsBackConfirmOpen,
    handleBack,
    handleConfirmedBack,
  };
}
