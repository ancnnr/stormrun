import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface StoryMission {
  id: string;
  title: string;
  story_season: number | null;
  story_chapter: number | null;
  difficulty: string;
  status: string;
  min_level: number | null;
  prerequisite_mission_id: string | null;
  chapter_summary_template: string | null;
  estimated_distance: number;
  estimated_time: string;
  sort_order: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-amber-100 text-amber-800',
  expert: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

export default function StoryMissionsPage() {
  const { ready } = useManageAuth();

  const [missions, setMissions] = useState<StoryMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<StoryMission[]>('/api/admin/missions?mission_type=story');
      // Filter client-side since the endpoint doesn't support filtering yet
      const story = Array.isArray(data) ? data.filter((m) => (m as unknown as Record<string, unknown>).mission_type === 'story') : [];
      // Sort by season then chapter
      story.sort((a, b) => {
        const sa = a.story_season ?? 999;
        const sb = b.story_season ?? 999;
        if (sa !== sb) return sa - sb;
        return (a.story_chapter ?? 999) - (b.story_chapter ?? 999);
      });
      setMissions(story);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load story missions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Group by season
  const seasons = missions.reduce<Record<number, StoryMission[]>>((acc, m) => {
    const s = m.story_season ?? 0;
    if (!acc[s]) acc[s] = [];
    acc[s].push(m);
    return acc;
  }, {});

  const prereqMap = missions.reduce<Record<string, string>>((acc, m) => {
    acc[m.id] = m.title;
    return acc;
  }, {});

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Story Missions</h1>
          <p className="text-sm text-muted-foreground mt-1">{missions.length} chapters across {Object.keys(seasons).length} season{Object.keys(seasons).length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
          <Link href="/manage/missions">
            <Button size="sm">+ Add Chapter</Button>
          </Link>
        </div>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}
      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && missions.length === 0 && (
        <div className="rounded-md border border-dashed p-10 text-center">
          <p className="text-muted-foreground mb-3">No story chapters yet.</p>
          <Link href="/manage/missions">
            <Button variant="outline">Create a story mission in Mission Editor</Button>
          </Link>
        </div>
      )}

      {!loading && Object.keys(seasons).sort((a, b) => Number(a) - Number(b)).map((seasonKey) => {
        const season = Number(seasonKey);
        const chapters = seasons[season];
        return (
          <div key={seasonKey} className="mb-8">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide">
                {season === 0 ? 'Unassigned' : `Season ${season}`}
              </span>
              <span className="text-sm font-normal text-muted-foreground">{chapters.length} chapter{chapters.length !== 1 ? 's' : ''}</span>
            </h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ch.</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gating</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Summary Template</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((m) => {
                  const gatingParts: string[] = [];
                  if (m.min_level) gatingParts.push(`Lvl ${m.min_level}`);
                  if (m.prerequisite_mission_id) gatingParts.push(`After: ${prereqMap[m.prerequisite_mission_id] ?? '…'}`);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        {m.story_chapter ?? '—'}
                      </TableCell>
                      <TableCell className="font-medium">{m.title}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${DIFFICULTY_COLORS[m.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                          {m.difficulty}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {m.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {gatingParts.length > 0 ? gatingParts.join(' · ') : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.estimated_distance ? `${m.estimated_distance} km` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {m.chapter_summary_template ?? <span className="italic">None</span>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/manage/missions`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Link href={`/manage/mission-audio?id=${m.id}`}>
                          <Button variant="outline" size="sm">Audio</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );
      })}

      <div className="mt-6 rounded-md border p-4 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">About Story Missions</p>
        <p className="text-sm text-muted-foreground">
          Story chapters are authored in the{' '}
          <Link href="/manage/missions" className="underline">Mission Editor</Link>{' '}
          by setting <strong>Mission Type = Story</strong> and filling in Season, Chapter, and Summary Template.
          Audio narration is managed per-chapter via the <strong>Audio</strong> button.
          Chapters unlock for players based on level gating and prerequisite completion.
        </p>
      </div>
    </ManageLayout>
  );
}
