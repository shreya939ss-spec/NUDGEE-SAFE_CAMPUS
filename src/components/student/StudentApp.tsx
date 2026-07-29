import { useState } from 'react';
import { StudentShell, type StudentTab } from './StudentShell';
import { HomeScreen } from './HomeScreen';
import { FeedScreen } from './FeedScreen';
import { ClubsScreen } from './ClubsScreen';
import { EventsScreen } from './EventsScreen';
import { AiScreen } from './AiScreen';
import { ProfileScreen } from './ProfileScreen';

export default function StudentApp() {
  const [tab, setTab] = useState<StudentTab>('home');

  return (
    <StudentShell active={tab} onTab={setTab}>
      {tab === 'home' && <HomeScreen onTab={setTab} />}
      {tab === 'feed' && <FeedScreen />}
      {tab === 'clubs' && <ClubsScreen />}
      {tab === 'events' && <EventsScreen />}
      {tab === 'ai' && <AiScreen />}
      {tab === 'profile' && <ProfileScreen />}
    </StudentShell>
  );
}
