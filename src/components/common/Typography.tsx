import { ReactNode } from 'react';

type TypographyProps = {
  children: ReactNode;
  className?: string;
};

// h1相当 - 主見出し
export function H1({ children, className = '' }: TypographyProps) {
  return (
    <h1 className={`text-3xl md:text-4xl font-bold mb-6 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </h1>
  );
}

// h2相当 - 副見出し
export function H2({ children, className = '' }: TypographyProps) {
  return (
    <h2 className={`text-2xl md:text-3xl font-semibold mb-4 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </h2>
  );
}

// h3相当 - セクション見出し
export function H3({ children, className = '' }: TypographyProps) {
  return (
    <h3 className={`text-xl md:text-2xl font-medium mb-3 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </h3>
  );
}

// h4相当 - サブセクション見出し
export function H4({ children, className = '' }: TypographyProps) {
  return (
    <h4 className={`text-lg md:text-xl font-medium mb-2 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </h4>
  );
}

// 大きめの段落テキスト
export function LargeText({ children, className = '' }: TypographyProps) {
  return <p className={`text-lg mb-6 text-gray-700 dark:text-gray-300 ${className}`}>{children}</p>;
}

// 標準の段落テキスト
export function Text({ children, className = '' }: TypographyProps) {
  return <p className={`text-base mb-4 text-gray-700 dark:text-gray-300 ${className}`}>{children}</p>;
}

// 小さめの段落テキスト(補足情報など)
export function SmallText({ children, className = '' }: TypographyProps) {
  return (
    <p className={`text-sm mb-3 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </p>
  );
}
