export default function Loading() {
  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* ヘッダー部分のスケルトン */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='h-10 w-24 bg-gray-200 rounded animate-pulse'></div>
          <div className='space-y-2'>
            <div className='h-8 w-64 bg-gray-200 rounded animate-pulse'></div>
            <div className='h-5 w-48 bg-gray-200 rounded animate-pulse'></div>
          </div>
        </div>
        <div className='h-10 w-20 bg-gray-200 rounded animate-pulse'></div>
      </div>

      {/* バッジ部分のスケルトン */}
      <div className='flex gap-2 flex-wrap'>
        <div className='h-6 w-16 bg-gray-200 rounded-full animate-pulse'></div>
        <div className='h-6 w-12 bg-gray-200 rounded-full animate-pulse'></div>
        <div className='h-6 w-20 bg-gray-200 rounded-full animate-pulse'></div>
        <div className='h-6 w-24 bg-gray-200 rounded-full animate-pulse'></div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* メイン部分のスケルトン */}
        <div className='lg:col-span-2 space-y-6'>
          {/* 地図部分 */}
          <div className='bg-white rounded-lg border p-6'>
            <div className='h-6 w-20 bg-gray-200 rounded animate-pulse mb-4'></div>
            <div className='h-[400px] bg-gray-100 rounded animate-pulse'></div>
          </div>

          {/* 詳細情報部分 */}
          <div className='bg-white rounded-lg border p-6'>
            <div className='h-6 w-32 bg-gray-200 rounded animate-pulse mb-4'></div>
            <div className='space-y-2'>
              <div className='h-4 w-full bg-gray-200 rounded animate-pulse'></div>
              <div className='h-4 w-5/6 bg-gray-200 rounded animate-pulse'></div>
              <div className='h-4 w-4/6 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>

        {/* サイドバー部分のスケルトン */}
        <div className='space-y-6'>
          {/* 基本情報 */}
          <div className='bg-white rounded-lg border p-6'>
            <div className='h-6 w-24 bg-gray-200 rounded animate-pulse mb-4'></div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <div className='h-4 w-16 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-4 w-12 bg-gray-200 rounded animate-pulse'></div>
              </div>
              <div className='space-y-2'>
                <div className='h-4 w-16 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-4 w-20 bg-gray-200 rounded animate-pulse'></div>
              </div>
            </div>
          </div>

          {/* 周辺施設 */}
          <div className='bg-white rounded-lg border p-6'>
            <div className='h-6 w-24 bg-gray-200 rounded animate-pulse mb-4'></div>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <div className='h-4 w-20 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-4 w-12 bg-gray-200 rounded animate-pulse'></div>
              </div>
              <div className='flex justify-between'>
                <div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-4 w-16 bg-gray-200 rounded animate-pulse'></div>
              </div>
            </div>
          </div>

          {/* セキュリティ情報 */}
          <div className='bg-white rounded-lg border p-6'>
            <div className='h-6 w-32 bg-gray-200 rounded animate-pulse mb-4'></div>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <div className='h-4 w-28 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-6 w-12 bg-gray-200 rounded-full animate-pulse'></div>
              </div>
              <div className='h-px bg-gray-200 animate-pulse'></div>
              <div className='space-y-2'>
                <div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 bg-gray-200 rounded-full animate-pulse'></div>
                  <div className='h-4 w-28 bg-gray-200 rounded animate-pulse'></div>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 bg-gray-200 rounded-full animate-pulse'></div>
                  <div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 bg-gray-200 rounded-full animate-pulse'></div>
                  <div className='h-4 w-32 bg-gray-200 rounded animate-pulse'></div>
                </div>
              </div>
            </div>
          </div>

          {/* 夜間環境情報 */}
          <div className='bg-white rounded-lg border p-6'>
            <div className='h-6 w-32 bg-gray-200 rounded animate-pulse mb-4'></div>
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-6 w-12 bg-gray-200 rounded-full animate-pulse'></div>
              </div>
              <div className='h-px bg-gray-200 animate-pulse'></div>
              <div className='space-y-2'>
                <div className='h-4 w-20 bg-gray-200 rounded animate-pulse'></div>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 bg-gray-200 rounded-full animate-pulse'></div>
                  <div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 bg-gray-200 rounded-full animate-pulse'></div>
                  <div className='h-4 w-36 bg-gray-200 rounded animate-pulse'></div>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 bg-gray-200 rounded-full animate-pulse'></div>
                  <div className='h-4 w-28 bg-gray-200 rounded animate-pulse'></div>
                </div>
              </div>
            </div>
          </div>

          {/* 設備 */}
          <div className='bg-white rounded-lg border p-6'>
            <div className='h-6 w-16 bg-gray-200 rounded animate-pulse mb-4'></div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-4 w-16 bg-gray-200 rounded animate-pulse'></div>
              </div>
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-4 w-16 bg-gray-200 rounded animate-pulse'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}