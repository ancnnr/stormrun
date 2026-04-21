---
name: stormrun-patterns
description: Coding patterns extracted from the StormRun admin dashboard (Next.js Pages Router + Supabase)
version: 1.0.0
source: local-git-analysis
analyzed_commits: session-history
---

# StormRun Admin Dashboard Patterns

## Tech Stack

- **Framework**: Next.js 14 (Pages Router — NOT App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (auto-generated types)
- **Toasts**: `sonner` / `useToast` from `@/components/ui/use-toast`
- **Icons**: `lucide-react`

## Project Structure

```
src/
├── pages/
│   ├── manage/          # Admin CRUD pages (one file per entity)
│   │   ├── missions.tsx
│   │   ├── programs.tsx
│   │   ├── items.tsx
│   │   └── ...
│   └── _app.tsx
├── components/
│   ├── manage/          # Admin-specific components
│   │   ├── ManageLayout.tsx
│   │   └── RunMap.tsx
│   └── ui/              # shadcn/ui components (do not modify)
├── hooks/
│   └── useManageAuth.ts # Session auth hook
├── lib/
│   ├── manageApi.ts     # All API calls
│   └── utils.ts
└── types/
    ├── database.types.ts  # Auto-generated from Supabase (DO NOT edit manually)
    └── index.ts           # Re-exports and Row/Insert/Update type aliases
```

## Authentication Pattern

Every admin page starts with:

```tsx
export default function SomePage() {
  const { ready } = useManageAuth();
  // ...
  if (!ready) return null; // or a loader
  return <ManageLayout>...</ManageLayout>;
}
```

`useManageAuth()` checks `sessionStorage.sr_token`. If missing, redirects to `/manage`.

All API calls pass the token automatically via `apiFetch()`.

## API Call Pattern

Use `apiFetch<T>()` from `@/lib/manageApi` for all admin API calls:

```ts
// GET
const data = await apiFetch<Mission[]>('/api/admin/missions');

// POST
const created = await apiFetch<Mission>('/api/admin/missions', {
  method: 'POST',
  body: JSON.stringify(payload),
});

// PATCH
await apiFetch<Mission>(`/api/admin/missions/${id}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});

// DELETE
await apiFetch<void>(`/api/admin/missions/${id}`, { method: 'DELETE' });
```

`apiFetch` automatically:
- Attaches `Authorization: Bearer <token>` from `sessionStorage.sr_token`
- Sets `Content-Type: application/json`
- Throws on `!body.success`
- Redirects to `/manage` on 401/403

## Type Pattern

Types are derived from Supabase auto-generated types. Never define entity types manually:

```ts
// types/index.ts — the single source of truth
import type { Database } from './database.types'
type Tables = Database['public']['Tables']

export type Mission = Tables['missions']['Row']
export type MissionInsert = Tables['missions']['Insert']
export type MissionUpdate = Tables['missions']['Update']
```

Import in pages:
```ts
import type { Mission } from '@/types';
```

To regenerate types after schema changes:
```bash
pnpm db:types
```

## Domain Constants

Defined as `const` arrays with `as const` at the top of the relevant page file:

```ts
const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const MISSION_STATUSES = ['draft', 'active', 'archived'] as const;
const LOCOMOTION_TYPES = ['run', 'walk', 'walk_run'] as const;
```

These are also used as Zod enum sources:
```ts
z.enum(DIFFICULTY_LEVELS)
z.enum(LOCOMOTION_TYPES).nullable().default(null)
```

## Form Pattern (CRUD Pages)

All admin forms use React Hook Form + Zod:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  difficulty: z.enum(DIFFICULTY_LEVELS, { required_error: 'Difficulty required' }),
  status: z.enum(MISSION_STATUSES).default('draft'),
  sort_order: z.coerce.number().default(0),
});
type FormData = z.infer<typeof schema>;

// In component:
const form = useForm<FormData>({ resolver: zodResolver(schema) });
```

Form fields use the shadcn/ui `Form` components:
```tsx
<Form {...form}>
  <FormField
    control={form.control}
    name="title"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Title</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

For `<Select>` in forms:
```tsx
<FormField
  control={form.control}
  name="difficulty"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Difficulty</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger><SelectValue /></SelectTrigger>
        </FormControl>
        <SelectContent>
          {DIFFICULTY_LEVELS.map(d => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

## CRUD Page Structure

Each manage page follows this pattern:

1. **State**: `items`, `loading`, `error`, `dialogOpen`, `editing` (null = create, item = edit)
2. **Load on mount**: `useEffect` → `apiFetch` → `setItems`
3. **Table display**: shadcn/ui `Table` with columns for key fields + action buttons
4. **Create/Edit Dialog**: shadcn/ui `Dialog` with React Hook Form inside
5. **Delete Confirmation**: shadcn/ui `AlertDialog`
6. **Toast on success/error**: `useToast()` or `sonner`

## Status Badge Pattern

```tsx
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

// Usage in table cell:
<span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[item.status] ?? ''}`}>
  {item.status}
</span>
```

## Navigation

Admin nav links are defined in `ManageLayout.tsx`. To add a new page, add an entry to the `navLinks` array there:

```ts
{ href: '/manage/new-section', label: 'New Section' },
```

## Adding a New Manage Page

1. Create `src/pages/manage/new-entity.tsx`
2. Follow the CRUD page structure above
3. Add API functions to `src/lib/manageApi.ts`
4. Add type exports to `src/types/index.ts` (derived from `database.types.ts`)
5. Add nav link in `src/components/manage/ManageLayout.tsx`

## Key Domain Entities

| Entity | Key Fields |
|--------|-----------|
| Mission | `title`, `difficulty` (beginner/intermediate/advanced/expert), `locomotion_type` (run/walk/walk_run), `status` (draft/active/archived), `is_priority`, `sort_order`, rewards (xp/gold/territory/loot) |
| Program | `title`, `description`, `timeline_weeks`, `status` |
| ProgramMission | join table — `program_id`, `mission_id`, `week_number`, `day_number`, `order_in_day` |
| Item | catalog items with `category`, `rarity`, `stats` |
| EncouragementAudio | audio clips keyed by `event_type` |

## Loot Config Structure

```ts
type LootMode = 'specific' | 'random';
type LootRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface LootConfig {
  mode: LootMode;
  items?: { id: string; quantity: number }[];     // specific mode
  weights?: Partial<Record<LootRarity, number>>;  // random mode
  types?: string[];                               // random mode item type filter
}
```

Mission rewards use `loot: LootConfig | LootEntry[]` (legacy arrays still exist on some rows).
