'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DiagnosisAnswer,
  DiagnosisResult,
  PartialDiagnosisAnswer,
} from '@/data/schemas/diagnosisSchema';
import { calculateDiagnosisResult } from '@/lib/diagnosisScoring';
import { DIAGNOSIS_QUESTIONS } from '@/lib/diagnosisQuestions';

type DiagnosisState = {
  currentStep: number;
  answers: PartialDiagnosisAnswer;
  result: DiagnosisResult | null;
  isComplete: boolean;
};

export function useDiagnosis() {
  const [state, setState] = useState<DiagnosisState>({
    currentStep: -1, // -1 = スタート画面
    answers: {},
    result: null,
    isComplete: false,
  });

  const totalSteps = DIAGNOSIS_QUESTIONS.length;
  const isIntro = state.currentStep === -1;
  // 質問1から始まるように調整（0-indexed → 1-indexed表示）
  const displayStep = isIntro ? 0 : state.currentStep;
  // 進捗は質問番号/全質問数（質問1で10%、質問10で100%）
  const progress = isIntro ? 0 : ((displayStep + 1) / totalSteps) * 100;
  const currentQuestion = isIntro ? null : DIAGNOSIS_QUESTIONS[state.currentStep];

  const setAnswer = useCallback(
    (questionId: keyof DiagnosisAnswer, value: string) => {
      setState((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: value,
        },
      }));
    },
    []
  );

  const goToNext = useCallback(() => {
    setState((prev) => {
      const nextStep = prev.currentStep + 1;

      if (nextStep >= totalSteps) {
        // 全問完了、結果を計算
        const result = calculateDiagnosisResult(prev.answers as DiagnosisAnswer);
        return {
          ...prev,
          currentStep: nextStep,
          result,
          isComplete: true,
        };
      }

      return {
        ...prev,
        currentStep: nextStep,
      };
    });
  }, [totalSteps]);

  const goToPrevious = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(-1, prev.currentStep - 1),
      isComplete: false,
      result: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      currentStep: -1,
      answers: {},
      result: null,
      isComplete: false,
    });
  }, []);

  const canProceed = useMemo(() => {
    if (!currentQuestion) return false;
    return currentQuestion.id in state.answers;
  }, [currentQuestion, state.answers]);

  const currentAnswer = useMemo(() => {
    if (!currentQuestion) return undefined;
    return state.answers[currentQuestion.id];
  }, [currentQuestion, state.answers]);

  return {
    currentStep: displayStep,
    totalSteps,
    progress,
    currentQuestion,
    currentAnswer,
    answers: state.answers,
    result: state.result,
    isIntro,
    isComplete: state.isComplete,
    canProceed,
    setAnswer,
    goToNext,
    goToPrevious,
    reset,
  };
}
