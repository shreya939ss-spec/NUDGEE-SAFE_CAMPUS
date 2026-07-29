import { useState } from 'react';
import { AdminShell, type AdminTab } from './AdminShell';
import { DashboardScreen } from './DashboardScreen';
import { EventsManager } from './EventsManager';
import { ClubsManager } from './ClubsManager';
import { MentorsManager } from './MentorsManager';
import { RewardsManager } from './RewardsManager';
import { InsightsScreen } from './InsightsScreen';

export default function AdminApp() {
  const [tab, setTab] = useState<AdminTab>('dashboard');

  return (
    <AdminShell active={tab} onTab={setTab}>
      {tab === 'dashboard' && <DashboardScreen />}
      {tab === 'events' && <EventsManager />}
      {tab === 'clubs' && <ClubsManager />}
      {tab === 'mentors' && <MentorsManager />}
      {tab === 'rewards' && <RewardsManager />}
      {tab === 'insights' && <InsightsScreen />}
    </AdminShell>
  );
}
