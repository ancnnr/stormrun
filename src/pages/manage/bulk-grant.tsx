import { useEffect, useState, useCallback } from 'react';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { useManageAuth } from '@/hooks/useManageAuth';
import { apiFetch } from '@/lib/manageApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  rarity: string;
}

interface UserRow {
  id: string;
  username: string;
  role: string;
}

export default function BulkGrantPage() {
  const { ready } = useManageAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('1');

  // User search
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<UserRow[]>([]);
  const [searching, setSearching] = useState(false);

  // Selected users for grant
  const [selectedUsers, setSelectedUsers] = useState<UserRow[]>([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    apiFetch<CatalogItem[]>('/api/admin/items')
      .then(setItems)
      .catch(() => toast({ title: 'Error loading items', variant: 'destructive' }));
  }, [ready, toast]);

  const searchUsers = useCallback(async () => {
    if (!searchInput.trim()) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ search: searchInput.trim(), limit: '20' });
      const data = await apiFetch<{ users: UserRow[] }>(`/api/admin/users?${params}`);
      setSearchResults(data.users);
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Search failed', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  }, [searchInput, toast]);

  function toggleUser(user: UserRow) {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  }

  function removeSelected(id: string) {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function confirmGrant() {
    setGranting(true);
    try {
      const result = await apiFetch<{ granted: number; newGrants: number; updated: number }>(
        '/api/admin/bulk-grant',
        {
          method: 'POST',
          body: JSON.stringify({
            user_ids: selectedUsers.map((u) => u.id),
            item_id: selectedItemId,
            quantity: parseInt(quantity, 10) || 1,
          }),
        }
      );
      toast({
        title: 'Grant complete',
        description: `Granted to ${result.granted} users (${result.newGrants} new, ${result.updated} updated).`,
      });
      setConfirmOpen(false);
      setSelectedUsers([]);
      setSelectedItemId('');
      setQuantity('1');
      setSearchResults([]);
      setSearchInput('');
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Bulk grant failed', variant: 'destructive' });
    } finally {
      setGranting(false);
    }
  }

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const canGrant = selectedItemId && selectedUsers.length > 0 && parseInt(quantity, 10) > 0;

  if (!ready) return null;

  return (
    <ManageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bulk Item Grant</h1>
        <p className="text-sm text-muted-foreground mt-1">Grant an item to multiple users at once. Existing quantities are incremented.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: item + user search */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Item to Grant</label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item…" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                    <span className="ml-2 text-xs text-muted-foreground">({item.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Search Users</label>
            <div className="flex gap-2">
              <Input
                placeholder="Username…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button variant="outline" onClick={searchUsers} disabled={searching}>
                {searching ? 'Searching…' : 'Search'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="rounded-md border divide-y max-h-52 overflow-y-auto">
                {searchResults.map((u) => {
                  const alreadySelected = selectedUsers.some((s) => s.id === u.id);
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 ${alreadySelected ? 'opacity-50' : ''}`}
                      onClick={() => toggleUser(u)}
                    >
                      <span className="font-medium">{u.username}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{u.role}</Badge>
                        {alreadySelected ? (
                          <span className="text-xs text-primary">✓ Added</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">+ Add</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: selected users preview */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium mb-2">
              Selected Users ({selectedUsers.length})
            </h2>
            {selectedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-md border border-dashed p-6 text-center">
                Search for users and click to add them.
              </p>
            ) : (
              <div className="rounded-md border divide-y max-h-64 overflow-y-auto">
                {selectedUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">{u.username}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => removeSelected(u.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedUsers.length > 0 && selectedItem && (
            <div className="rounded-md border bg-muted/30 p-4 text-sm space-y-1">
              <p className="font-medium">Grant Preview</p>
              <p className="text-muted-foreground">
                <strong>{quantity}× {selectedItem.name}</strong> ({selectedItem.category})
              </p>
              <p className="text-muted-foreground">
                → {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!canGrant}
            onClick={() => setConfirmOpen(true)}
          >
            Grant to {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      {/* Recent grants table placeholder */}
      {selectedUsers.length === 0 && !selectedItemId && (
        <div className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step</TableHead>
                <TableHead>Instructions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ['1', 'Select an item from the dropdown on the left.'],
                ['2', 'Set the quantity to grant per user.'],
                ['3', 'Search for users by username and click to add them.'],
                ['4', 'Review the preview, then click Grant.'],
              ].map(([step, text]) => (
                <TableRow key={step}>
                  <TableCell className="font-medium w-12">{step}</TableCell>
                  <TableCell className="text-muted-foreground">{text}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Grant</AlertDialogTitle>
            <AlertDialogDescription>
              This will grant <strong>{quantity}× {selectedItem?.name}</strong> to{' '}
              <strong>{selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}</strong>.
              Existing quantities will be incremented. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGrant} disabled={granting}>
              {granting ? 'Granting…' : 'Confirm Grant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManageLayout>
  );
}
