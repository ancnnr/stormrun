import { useEffect, useState } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Item {
  id: string;
  name: string;
  category: 'equipment' | 'consumable';
  description: string | null;
  icon: string | null;
  rarity: string;
  effects: Record<string, unknown>;
  max_stack: number | null;
  unlock_requirement: string | null;
  sort_order: number;
  created_at: string;
}

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  uncommon: 'bg-green-500/20 text-green-400 border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

interface ItemFormState {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  rarity: string;
  effects: string;
  max_stack: string;
  unlock_requirement: string;
  sort_order: string;
}

const defaultForm: ItemFormState = {
  id: '',
  name: '',
  category: 'equipment',
  description: '',
  icon: '',
  rarity: 'common',
  effects: '{}',
  max_stack: '',
  unlock_requirement: '',
  sort_order: '0',
};

export default function ItemsPage() {
  const { ready } = useManageAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [formState, setFormState] = useState<ItemFormState>(defaultForm);
  const [effectsError, setEffectsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Item[]>('/api/admin/items');
      setItems(data);
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load items', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  function openCreate() {
    setEditing(null);
    setFormState(defaultForm);
    setEffectsError(null);
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setFormState({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description ?? '',
      icon: item.icon ?? '',
      rarity: item.rarity,
      effects: JSON.stringify(item.effects ?? {}, null, 2),
      max_stack: item.max_stack != null ? String(item.max_stack) : '',
      unlock_requirement: item.unlock_requirement ?? '',
      sort_order: String(item.sort_order),
    });
    setEffectsError(null);
    setDialogOpen(true);
  }

  function updateField(field: keyof ItemFormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (field === 'effects') setEffectsError(null);
  }

  async function handleSave() {
    let parsedEffects: unknown;
    try {
      parsedEffects = JSON.parse(formState.effects || '{}');
    } catch {
      setEffectsError('Invalid JSON in effects field');
      return;
    }

    if (!formState.id.trim() || !formState.name.trim()) {
      toast({ title: 'Validation', description: 'ID and Name are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: formState.id.trim(),
        name: formState.name.trim(),
        category: formState.category,
        description: formState.description || null,
        icon: formState.icon || null,
        rarity: formState.rarity,
        effects: parsedEffects,
        max_stack: formState.max_stack ? parseInt(formState.max_stack, 10) : null,
        unlock_requirement: formState.unlock_requirement || null,
        sort_order: parseInt(formState.sort_order || '0', 10),
      };

      if (editing) {
        await apiFetch(`/api/admin/items/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast({ title: 'Item updated' });
      } else {
        await apiFetch('/api/admin/items', { method: 'POST', body: JSON.stringify(payload) });
        toast({ title: 'Item created' });
      }
      setDialogOpen(false);
      load();
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/items/${deleteTarget.id}`, { method: 'DELETE' });
      toast({ title: 'Item deleted', description: deleteTarget.name });
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Delete failed', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Item Catalog</h1>
        <Button onClick={openCreate}>+ Create Item</Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rarity</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{item.category}</Badge>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${RARITY_COLORS[item.rarity] ?? RARITY_COLORS.common}`}>
                    {item.rarity}
                  </span>
                </TableCell>
                <TableCell>{item.sort_order}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(item)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No items yet. Run <code className="text-xs bg-muted px-1 py-0.5 rounded">python scripts/seed_items.py</code> to seed defaults.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit: ${editing.name}` : 'Create Item'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">ID (slug) *</label>
              <Input
                value={formState.id}
                onChange={(e) => updateField('id', e.target.value)}
                disabled={!!editing}
                placeholder="e.g. health_kit"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Name *</label>
              <Input value={formState.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Category</label>
              <Select value={formState.category} onValueChange={(v) => updateField('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="consumable">Consumable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Rarity</label>
              <Select value={formState.rarity} onValueChange={(v) => updateField('rarity', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RARITIES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Icon (Ionicon name)</label>
              <Input value={formState.icon} onChange={(e) => updateField('icon', e.target.value)} placeholder="e.g. heart-outline" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Max Stack {formState.category === 'equipment' ? '(equipment — leave blank)' : ''}
              </label>
              <Input
                type="number"
                value={formState.max_stack}
                onChange={(e) => updateField('max_stack', e.target.value)}
                disabled={formState.category === 'equipment'}
                placeholder={formState.category === 'equipment' ? 'N/A' : 'e.g. 5'}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Sort Order</label>
              <Input type="number" value={formState.sort_order} onChange={(e) => updateField('sort_order', e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Unlock Requirement</label>
              <Input value={formState.unlock_requirement} onChange={(e) => updateField('unlock_requirement', e.target.value)} placeholder="Optional" />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formState.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">
                Effects (JSON)
                {formState.category === 'equipment' && (
                  <span className="ml-2 text-xs text-muted-foreground">keys: healthBonus, staminaBonus, hazardReduction, damageReduction, detectionRange</span>
                )}
                {formState.category === 'consumable' && (
                  <span className="ml-2 text-xs text-muted-foreground">keys: type (health|stamina|protection|utility), value, duration</span>
                )}
              </label>
              <textarea
                value={formState.effects}
                onChange={(e) => updateField('effects', e.target.value)}
                rows={4}
                className={`w-full rounded-md border bg-background px-3 py-2 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${effectsError ? 'border-destructive' : 'border-input'}`}
              />
              {effectsError && <p className="text-xs text-destructive">{effectsError}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.name}&quot; and remove it from all user inventories. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManageLayout>
  );
}
