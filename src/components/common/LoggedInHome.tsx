import { Suspense } from 'react';
import { H2 } from '@/components/common/Typography';
import { getItineraries } from '@/lib/itineraries';
import { auth0 } from '@/lib/auth0';
import UserStats from '@/components/common/UserStats';
import RecentItineraries from '@/components/common/RecentItineraries';
import QuickActions from '@/components/common/QuickActions';
import RecentItineraryViews from '@/components/common/RecentItineraryViews';
import PremiumBadge from '@/components/common/PremiumBadge';
import ItineraryLimitStatus from '@/components/common/ItineraryLimitStatus';
import { LoadingSpinner } from '@/components/common/loading-spinner';

type LoggedInHomeProps = {
  userName: string;
};

async function DashboardContent() {
  const itineraries = await getItineraries();
  const session = await auth0.getSession();

  return (
    <>
      {/* Premium Badge */}
      <div className="flex justify-center lg:justify-start">
        <PremiumBadge user={session?.user} variant="large" />
      </div>

      {/* Statistics */}
      <UserStats itineraries={itineraries} />

      {/* Main Content Grid */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Left Column */}
        <div className='lg:col-span-2 space-y-6'>
          <RecentItineraries itineraries={itineraries} limit={4} />
          <QuickActions />
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
          <ItineraryLimitStatus user={session?.user} itineraries={itineraries} />
          <RecentItineraryViews />
        </div>
      </div>
    </>
  );
}

export default function LoggedInHome({ userName }: LoggedInHomeProps) {
  return (
    <div className='container mx-auto px-4 pt-8 space-y-6'>
      {/* Welcome Header */}
      <div className='text-center lg:text-left'>
        <H2>{userName}さんのダッシュボード</H2>
      </div>

      {/* Dashboard Content */}
      <Suspense
        fallback={
          <div className='flex justify-center items-center py-12'>
            <LoadingSpinner />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
