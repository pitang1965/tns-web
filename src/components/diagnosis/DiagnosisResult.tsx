'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  DiagnosisResult as DiagnosisResultType,
  PartialDiagnosisAnswer,
} from '@/data/schemas/diagnosisSchema';
import { DIAGNOSIS_QUESTIONS } from '@/lib/diagnosisQuestions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareButtons } from './ShareButtons';
import { Search, RotateCcw, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type DiagnosisResultProps = {
  result: DiagnosisResultType;
  answers: PartialDiagnosisAnswer;
  onReset: () => void;
};

const RANK_ICONS = ['', '1', '2', '3'];

export function DiagnosisResultView({ result, answers, onReset }: DiagnosisResultProps) {
  const { persona, recommendations } = result;
  const [copied, setCopied] = useState(false);

  // 除外されていないおすすめスポットをフィルタリング
  const visibleRecommendations = recommendations.filter((r) => !r.excluded);

  // 検索ページへのリンク（上位のスポットタイプでフィルタリング）
  const topTypes = visibleRecommendations.slice(0, 3).map((r) => r.type);
  const searchUrl = `/shachu-haku?type=${topTypes[0] || ''}`;

  // デバッグ用: 回答と結果をクリップボードにコピー
  const handleCopyDebugInfo = async () => {
    const lines: string[] = [];

    lines.push('=== 車中泊スポット診断 デバッグ情報 ===');
    lines.push('');
    lines.push('【回答内容】');

    DIAGNOSIS_QUESTIONS.forEach((q, index) => {
      const answerValue = answers[q.id];
      const selectedOption = q.options.find((opt) => opt.value === answerValue);
      lines.push(`Q${index + 1}. ${q.question}`);
      lines.push(`   → ${selectedOption?.label || '未回答'} (${answerValue || '-'})`);
    });

    lines.push('');
    lines.push('【診断結果】');
    lines.push(`ペルソナ: ${persona.emoji} ${persona.name}`);
    lines.push(`説明: ${persona.description}`);
    lines.push('');
    lines.push('【おすすめスポット（スコア順）】');

    recommendations.forEach((r, index) => {
      const status = r.excluded ? '(除外)' : '';
      lines.push(`${index + 1}. ${r.label} ${status}`);
      lines.push(`   バッジ: ${r.badges.join(', ')}`);
    });

    if (result.excludedSpots.length > 0) {
      lines.push('');
      lines.push(`【除外されたスポット】: ${result.excludedSpots.join(', ')}`);
    }

    const text = lines.join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      {/* ペルソナ結果 */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 pb-4 text-center">
          <p className="text-sm text-muted-foreground">あなたの車中泊スタイルは...</p>
          <div className="mt-2 text-5xl">{persona.emoji}</div>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{persona.name}</h2>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-center text-muted-foreground">{persona.description}</p>
        </CardContent>
      </Card>

      {/* おすすめスポット */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-lg font-semibold">おすすめの車中泊スポット</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleRecommendations.map((recommendation, index) => (
            <div
              key={recommendation.type}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                index === 0 && 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
                index === 1 && 'border-gray-300 bg-gray-50 dark:bg-gray-800/50',
                index === 2 && 'border-orange-300 bg-orange-50 dark:bg-orange-900/20'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  index === 0 && 'bg-yellow-400 text-yellow-900',
                  index === 1 && 'bg-gray-300 text-gray-700',
                  index === 2 && 'bg-orange-400 text-orange-900',
                  index > 2 && 'bg-muted text-muted-foreground'
                )}
              >
                {RANK_ICONS[index + 1] || index + 1}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{recommendation.label}</p>
                <div className="flex flex-wrap gap-1">
                  {recommendation.badges.slice(0, 3).map((badge) => (
                    <Badge key={badge} variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {result.excludedSpots.length > 0 && (
            <p className="text-xs text-muted-foreground">
              ※ 車両サイズの制限により一部のスポットタイプは除外されています
            </p>
          )}
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="space-y-4">
        <Button asChild size="lg" className="w-full gap-2">
          <Link href={searchUrl}>
            <Search className="h-4 w-4" />
            おすすめスポットを探す
          </Link>
        </Button>

        <ShareButtons persona={persona} />

        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            もう一度診断する
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyDebugInfo}
            className="gap-1 text-xs text-muted-foreground"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'コピー済み' : '回答と結果をコピー'}
          </Button>
        </div>
      </div>

      {/* 診断ページへの導線 */}
      <div className="rounded-lg border bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          友達にも診断してもらいましょう！
          <br />
          <Link href="/shachu-haku/shindan" className="text-primary hover:underline">
            車中泊スポット診断
          </Link>
        </p>
      </div>
    </div>
  );
}
