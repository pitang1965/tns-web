type LoggedInHomeProps = {
  userName: string;
};

export default function LoggedInHome({ userName }: LoggedInHomeProps) {
  return (
    <div>
      <h2>ようこそ、{userName}さん！</h2>
      <p>ここにログインユーザー専用のコンテンツを表示します。</p>
      {/* ログインユーザー専用の機能やコンポーネントをここに追加 */}
    </div>
  );
}
