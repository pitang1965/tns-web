'use client';

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { H2, Text } from '@/components/common/Typography';

export default function SNSSection() {
  return (
    <section className='py-16 px-6 bg-linear-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900'>
      <div className='container mx-auto max-w-4xl'>
        <div className='text-center mb-8'>
          <H2 className='mb-4'>SNSアカウント</H2>
          <Text className='text-gray-600 dark:text-gray-300'>
            車中泊の最新情報をXでも発信中
          </Text>
        </div>

        <div className='flex flex-col items-center gap-6'>
          <a
            href='https://x.com/araiazuki930'
            target='_blank'
            rel='noopener noreferrer'
            className='group flex items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 max-w-md w-full'
          >
            <div className='relative w-20 h-20 flex-shrink-0 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors'>
              <Image
                src='/araiazuki.jpg'
                alt='アライアズキ'
                width={80}
                height={80}
                className='object-cover'
              />
            </div>
            <div className='flex-grow'>
              <h3 className='text-xl font-semibold mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                アライアズキ🫘車中泊
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                @araiazuki930
              </p>
              <div className='flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium'>
                <span>Xで見る</span>
                <ExternalLink className='w-4 h-4' />
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
