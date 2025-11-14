import { Suspense } from 'react';
import { H2 } from '@/components/common/Typography';
import { getItineraries } from '@/lib/itineraries';
import { auth0 } from '@/lib/auth0';
import UserStats from '@/components/common/UserStats';
import QuickActions from '@/components/common/QuickActions';
import RecentViews from '@/components/common/RecentViews';
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

      {/* Main Content - Single Column */}
      <div className='space-y-6'>
        <QuickActions />
        <ItineraryLimitStatus user={session?.user} itineraries={itineraries} />
        <RecentViews />
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
