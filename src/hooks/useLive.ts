'use client';
import { useMemo } from 'react';
import { activeReports, demoLive } from '@/data/demo/live';
import { useTripContext } from '@/hooks/useTripContext';
import { useAppStore } from '@/store/useAppStore';

/** Camino Live: instantâneo de demonstração + relatos e convites do próprio usuário. */
export function useLive() {
  const { route } = useTripContext();
  const mine = useAppStore((s) => s.liveReports);
  const votes = useAppStore((s) => s.liveVotes);
  const myInvites = useAppStore((s) => s.liveInvites);
  const snapshot = useMemo(() => demoLive(route), [route]);
  const reports = useMemo(() => activeReports([...mine, ...snapshot.reports], votes), [mine, snapshot.reports, votes]);
  const invites = useMemo(() => [...myInvites, ...snapshot.invites], [myInvites, snapshot.invites]);
  return { route, snapshot, reports, invites };
}
