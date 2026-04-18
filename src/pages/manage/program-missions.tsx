import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import {
  apiFetch,
  listProgramMissions,
  addProgramMission,
  updateProgramMission,
  deleteProgramMission,
  type ProgramMission,
  type Program,
  type IntervalStep,
} from '@/lib/manageApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

interface MissionRef {
  id: string;
  title: string;
}

const pmSchema = z.object({
  mission_id: z.string().min(1, 'Mission required'),
  week_number: z.coerce.number().int().min(1),
  day_in_week: z.coerce.number().int().min(1),
  sort_order: z.coerce.number().int().default(0),
  is_rest_day: z.boolean().default(false),
});
type PMForm = z.infer<typeof pmSchema>;

const TIMELINE_KEYS = ['4', '6', '8'] as const;
type TimelineKey = typeof TIMELINE_KEYS[number];

const DEFAULT_INTERVALS: IntervalStep[] = [
  { action: 'walk', durationSec: 300, label: 'Warm-up walk' },
  { action: 'run', durationSec: 60, label: 'Run 1' },
  { action: 'walk', durationSec: 90, label: 'Recovery walk' },
  { action: 'walk', durationSec: 300, label: 'Cool-down walk' },
];

const DEFAULT_MAPPING: Record<TimelineKey, string> = { '4': 'off', '6': 'off', '8': 'off' };

function mappingToState(raw: Record<string, number | null> | undefined): Record<TimelineKey, string> {
  const result = { ...DEFAULT_MAPPING };
  for (const key of TIMELINE_KEYS) {
    const val = raw?.[key];
    result[key] = val != null ? String(val) : 'off';
  }
  return result;
}

function stateToMapping(state: Record<TimelineKey, string>): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  for (const key of TIMELINE_KEYS) {
    result[key] = state[key] === 'off' ? null : parseInt(state[key], 10);
  }
  return result;
}

