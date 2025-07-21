import { H2, LargeText } from '@/components/common/Typography';
import RecentUrls from '@/components/common/RecentUrls';

type LoggedInHomeProps = {
  userName: string;
};

export default function LoggedInHome({ userName }: LoggedInHomeProps) {
  return (
    <div className='container mx-auto px-4 pt-8 space-y-6'>
      <div>
        <H2>ようこそ、{userName}さん！</H2>
        <LargeText>あなたの保存した旅程は「旅程一覧」にあります。</LargeText>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <RecentUrls />
        </div>
      </div>
  );
}
