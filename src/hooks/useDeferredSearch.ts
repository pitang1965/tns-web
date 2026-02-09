import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 明示的なSubmitで検索を実行するカスタムフック。
 * ローカルの入力状態と確定済みの検索語を分離管理し、
 * Enterキーやボタンクリックまたはクリア操作時のみAPI呼び出しを行う。
 */
export function useDeferredSearch(committedValue: string, onCommit: (value: string) => void) {
  const [inputValue, setInputValue] = useState(committedValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // 外部から確定値が変更された場合（リセット等）にローカル入力を同期
  useEffect(() => {
    setInputValue(committedValue);
  }, [committedValue]);

  const submit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed !== committedValue) {
      onCommit(trimmed);
    }
  }, [inputValue, committedValue, onCommit]);

  const clear = useCallback(() => {
    setInputValue('');
    if (committedValue) {
      onCommit('');
    }
    inputRef.current?.focus();
  }, [committedValue, onCommit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }, [submit]);

  const isDirty = inputValue.trim() !== committedValue;

  return {
    inputValue,
    setInputValue,
    inputRef,
    submit,
    clear,
    handleKeyDown,
    isDirty,
  };
}
