'use client';

import { Button } from '@/components/ui/button';
import { PersonaInfo } from '@/data/schemas/diagnosisSchema';
import { Share2 } from 'lucide-react';

type ShareButtonsProps = {
  persona: PersonaInfo;
};

const SHARE_URL = 'https://tabi.over40web.club/shachu-haku/shindan';

export function ShareButtons({ persona }: ShareButtonsProps) {
  const shareText = `私の車中泊スタイルは【${persona.emoji} ${persona.name}】でした！\n${persona.description}\n\n#車中泊 #車旅のしおり`;

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(SHARE_URL)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLineShare = () => {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `車中泊スポット診断結果: ${persona.name}`,
          text: shareText,
          url: SHARE_URL,
        });
      } catch {
        // ユーザーがキャンセルした場合など
      }
    }
  };

  const canWebShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button
        variant="outline"
        onClick={handleTwitterShare}
        className="gap-2 bg-black text-white hover:bg-black/90 hover:text-white"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Xでシェア
      </Button>

      <Button
        variant="outline"
        onClick={handleLineShare}
        className="gap-2 bg-[#00B900] text-white hover:bg-[#00A000] hover:text-white"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        LINEで送る
      </Button>

      {canWebShare && (
        <Button variant="outline" onClick={handleWebShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          その他
        </Button>
      )}
    </div>
  );
}