export default function ProgramMissionsPage() {
  const router = useRouter();
  const programId = router.query.id as string | undefined;
  const { ready } = useManageAuth();
  const { toast } = useToast();
  const [program, setProgram] = useState<Program | null>(null);
  const [sessions, setSessions] = useState<ProgramMission[]>([]);
  const [missions, setMissions] = useState<MissionRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramMission | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProgramMission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [intervals, setIntervals] = useState<IntervalStep[]>(DEFAULT_INTERVALS);
  const [mapping, setMapping] = useState<Record<TimelineKey, string>>(DEFAULT_MAPPING);
  const [useIntervals, setUseIntervals] = useState(true);

  const form = useForm<PMForm>({ resolver: zodResolver(pmSchema) });

  async function load() {
    if (!programId) return;
    setLoading(true);
    try {
      const [prog, sess, missionList] = await Promise.all([
        apiFetch<Program>(`/api/admin/programs/${programId}`),
        listProgramMissions(programId),
        apiFetch<MissionRef[]>('/api/admin/missions'),
      ]);
      setProgram(prog);
      setSessions(sess);
      setMissions(missionList);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (ready && programId) load(); }, [ready, programId]);

  function openCreate() {
    setEditing(null);
    setIntervals(DEFAULT_INTERVALS);
    setMapping(DEFAULT_MAPPING);
    setUseIntervals(true);
    form.reset({
      mission_id: '',
      week_number: 1,
      day_in_week: 1,
      sort_order: sessions.length,
      is_rest_day: false,
    });
    setDialogOpen(true);
  }

  function openEdit(pm: ProgramMission) {
    setEditing(pm);
    setIntervals(pm.intervals ?? DEFAULT_INTERVALS);
    setMapping(mappingToState(pm.timeline_week_mapping as Record<string, number | null> | undefined));
    setUseIntervals(pm.intervals !== null && pm.intervals !== undefined);
    form.reset({
      mission_id: pm.mission_id,
      week_number: pm.week_number,
      day_in_week: pm.day_in_week,
      sort_order: pm.sort_order,
      is_rest_day: pm.is_rest_day,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: PMForm) {
    if (!programId) return;

    setSaving(true);
    try {
      const payload = {
        ...values,
        intervals: useIntervals ? intervals : null,
        timeline_week_mapping: stateToMapping(mapping),
      };
      if (editing) {
        await updateProgramMission(programId, editing.id, payload);
        toast({ title: 'Session updated' });
      } else {
        await addProgramMission(programId, payload as Parameters<typeof addProgramMission>[1]);
        toast({ title: 'Session added' });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !programId) return;
    setDeleting(true);
    try {
      await deleteProgramMission(programId, deleteTarget.id);
      toast({ title: 'Session removed' });
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  // Group sessions by week for display
  const byWeek = sessions.reduce<Record<number, ProgramMission[]>>((acc, s) => {
    if (!acc[s.week_number]) acc[s.week_number] = [];
    acc[s.week_number].push(s);
    return acc;
  }, {});

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              className="text-sm text-muted-foreground hover:text-primary mb-1"
              onClick={() => router.push('/manage/programs')}
            >
              ← Programs
            </button>
            <h1 className="text-2xl font-bold">
              {program ? `${program.title} — Sessions` : 'Program Sessions'}
            </h1>
            {program && (
              <p className="text-sm text-muted-foreground">
                {sessions.length} sessions · {program.difficulty} · {program.status}
              </p>
            )}
          </div>
          <Button onClick={openCreate}>+ Add Session</Button>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && Object.keys(byWeek).length === 0 && (
          <p className="text-muted-foreground">No sessions yet. Add sessions to build the program schedule.</p>
        )}

        {!loading && !error && Object.keys(byWeek).sort((a, b) => Number(a) - Number(b)).map((wk) => (
          <div key={wk} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Week {wk}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Mission</TableHead>
                  <TableHead>Locomotion</TableHead>
                  <TableHead>Intervals</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Timeline Map</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byWeek[Number(wk)]
                  .sort((a, b) => a.day_in_week - b.day_in_week)
                  .map((pm) => (
                    <TableRow key={pm.id}>
                      <TableCell>{pm.day_in_week}</TableCell>
                      <TableCell className="font-medium">{pm.missionTitle}</TableCell>
                      <TableCell className="text-xs">{pm.locomotionType ?? '—'}</TableCell>
                      <TableCell className="text-xs">
                        {pm.intervals ? `${pm.intervals.length} steps` : '—'}
                      </TableCell>
                      <TableCell>{pm.sort_order}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {Object.entries(pm.timeline_week_mapping || {})
                          .map(([k, v]) => `${k}w:${v ?? 'off'}`)
                          .join(' ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(pm)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(pm)}>Remove</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Session' : 'Add Session'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="mission_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select mission" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {missions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="week_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Week #</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="day_in_week" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day in Week</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sort_order" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Timeline week mapping */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Timeline Week Mapping</label>
                <p className="text-xs text-muted-foreground">For each timeline length, choose which week this session falls in, or "Off" to exclude it.</p>
                <div className="rounded-md border divide-y">
                  {TIMELINE_KEYS.map((key) => {
                    const maxWeek = parseInt(key, 10);
                    return (
                      <div key={key} className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm font-medium w-24">{key}-week plan</span>
                        <Select
                          value={mapping[key]}
                          onValueChange={(v) => setMapping((prev) => ({ ...prev, [key]: v }))}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="off">Off (excluded)</SelectItem>
                            {Array.from({ length: maxWeek }, (_, i) => i + 1).map((w) => (
                              <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Intervals step builder */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Walk/Run Intervals</label>
                  <button
                    type="button"
                    onClick={() => setUseIntervals(!useIntervals)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      useIntervals ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground'
                    }`}
                  >
                    {useIntervals ? 'Enabled' : 'Disabled (pure run)'}
                  </button>
                </div>

                {useIntervals && (
                  <div className="space-y-2">
                    {intervals.length > 0 && (
                      <div className="rounded-md border divide-y">
                        <div className="grid grid-cols-[90px_110px_1fr_auto] gap-2 px-3 py-1.5 bg-muted/40">
                          <span className="text-xs font-medium text-muted-foreground">Action</span>
                          <span className="text-xs font-medium text-muted-foreground">Duration (sec)</span>
                          <span className="text-xs font-medium text-muted-foreground">Label</span>
                          <span />
                        </div>
                        {intervals.map((step, i) => (
                          <div key={i} className="grid grid-cols-[90px_110px_1fr_auto] gap-2 items-center px-3 py-1.5">
                            <Select
                              value={step.action}
                              onValueChange={(v) => setIntervals((prev) => prev.map((s, j) => j === i ? { ...s, action: v as 'walk' | 'run' } : s))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="walk">Walk</SelectItem>
                                <SelectItem value="run">Run</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min={1}
                              className="h-8 text-xs"
                              value={step.durationSec}
                              onChange={(e) => setIntervals((prev) => prev.map((s, j) => j === i ? { ...s, durationSec: parseInt(e.target.value, 10) || 0 } : s))}
                            />
                            <Input
                              className="h-8 text-xs"
                              placeholder="Optional label"
                              value={step.label ?? ''}
                              onChange={(e) => setIntervals((prev) => prev.map((s, j) => j === i ? { ...s, label: e.target.value } : s))}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-destructive"
                              onClick={() => setIntervals((prev) => prev.filter((_, j) => j !== i))}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {intervals.length === 0 && (
                      <p className="text-xs text-muted-foreground border border-dashed rounded p-3 text-center">No steps yet. Add one below.</p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIntervals((prev) => [...prev, { action: 'walk', durationSec: 60, label: '' }])}
                    >
                      + Add Step
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove session?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &ldquo;{deleteTarget?.missionTitle}&rdquo; (Week {deleteTarget?.week_number}, Day {deleteTarget?.day_in_week}) from this program?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManageLayout>
  );
}
