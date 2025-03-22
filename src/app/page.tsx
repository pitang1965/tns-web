import { Metadata } from 'next';
import { getSession } from '@auth0/nextjs-auth0';
import PublicHome from '@/components/common/PublicHome';
import LoggedInHome from '@/components/common/LoggedInHome';

export const metadata: Metadata = {
  title: '旅のしおり | あなたの旅行計画をサポート',
  description:
    '旅のしおりを簡単に作成。旅行の計画から実行まで、あなたの旅をサポートします。効率的な旅程管理ツールで、思い出に残る旅行を。',
  keywords: '旅のしおり,旅行計画,旅程管理,トラベルプランナー',
  openGraph: {
    title: '旅のしおり作成 | あなたの旅行計画をサポート',
    description:
      '旅のしおりを簡単に作成。旅行の計画から実行まで、あなたの旅をサポートします。',
    type: 'website',
    url: 'https://tabi-no-shiori.vercel.app',
    images: [
      {
        url: 'https://tabi-no-shiori.vercel.app/over40.svg', // TODO: 後で置き換える
      },
    ],
  },
};

export default async function Home() {
  const session = await getSession();

  if (session?.user) {
    return <LoggedInHome userName={session.user.name || 'ゲスト'} />;
  } else {
    return <PublicHome />;
  }
}
