import { ContactForm } from '@/components/contact/ContactForm';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-center">お問い合わせ</h1>
          <p className="text-muted-foreground">
            ご不明な点やご質問、情報の修正提案などがございましたら、お気軽にお問い合わせください。
            担当者より回答させていただきます。
          </p>
          <p className="text-muted-foreground mt-2">
            <strong>車中泊場所の投稿について：</strong>
            現在、「旅のしおり」の車中泊マップに掲載されていないおすすめの車中泊場所の投稿については
            <a href="/shachu-haku/submit" className="text-primary hover:underline ml-1">
              こちらの専用フォーム
            </a>
            からお願いいたします。
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <ContactForm />
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            * 必須項目です。お問い合わせいただいた内容は、
            サービス向上のために利用させていただく場合があります。
          </p>
        </div>
      </div>
    </div>
  );
}