import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch, apiUpload } from '@/lib/manageApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AudioEvent {
  id: string;
  mission_id: string;
  sequence: number;
  audio_url: string;
  trigger_type: string;
  trigger_value: number | null;
  random_max_pct: number | null;
  label: string | null;
  transcript: string | null;
}

const eventSchema = z.object({
  sequence: z.coerce.number().int().min(0),
  audio_url: z.string().min(1, 'Audio URL required'),
  trigger_type: z.string().min(1, 'Trigger type required'),
  trigger_value: z.coerce.number().optional(),
  random_max_pct: z.coerce.number().optional(),
  label: z.string().optional(),
  transcript: z.string().optional(),
});
type EventForm = z.infer<typeof eventSchema>;

export default function MissionAudioPage() {
  const router = useRouter();
  const missionId = router.query.id as string | undefined;
  const { ready } = useManageAuth();
  const [events, setEvents] = useState<AudioEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AudioEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AudioEvent | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<EventForm>({ resolver: zodResolver(eventSchema) });
  const watchedTriggerType = form.watch('trigger_type');

  async function load() {
    if (!missionId) return;
    setLoading(true);
    try {
      const data = await apiFetch<AudioEvent[]>(`/api/admin/missions/${missionId}/audio`);
      setEvents(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready && missionId) load();
  }, [ready, missionId]);

  function openCreate() {
    setEditing(null);
    form.reset({ sequence: events.length, audio_url: '', trigger_type: 'route_start', trigger_value: undefined, random_max_pct: undefined, label: '', transcript: '' });
    setDialogOpen(true);
  }

  function openEdit(e: AudioEvent) {
    setEditing(e);
    form.reset({
      sequence: e.sequence,
      audio_url: e.audio_url,
      trigger_type: e.trigger_type,
      trigger_value: e.trigger_value ?? undefined,
      random_max_pct: e.random_max_pct ?? undefined,
      label: e.label ?? '',
      transcript: e.transcript ?? '',
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: EventForm) {
    if (!missionId) return;
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/admin/audio-events/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        });
      } else {
        await apiFetch(`/api/admin/missions/${missionId}/audio`, {
          method: 'POST',
          body: JSON.stringify(values),
        });
      }
      setDialogOpen(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/admin/audio-events/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !missionId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mission_id', missionId);
      const result = await apiUpload<{ audioUrl: string }>('/api/admin/audio-events/upload', fd);
      form.setValue('audio_url', result.audioUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/manage/missions')} className="mb-1">
            ← Back to Missions
          </Button>
          <h1 className="text-2xl font-bold">Mission Audio Events</h1>
          {missionId && <p className="text-muted-foreground text-sm">Mission ID: {missionId}</p>}
        </div>
        <Button onClick={openCreate}>+ Add Audio Event</Button>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}
      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seq</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Audio</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell>{ev.sequence}</TableCell>
                <TableCell>{ev.label ?? '—'}</TableCell>
                <TableCell>{ev.trigger_type}</TableCell>
                <TableCell>
                  {ev.trigger_type === 'random'
                    ? `${ev.trigger_value ?? 0}–${ev.random_max_pct ?? 1}`
                    : (ev.trigger_value ?? '—')}
                </TableCell>
                <TableCell>
                  {ev.audio_url && (
                    <audio controls src={ev.audio_url} className="h-8 w-48" />
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(ev)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(ev)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No audio events yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Audio Event' : 'Add Audio Event'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="sequence" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sequence</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="trigger_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="route_start">Route Start</SelectItem>
                        <SelectItem value="distance_pct">Distance %</SelectItem>
                        <SelectItem value="route_end">Route End</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {(watchedTriggerType === 'distance_pct' || watchedTriggerType === 'random') && (
                  <FormField control={form.control} name="trigger_value" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedTriggerType === 'random' ? 'Min % (0–1)' : 'Distance % (0–1)'}
                      </FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {watchedTriggerType === 'random' && (
                  <FormField control={form.control} name="random_max_pct" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max % (0–1)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {watchedTriggerType === 'random' && (
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Event fires at a random point between Min % and Max % of the run
                  </p>
                )}
                <FormField control={form.control} name="label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="audio_url" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Audio URL</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="col-span-2">
                  <p className="text-sm font-medium mb-1">Upload Audio File</p>
                  <div className="flex items-center gap-2">
                    <input ref={fileRef} type="file" accept="audio/*" onChange={handleUpload} className="text-sm" />
                    {uploading && <span className="text-sm text-muted-foreground">Uploading…</span>}
                  </div>
                </div>
                <FormField control={form.control} name="transcript" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Transcript</FormLabel>
                    <FormControl><textarea {...field} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audio Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.label ?? `sequence ${deleteTarget?.sequence}`}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManageLayout>
  );
}
