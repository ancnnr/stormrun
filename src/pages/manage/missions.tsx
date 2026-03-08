import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Mission {
  id: string;
  type: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  estimated_time: string | null;
  estimated_distance: number | null;
  is_priority: boolean;
  sort_order: number;
  created_at: string;
}

const missionSchema = z.object({
  type: z.string().min(1, 'Type required'),
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  difficulty: z.string().optional(),
  estimated_time: z.string().optional(),
  estimated_distance: z.coerce.number().optional(),
  is_priority: z.boolean().default(false),
  sort_order: z.coerce.number().default(0),
});
type MissionForm = z.infer<typeof missionSchema>;

export default function MissionsPage() {
  const { ready } = useManageAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);

  const form = useForm<MissionForm>({ resolver: zodResolver(missionSchema) });

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Mission[]>('/api/admin/missions');
      setMissions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  function openCreate() {
    setEditing(null);
    form.reset({ type: '', title: '', description: '', difficulty: '', estimated_time: '', sort_order: 0, is_priority: false });
    setDialogOpen(true);
  }

  function openEdit(m: Mission) {
    setEditing(m);
    form.reset({
      type: m.type,
      title: m.title,
      description: m.description ?? '',
      difficulty: m.difficulty ?? '',
      estimated_time: m.estimated_time ?? '',
      estimated_distance: m.estimated_distance ?? undefined,
      is_priority: m.is_priority,
      sort_order: m.sort_order,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: MissionForm) {
    setSaving(true);
    try {
      const payload = { ...values };
      if (editing) {
        await apiFetch(`/api/admin/missions/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/admin/missions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Missions</h1>
        <Button onClick={openCreate}>+ Create Mission</Button>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}
      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell>{m.type}</TableCell>
                <TableCell>{m.difficulty ?? '—'}</TableCell>
                <TableCell>{m.sort_order}</TableCell>
                <TableCell>{m.is_priority ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(m)}>Edit</Button>
                  <Link href={`/manage/mission-audio?id=${m.id}`}>
                    <Button variant="outline" size="sm">Audio</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {missions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No missions yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Mission' : 'Create Mission'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="estimated_time" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. Time</FormLabel>
                    <FormControl><Input placeholder="e.g. 30 min" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="estimated_distance" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. Distance (km)</FormLabel>
                    <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
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
                <FormField control={form.control} name="is_priority" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 pt-6">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-4 h-4" />
                    </FormControl>
                    <FormLabel className="!mt-0">Priority</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl><textarea {...field} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></FormControl>
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
    </ManageLayout>
  );
}
