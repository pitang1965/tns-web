/**
 * JSON-LD構造化データコンポーネント
 * SEO向けの構造化データをGoogleに提供する
 */

// サイト全体の構造化データ（WebSite + Organization + SearchAction）
export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://tabi.over40web.club/#website',
        url: 'https://tabi.over40web.club',
        name: '車旅のしおり',
        description:
          '車中泊スポットマップと旅程作成ツール。全国の道の駅、SA・PA、RVパーク、オートキャンプ場を検索して、車旅の計画を立てよう。',
        inLanguage: 'ja-JP',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate:
              'https://tabi.over40web.club/shachu-haku?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
        publisher: {
          '@id': 'https://tabi.over40web.club/#organization',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://tabi.over40web.club/#organization',
        name: '車旅のしおり',
        url: 'https://tabi.over40web.club',
        logo: {
          '@type': 'ImageObject',
          url: 'https://tabi.over40web.club/android-chrome-512x512.png',
          width: 512,
          height: 512,
        },
        sameAs: [],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// パンくずリストの構造化データ
type BreadcrumbItem = {
  name: string;
  url: string;
};

type BreadcrumbJsonLdProps = {
  items: BreadcrumbItem[];
};

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// 車中泊スポット（Place）の構造化データ
type CampingSpotJsonLdProps = {
  name: string;
  description: string;
  address: string;
  prefecture: string;
  latitude: number;
  longitude: number;
  spotType: string;
  isFree: boolean;
  pricePerNight?: number;
  url: string;
  imageUrl?: string;
};

export function CampingSpotJsonLd({
  name,
  description,
  address,
  prefecture,
  latitude,
  longitude,
  spotType,
  isFree,
  pricePerNight,
  url,
  imageUrl,
}: CampingSpotJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name,
    description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: prefecture,
      addressRegion: prefecture,
      addressCountry: 'JP',
      streetAddress: address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude,
      longitude,
    },
    additionalType: spotType,
    ...(imageUrl && { image: imageUrl }),
    url,
    ...(isFree
      ? { isAccessibleForFree: true }
      : pricePerNight && {
          priceRange: `¥${pricePerNight}`,
        }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// 車中泊マップページ用の構造化データ
export function CampingMapJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '車中泊マップ - 車旅のしおり',
    description:
      '全国の車中泊スポットを地図で検索。道の駅、SA・PA、RVパーク、オートキャンプ場などの車中泊可能な場所を簡単に見つけられます。',
    url: 'https://tabi.over40web.club/shachu-haku',
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
    featureList: [
      '車中泊スポット検索',
      '地図表示',
      'スポット種別フィルター',
      '都道府県別検索',
    ],
    inLanguage: 'ja-JP',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
