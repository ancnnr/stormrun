import { useEffect, useRef, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { EncouragementAudio } from '@/types';

const schema = z.object({
  label: z.string().min(1, 'Label required'),
  category: z.string().min(1, 'Category required'),
  audio_url: z.string().min(1, 'Audio URL required'),
  transcript: z.string().optional(),
  duration_s: z.coerce.number().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().default(0),
});
type FormData = z.infer<typeof schema>;

const CATEGORIES = ['general', 'warmup', 'effort', 'recovery', 'finish'] as const;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function EncouragementPage() {
  const { ready } = useManageAuth();
  const [items, setItems] = useState<EncouragementAudio[]>([]);
  const [filtered, setFiltered] = useState<EncouragementAudio[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EncouragementAudio | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EncouragementAudio | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<EncouragementAudio[]>('/api/admin/encouragement');
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  useEffect(() => {
    setFiltered(categoryFilter === 'all' ? items : items.filter((i) => i.category === categoryFilter));
  }, [items, categoryFilter]);

  function openCreate() {
    setEditing(null);
    form.reset({ label: '', category: 'general', audio_url: '', transcript: '', is_active: true, sort_order: 0 });
    setDialogOpen(true);
  }

  function openEdit(item: EncouragementAudio) {
    setEditing(item);
    form.reset({
      label: item.label,
      category: item.category,
      audio_url: item.audio_url,
      transcript: item.transcript ?? '',
      duration_s: item.duration_s ?? undefined,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: FormData) {
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/admin/encouragement/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        });
      } else {
        await apiFetch('/api/admin/encouragement', {
          method: 'POST',
          body: JSON.stringify(values),
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/admin/encouragement/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await apiUpload<{ audioUrl: string }>('/api/admin/encouragement/upload', fd);
      form.setValue('audio_url', result.audioUrl);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Encouragement Audio</h1>
        <Button onClick={openCreate}>+ Add Audio</Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-medium">Filter by category:</span>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{capitalize(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}
      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Audio</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell>{capitalize(item.category)}</TableCell>
                <TableCell>{item.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell>{item.sort_order}</TableCell>
                <TableCell>
                  {item.audio_url && (
                    <audio controls src={item.audio_url} className="h-8 w-48" />
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(item)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No entries yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Encouragement Audio' : 'Add Encouragement Audio'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="label" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Label</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{capitalize(c)}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                <FormField control={form.control} name="duration_s" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (s)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 pt-6">
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={field.onChange} className="w-4 h-4" />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
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
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
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
            <AlertDialogTitle>Delete Encouragement Audio?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.label}". This cannot be undone.
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
