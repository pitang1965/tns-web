import { H2, LargeText } from '@/components/common/Typography';

type LoggedInHomeProps = {
  userName: string;
};

export default function LoggedInHome({ userName }: LoggedInHomeProps) {
  return (
    <div className='container mx-auto px-4 pt-8'>
      <H2>ようこそ、{userName}さん！</H2>
      <LargeText>
      🚧🚧 🚧  ここにログインユーザー専用のコンテンツを表示する予定です。🚧 🚧 🚧 
      </LargeText>
      <LargeText>あなたの保存した旅程は「旅程一覧」にあります。</LargeText>
      {/* ログインユーザー専用の機能やコンポーネントをここに追加 */}
    </div>
  );
}
