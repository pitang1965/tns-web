import React from 'react';
import { Button } from '@/components/ui/button';
import { H2, LargeText } from '@/components/common/Typography';

type ItineraryAccessGateProps = {
  needsLogin: boolean;
  hasAccess: boolean;
  onLogin: () => void;
  onBack: () => void;
}

export const ItineraryAccessGate: React.FC<ItineraryAccessGateProps> = ({
  needsLogin,
  hasAccess,
  onLogin,
  onBack,
}) => {
  if (hasAccess) {
    return null;
  }

  if (needsLogin) {
    return (
      <div className='container mx-auto p-8 text-center'>
        <H2>このコンテンツを閲覧するにはログインが必要です</H2>
        <LargeText>
          この旅程は非公開に設定されています。閲覧するには認証が必要です。
        </LargeText>
        <Button onClick={onLogin} className='cursor-pointer'>ログイン</Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-8 text-center'>
      <H2>アクセス権限がありません</H2>
      <LargeText>この旅程を閲覧する権限がありません。</LargeText>
      <Button onClick={onBack} variant='secondary' className='cursor-pointer'>
        戻る
      </Button>
    </div>
  );
};
