import { Metadata } from 'next';
import CampingSpotSubmissionForm from '@/components/public/CampingSpotSubmissionForm';

export const metadata: Metadata = {
  title: '車中泊スポット情報の投稿 | 旅のしおり',
  description:
    '車で泊まれる場所の情報をみんなで教え合って、快適な車中泊を楽しもう。',
};

export default function CampingSpotSubmitPage() {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
            車中泊スポット情報の投稿
          </h1>
          <p className='text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
            あなたが知っている車中泊に適した場所を教えてください。
            投稿された情報は管理者が確認後に公開され、多くの旅行者の参考になります。
          </p>
        </div>

        <CampingSpotSubmissionForm />

        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            投稿していただいた情報は、多くの車中泊をする人の役に立ちます。
            <br />
            ご協力ありがとうございます。
          </p>
        </div>
      </div>
    </div>
  );
}
