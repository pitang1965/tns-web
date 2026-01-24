'use client';

import { useDiagnosis } from '@/hooks/useDiagnosis';
import { DiagnosisForm } from './DiagnosisForm';
import { DiagnosisResultView } from './DiagnosisResult';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';

export default function DiagnosisClient() {
  const {
    currentStep,
    totalSteps,
    progress,
    currentQuestion,
    currentAnswer,
    result,
    isIntro,
    isComplete,
    canProceed,
    setAnswer,
    goToNext,
    goToPrevious,
    reset,
  } = useDiagnosis();

  // スタート画面
  if (isIntro) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-lg space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/20 to-primary/5 pb-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Car className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">車中泊スポット診断</h1>
              <p className="mt-2 text-muted-foreground">
                10問の質問に答えて、あなたにぴったりの車中泊スタイルを見つけましょう！
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>この診断では以下のことがわかります：</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>あなたの車中泊スタイル（8タイプ）</li>
                  <li>おすすめの車中泊スポット</li>
                  <li>あなたに合った条件・設備</li>
                </ul>
              </div>
              <Button onClick={goToNext} size="lg" className="w-full">
                診断をはじめる
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 結果画面
  if (isComplete && result) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DiagnosisResultView result={result} onReset={reset} />
      </div>
    );
  }

  // 質問画面
  if (currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DiagnosisForm
          currentStep={currentStep}
          totalSteps={totalSteps}
          progress={progress}
          currentQuestion={currentQuestion}
          currentAnswer={currentAnswer}
          canProceed={canProceed}
          onAnswerChange={setAnswer}
          onNext={goToNext}
          onPrevious={goToPrevious}
        />
      </div>
    );
  }

  return null;
}
