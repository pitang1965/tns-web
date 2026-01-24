'use client';

import { DiagnosisAnswer, QuestionDefinition } from '@/data/schemas/diagnosisSchema';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DiagnosisQuestion } from './DiagnosisQuestion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type DiagnosisFormProps = {
  currentStep: number;
  totalSteps: number;
  progress: number;
  currentQuestion: QuestionDefinition;
  currentAnswer: string | undefined;
  canProceed: boolean;
  onAnswerChange: (questionId: keyof DiagnosisAnswer, value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
};

export function DiagnosisForm({
  currentStep,
  totalSteps,
  progress,
  currentQuestion,
  currentAnswer,
  canProceed,
  onAnswerChange,
  onNext,
  onPrevious,
}: DiagnosisFormProps) {
  const handleAnswerChange = (value: string) => {
    onAnswerChange(currentQuestion.id, value);
  };

  const isLastQuestion = currentStep === totalSteps - 1;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            質問 {currentStep + 1} / {totalSteps}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 質問カード */}
      <Card>
        <CardContent className="pt-6">
          <DiagnosisQuestion
            question={currentQuestion}
            value={currentAnswer}
            onValueChange={handleAnswerChange}
          />
        </CardContent>
      </Card>

      {/* ナビゲーションボタン */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentStep === 0}
          className="flex-1"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1">
          {isLastQuestion ? '結果を見る' : '次へ'}
          {!isLastQuestion && <ChevronRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
