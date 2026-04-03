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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface MissionRef {
  id: string;
  title: string;
  type: string;
}

const pmSchema = z.object({
  mission_id: z.string().min(1, 'Mission required'),
  week_number: z.coerce.number().int().min(1),
  day_in_week: z.coerce.number().int().min(1),
  sort_order: z.coerce.number().int().default(0),
  is_rest_day: z.boolean().default(false),
});
type PMForm = z.infer<typeof pmSchema>;

const EMPTY_INTERVALS = JSON.stringify([
  { action: 'walk', durationSec: 300, label: 'Warm-up walk' },
  { action: 'run', durationSec: 60, label: 'Run 1' },
  { action: 'walk', durationSec: 90, label: 'Recovery walk' },
  { action: 'walk', durationSec: 300, label: 'Cool-down walk' },
], null, 2);

const EMPTY_MAPPING = JSON.stringify({ '4': null, '6': null, '8': null }, null, 2);

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

  // Interval and mapping JSON fields
  const [intervalsJson, setIntervalsJson] = useState(EMPTY_INTERVALS);
  const [mappingJson, setMappingJson] = useState(EMPTY_MAPPING);
  const [useIntervals, setUseIntervals] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);

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
    setIntervalsJson(EMPTY_INTERVALS);
    setMappingJson(EMPTY_MAPPING);
    setUseIntervals(true);
    setJsonError(null);
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
    setIntervalsJson(pm.intervals ? JSON.stringify(pm.intervals, null, 2) : EMPTY_INTERVALS);
    setMappingJson(JSON.stringify(pm.timeline_week_mapping || { '4': null, '6': null, '8': null }, null, 2));
    setUseIntervals(pm.intervals !== null && pm.intervals !== undefined);
    setJsonError(null);
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
    setJsonError(null);

    let intervals: IntervalStep[] | null = null;
    let timeline_week_mapping: Record<string, number | null>;

    if (useIntervals) {
      try {
        intervals = JSON.parse(intervalsJson);
      } catch {
        setJsonError('Intervals: invalid JSON');
        return;
      }
    }

    try {
      timeline_week_mapping = JSON.parse(mappingJson);
    } catch {
      setJsonError('Timeline mapping: invalid JSON');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...values, intervals, timeline_week_mapping };
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
                  <TableHead>Type</TableHead>
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
                      <TableCell className="text-xs text-muted-foreground">{pm.missionType}</TableCell>
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
                        <SelectItem key={m.id} value={m.id}>{m.title} ({m.type})</SelectItem>
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
              <div className="space-y-1">
                <label className="text-sm font-medium">Timeline Week Mapping (JSON)</label>
                <Textarea
                  rows={4}
                  className="font-mono text-xs"
                  value={mappingJson}
                  onChange={(e) => setMappingJson(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maps this session to a week in each timeline. Use null to exclude from a timeline.
                  e.g. {'{"4": null, "6": 2, "8": 3}'} — excluded from 4-week, week 2 of 6-week, week 3 of 8-week.
                </p>
              </div>

              {/* Intervals */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Walk/Run Intervals</label>
                  <button
                    type="button"
                    onClick={() => setUseIntervals(!useIntervals)}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      useIntervals ? 'bg-primary text-primary-foreground border-primary' : 'border-input'
                    }`}
                  >
                    {useIntervals ? 'Enabled' : 'Disabled (pure run)'}
                  </button>
                </div>
                {useIntervals && (
                  <>
                    <Textarea
                      rows={10}
                      className="font-mono text-xs"
                      value={intervalsJson}
                      onChange={(e) => setIntervalsJson(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Array of {'{ action: "walk"|"run", durationSec: number, label?: string }'}
                    </p>
                  </>
                )}
              </div>

              {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}

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
