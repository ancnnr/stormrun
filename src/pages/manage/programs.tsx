import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import {
  listPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  type Program,
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

const programSchema = z.object({
  slug: z.string().min(1, 'Slug required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  long_description: z.string().optional(),
  category: z.string().min(1, 'Category required'),
  difficulty: z.string().min(1, 'Difficulty required'),
  icon: z.string().optional(),
  cover_image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  default_sessions_per_week: z.coerce.number().int().min(1).max(7).default(3),
  sort_order: z.coerce.number().int().default(0),
  status: z.string().default('draft'),
});
type ProgramForm = z.infer<typeof programSchema>;

const DEFAULT_TIMELINE_OPTIONS = JSON.stringify([
  { weeks: 8, label: 'Standard', sessionsPerWeek: 3 },
  { weeks: 6, label: 'Moderate', sessionsPerWeek: 4 },
  { weeks: 4, label: 'Intensive', sessionsPerWeek: 5 },
], null, 2);

const DEFAULT_OUTCOMES = JSON.stringify([
  'Run 5K continuously',
  'Build a consistent running habit',
  'Improve cardiovascular fitness',
], null, 2);

export default function ProgramsPage() {
  const { ready } = useManageAuth();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState(false);

  // JSON fields managed outside react-hook-form
  const [timelineOptionsJson, setTimelineOptionsJson] = useState(DEFAULT_TIMELINE_OPTIONS);
  const [outcomesJson, setOutcomesJson] = useState(DEFAULT_OUTCOMES);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const form = useForm<ProgramForm>({ resolver: zodResolver(programSchema) });

  async function load() {
    setLoading(true);
    try {
      setPrograms(await listPrograms());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (ready) load(); }, [ready]);

  function openCreate() {
    setEditing(null);
    setTimelineOptionsJson(DEFAULT_TIMELINE_OPTIONS);
    setOutcomesJson(DEFAULT_OUTCOMES);
    setJsonError(null);
    form.reset({
      slug: '',
      title: '',
      description: '',
      long_description: '',
      category: 'beginner',
      difficulty: 'beginner',
      icon: '',
      cover_image_url: '',
      default_sessions_per_week: 3,
      sort_order: 0,
      status: 'draft',
    });
    setDialogOpen(true);
  }

  function openEdit(p: Program) {
    setEditing(p);
    setTimelineOptionsJson(JSON.stringify(p.timeline_options, null, 2));
    setOutcomesJson(JSON.stringify(p.expected_outcomes || [], null, 2));
    setJsonError(null);
    form.reset({
      slug: p.slug,
      title: p.title,
      description: p.description ?? '',
      long_description: p.long_description ?? '',
      category: p.category,
      difficulty: p.difficulty,
      icon: p.icon ?? '',
      cover_image_url: p.cover_image_url ?? '',
      default_sessions_per_week: p.default_sessions_per_week,
      sort_order: p.sort_order,
      status: p.status,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: ProgramForm) {
    setJsonError(null);
    let timeline_options, expected_outcomes;
    try {
      timeline_options = JSON.parse(timelineOptionsJson);
    } catch {
      setJsonError('Timeline options: invalid JSON');
      return;
    }
    try {
      expected_outcomes = JSON.parse(outcomesJson);
    } catch {
      setJsonError('Expected outcomes: invalid JSON');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...values,
        timeline_options,
        expected_outcomes,
        cover_image_url: values.cover_image_url || null,
        icon: values.icon || null,
      };
      if (editing) {
        await updateProgram(editing.id, payload);
        toast({ title: 'Program updated' });
      } else {
        await createProgram(payload as Omit<Program, 'id' | 'created_at'>);
        toast({ title: 'Program created' });
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
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProgram(deleteTarget.id);
      toast({ title: 'Program deleted' });
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] ?? 'bg-gray-100'}`}>
        {s}
      </span>
    );
  };

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Programs</h1>
          <Button onClick={openCreate}>+ New Program</Button>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sessions/wk</TableHead>
                <TableHead>Sort</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{p.slug}</TableCell>
                  <TableCell className="capitalize">{p.difficulty}</TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell>{p.default_sessions_per_week}</TableCell>
                  <TableCell>{p.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/manage/program-missions?id=${p.id}`}>
                        <Button variant="outline" size="sm">Sessions</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(p)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No programs yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Program' : 'New Program'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl><Input {...field} placeholder="couch-to-5k" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="long_description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Description</FormLabel>
                  <FormControl><Textarea rows={4} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="endurance">Endurance</SelectItem>
                        <SelectItem value="speed">Speed</SelectItem>
                        <SelectItem value="strength">Strength</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="difficulty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="default_sessions_per_week" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Sessions/wk</FormLabel>
                    <FormControl><Input type="number" min={1} max={7} {...field} /></FormControl>
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
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="cover_image_url" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="space-y-1">
                <label className="text-sm font-medium">Timeline Options (JSON)</label>
                <Textarea
                  rows={6}
                  className="font-mono text-xs"
                  value={timelineOptionsJson}
                  onChange={(e) => setTimelineOptionsJson(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Array of {'{ weeks, label, sessionsPerWeek }'}</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Expected Outcomes (JSON)</label>
                <Textarea
                  rows={4}
                  className="font-mono text-xs"
                  value={outcomesJson}
                  onChange={(e) => setOutcomesJson(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Array of strings</p>
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
            <AlertDialogTitle>Delete program?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; and all its sessions will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManageLayout>
  );
}
