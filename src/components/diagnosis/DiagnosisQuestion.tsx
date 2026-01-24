'use client';

import { QuestionDefinition } from '@/data/schemas/diagnosisSchema';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type DiagnosisQuestionProps = {
  question: QuestionDefinition;
  value: string | undefined;
  onValueChange: (value: string) => void;
};

export function DiagnosisQuestion({
  question,
  value,
  onValueChange,
}: DiagnosisQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">{question.question}</h2>
        {question.description && (
          <p className="text-sm text-muted-foreground">{question.description}</p>
        )}
      </div>

      <RadioGroup value={value ?? ''} onValueChange={onValueChange} className="space-y-3">
        {question.options.map((option) => (
          <div key={option.value}>
            <Label
              htmlFor={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all',
                value === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <RadioGroupItem
                value={option.value}
                id={option.value}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <span className="font-medium">{option.label}</span>
                {option.description && (
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                )}
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
