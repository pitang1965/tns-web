'use client';

import { H2, LargeText } from '@/components/common/Typography';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className='py-20 px-6 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 dark:from-blue-700 dark:via-blue-800 dark:to-purple-900'>
      <div className='max-w-5xl mx-auto text-center'>
        <H2 className='text-white mb-6'>今すぐ始めよう</H2>
        <LargeText className='text-white/90 mb-10'>
          車中泊スポットを探したり、旅程を作成したり、あなたの旅をサポートします。
        </LargeText>
        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap'>
          <a
            href='/shachu-haku'
            className='group inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105'
          >
            車中泊マップを見る
          </a>
          <a
            href='/search'
            className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-white/30 transition-all duration-300 border-2 border-white/40'
          >
            公開旅程を見る
          </a>
          <a
            href='/api/auth/login'
            className='group inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105'
          >
            ログイン / 新規登録
            <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
          </a>
        </div>
      </div>
    </section>
  );
}
