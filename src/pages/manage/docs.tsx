import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useManageAuth } from '@/hooks/useManageAuth';
import { ChevronLeft, X } from 'lucide-react';

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const LightboxContext = createContext<(src: string) => void>(() => {});

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={src}
        alt=""
        className="max-h-[90vh] max-w-[90vw] rounded-md shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Nav structure ────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: 'Mobile App',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'boot-login', label: 'Boot & Login' },
      { id: 'onboarding', label: 'Onboarding' },
      { id: 'mission-hub', label: 'Mission Hub' },
      { id: 'map', label: 'Map' },
      { id: 'prep-bay', label: 'Prep Bay' },
      { id: 'community', label: 'Community' },
      { id: 'profile', label: 'Profile' },
      { id: 'programs', label: 'Programs' },
      { id: 'run', label: 'Run Experience' },
    ],
  },
  {
    label: 'Admin Portal',
    items: [
      { id: 'admin-overview', label: 'Overview' },
      { id: 'admin-dashboard', label: 'Dashboard' },
      { id: 'admin-missions', label: 'Missions' },
      { id: 'admin-programs', label: 'Programs' },
      { id: 'admin-users', label: 'Users' },
      { id: 'admin-items', label: 'Items' },
      { id: 'admin-encouragement', label: 'Encouragement Audio' },
      { id: 'admin-bulk-grant', label: 'Bulk Grant' },
      { id: 'admin-analytics', label: 'Geo Analytics' },
    ],
  },
];

// ─── Reusable layout atoms ────────────────────────────────────────────────────

function PhoneFrame({ src, caption }: { src: string; caption?: string }) {
  const openLightbox = useContext(LightboxContext);
  return (
    <figure className="flex flex-col items-center gap-2 flex-shrink-0">
      <div
        onClick={() => openLightbox(src)}
        style={{
          border: '8px solid #18181b',
          borderRadius: 36,
          overflow: 'hidden',
          boxShadow: '0 0 0 2px #3f3f46, 0 16px 48px rgba(0,0,0,0.25)',
          background: '#000',
          width: 160,
          cursor: 'zoom-in',
        }}
      >
        <img
          src={src}
          alt={caption ?? ''}
          loading="lazy"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground text-center max-w-[160px]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function BrowserFrame({ src, caption }: { src: string; caption?: string }) {
  const openLightbox = useContext(LightboxContext);
  return (
    <figure className="flex flex-col gap-2 flex-shrink-0 w-full">
      <div
        style={{
          border: '1px solid hsl(var(--border))',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          cursor: 'zoom-in',
        }}
        onClick={() => openLightbox(src)}
      >
        <div
          style={{
            background: '#f4f4f5',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderBottom: '1px solid #e4e4e7',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span
            style={{
              flex: 1,
              marginLeft: 8,
              background: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 11,
              color: '#71717a',
            }}
          >
            StormRun Admin
          </span>
        </div>
        <img
          src={src}
          alt={caption ?? ''}
          loading="lazy"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}

function PhoneGallery({ items }: { items: { src: string; caption?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-6 my-6">
      {items.map((it) => (
        <PhoneFrame key={it.src} src={it.src} caption={it.caption} />
      ))}
    </div>
  );
}

function AdminGallery({ items }: { items: { src: string; caption?: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 my-6 lg:grid-cols-2">
      {items.map((it) => (
        <BrowserFrame key={it.src} src={it.src} caption={it.caption} />
      ))}
    </div>
  );
}

function AdminGalleryWide({ items }: { items: { src: string; caption?: string }[] }) {
  return (
    <div className="flex flex-col gap-6 my-6">
      {items.map((it) => (
        <BrowserFrame key={it.src} src={it.src} caption={it.caption} />
      ))}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
      {children}
    </p>
  );
}

function KvTable({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <table className="w-full text-sm border-collapse my-4">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i} className="border-t border-border">
            <td className="py-2 pr-4 font-medium text-foreground align-top w-44 whitespace-nowrap">{k}</td>
            <td className="py-2 text-muted-foreground">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Callout({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warn' }) {
  const colors = variant === 'warn'
    ? 'bg-amber-50 border-amber-300 text-amber-900'
    : 'bg-blue-50 border-blue-300 text-blue-900';
  return (
    <div className={`border rounded-md px-4 py-3 text-sm my-4 ${colors}`}>
      {children}
    </div>
  );
}

function DocSection({ id, kicker, title, children }: {
  id: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} data-section={id} className="mb-16 scroll-mt-8">
      <Kicker>{kicker}</Kicker>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

// ─── Hex territory SVG components ────────────────────────────────────────────

function HexTerritoryMap() {
  // Pointy-top hexagons, r=20, w=34.64, dy=30
  // 4x4 grid starting at (55,40), 280x220 viewbox
  // Owned: r0c0, r0c1, r0c2, r1c0, r1c1, r1c2, r2c1, r2c2 (central cluster)
  // Frontier: r0c3, r1c3, r2c0, r2c3, r3c1, r3c2
  return (
    <div style={{
      display: 'inline-block',
      border: '1px solid rgba(0,255,136,0.2)',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#161B2E',
    }}>
      <svg width="280" height="220" viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="280" height="220" fill="#161B2E"/>
        {/* Frontier hexes (dim green) */}
        <polygon points="176.2,30.0 176.2,50.0 158.9,60.0 141.6,50.0 141.6,30.0 158.9,20.0"
          fill="rgba(0,255,136,0.05)" stroke="rgba(0,255,136,0.3)" strokeWidth="1"/>
        <polygon points="193.5,60.0 193.5,80.0 176.2,90.0 158.9,80.0 158.9,60.0 176.2,50.0"
          fill="rgba(0,255,136,0.05)" stroke="rgba(0,255,136,0.3)" strokeWidth="1"/>
        <polygon points="72.3,90.0 72.3,110.0 55.0,120.0 37.7,110.0 37.7,90.0 55.0,80.0"
          fill="rgba(0,255,136,0.05)" stroke="rgba(0,255,136,0.3)" strokeWidth="1"/>
        <polygon points="176.2,90.0 176.2,110.0 158.9,120.0 141.6,110.0 141.6,90.0 158.9,80.0"
          fill="rgba(0,255,136,0.05)" stroke="rgba(0,255,136,0.3)" strokeWidth="1"/>
        <polygon points="124.3,120.0 124.3,140.0 107.0,150.0 89.7,140.0 89.7,120.0 107.0,110.0"
          fill="rgba(0,255,136,0.05)" stroke="rgba(0,255,136,0.3)" strokeWidth="1"/>
        <polygon points="158.9,120.0 158.9,140.0 141.6,150.0 124.3,140.0 124.3,120.0 141.6,110.0"
          fill="rgba(0,255,136,0.05)" stroke="rgba(0,255,136,0.3)" strokeWidth="1"/>
        {/* Owned hexes (green) */}
        <polygon points="72.3,30.0 72.3,50.0 55.0,60.0 37.7,50.0 37.7,30.0 55.0,20.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="106.9,30.0 106.9,50.0 89.6,60.0 72.3,50.0 72.3,30.0 89.6,20.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="141.6,30.0 141.6,50.0 124.3,60.0 107.0,50.0 107.0,30.0 124.3,20.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="89.6,60.0 89.6,80.0 72.3,90.0 55.0,80.0 55.0,60.0 72.3,50.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="124.3,60.0 124.3,80.0 107.0,90.0 89.7,80.0 89.7,60.0 107.0,50.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="158.9,60.0 158.9,80.0 141.6,90.0 124.3,80.0 124.3,60.0 141.6,50.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="106.9,90.0 106.9,110.0 89.6,120.0 72.3,110.0 72.3,90.0 89.6,80.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="141.6,90.0 141.6,110.0 124.3,120.0 107.0,110.0 107.0,90.0 124.3,80.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        {/* User position (cyan pulse dot) */}
        <circle cx="107" cy="70" r="10" fill="rgba(0,217,255,0.15)"/>
        <circle cx="107" cy="70" r="5" fill="#00D9FF"/>
        <circle cx="107" cy="70" r="3" fill="#fff"/>
        {/* Shelter pin (green house) */}
        <g transform="translate(55,87)">
          <circle r="10" fill="rgba(0,255,136,0.3)" stroke="#00FF88" strokeWidth="1.5"/>
          <text x="0" y="4" textAnchor="middle" fill="#00FF88" fontSize="10" fontWeight="bold">⌂</text>
        </g>
        {/* Labels */}
        <text x="10" y="210" fill="rgba(0,255,136,0.6)" fontSize="9" fontFamily="monospace">OWNED TERRITORY</text>
        <text x="170" y="210" fill="rgba(0,255,136,0.3)" fontSize="9" fontFamily="monospace">FRONTIER</text>
      </svg>
    </div>
  );
}

function FriendTerritoryMap() {
  // User cluster (green, left side), Friend cluster (purple, right side)
  // Both use r=20 hexes, 280x220 viewbox
  return (
    <div style={{
      display: 'inline-block',
      border: '1px solid rgba(139,92,246,0.25)',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#161B2E',
    }}>
      <svg width="280" height="220" viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="280" height="220" fill="#161B2E"/>
        {/* User hexes (green) */}
        <polygon points="87.3,50.0 87.3,70.0 70.0,80.0 52.7,70.0 52.7,50.0 70.0,40.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="87.3,80.0 87.3,100.0 70.0,110.0 52.7,100.0 52.7,80.0 70.0,70.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="122.3,80.0 122.3,100.0 105.0,110.0 87.7,100.0 87.7,80.0 105.0,70.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="104.3,110.0 104.3,130.0 87.0,140.0 69.7,130.0 69.7,110.0 87.0,100.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="139.3,110.0 139.3,130.0 122.0,140.0 104.7,130.0 104.7,110.0 122.0,100.0"
          fill="rgba(0,255,136,0.25)" stroke="#00FF88" strokeWidth="1.5"/>
        {/* Friend hexes (purple) */}
        <polygon points="177.3,70.0 177.3,90.0 160.0,100.0 142.7,90.0 142.7,70.0 160.0,60.0"
          fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5"/>
        <polygon points="212.3,70.0 212.3,90.0 195.0,100.0 177.7,90.0 177.7,70.0 195.0,60.0"
          fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5"/>
        <polygon points="212.3,40.0 212.3,60.0 195.0,70.0 177.7,60.0 177.7,40.0 195.0,30.0"
          fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5"/>
        <polygon points="194.3,100.0 194.3,120.0 177.0,130.0 159.7,120.0 159.7,100.0 177.0,90.0"
          fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5"/>
        <polygon points="177.3,100.0 177.3,120.0 160.0,130.0 142.7,120.0 142.7,100.0 160.0,90.0"
          fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5"/>
        {/* Friend initials pin (purple circle) */}
        <circle cx="195" cy="80" r="14" fill="rgba(139,92,246,0.5)" stroke="rgba(139,92,246,0.8)" strokeWidth="1.5"/>
        <text x="195" y="85" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="monospace">SR</text>
        {/* User position (cyan dot) */}
        <circle cx="88" cy="90" r="9" fill="rgba(0,217,255,0.15)"/>
        <circle cx="88" cy="90" r="5" fill="#00D9FF"/>
        <circle cx="88" cy="90" r="3" fill="#fff"/>
        {/* User shelter pin */}
        <g transform="translate(70,125)">
          <circle r="10" fill="rgba(0,255,136,0.3)" stroke="#00FF88" strokeWidth="1.5"/>
          <text x="0" y="4" textAnchor="middle" fill="#00FF88" fontSize="10" fontWeight="bold">⌂</text>
        </g>
        {/* Labels */}
        <text x="30" y="185" fill="rgba(0,255,136,0.6)" fontSize="9" fontFamily="monospace">YOUR TERRITORY</text>
        <text x="148" y="185" fill="rgba(139,92,246,0.7)" fontSize="9" fontFamily="monospace">FRIEND TERRITORY</text>
      </svg>
    </div>
  );
}

function TerritoryRewardCard() {
  // Phone-screen card, 180x260, showing post-run territory reward UI
  // 4 hexes in 2x2 arrangement, r=20, centered
  return (
    <div style={{
      display: 'inline-block',
      border: '1px solid rgba(0,255,136,0.2)',
      borderRadius: 16,
      overflow: 'hidden',
      background: '#161B2E',
      boxShadow: '0 0 0 1px #1e2540, 0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <svg width="180" height="260" viewBox="0 0 180 260" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="260" rx="16" fill="#161B2E"/>
        {/* Card inner bg */}
        <rect x="14" y="14" width="152" height="232" rx="10" fill="#1A2040" stroke="rgba(0,255,136,0.15)" strokeWidth="1"/>
        {/* Title */}
        <text x="90" y="48" textAnchor="middle" fill="rgba(0,255,136,0.8)" fontSize="10" fontWeight="700"
          fontFamily="monospace" letterSpacing="3">TERRITORY CLAIMED</text>
        {/* Divider */}
        <line x1="30" y1="56" x2="150" y2="56" stroke="rgba(0,255,136,0.2)" strokeWidth="1"/>
        {/* 4 hexes in 2x2 cluster, r=20, centered at ~(90, 130) */}
        {/* row0: (72.7, 115) and (107.3, 115) */}
        {/* row1: (90, 145) and (124.6, 145) — shifted to center: use (72.7,115),(107.3,115),(90,145),(72.7+34.6,145) */}
        {/* Centering: cluster spans ~from x=52 to x=145, y=95 to y=165. Center at ~90,130. Shift: */}
        {/* Use cx offsets: left col = 73, right col = 107; rows y = 110 and 140 */}
        <polygon points="90.0,100.0 90.0,120.0 72.7,130.0 55.4,120.0 55.4,100.0 72.7,90.0"
          fill="rgba(0,255,136,0.35)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="124.6,100.0 124.6,120.0 107.3,130.0 90.0,120.0 90.0,100.0 107.3,90.0"
          fill="rgba(0,255,136,0.35)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="107.3,130.0 107.3,150.0 90.0,160.0 72.7,150.0 72.7,130.0 90.0,120.0"
          fill="rgba(0,255,136,0.35)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="142.0,130.0 142.0,150.0 124.7,160.0 107.3,150.0 107.3,130.0 124.7,120.0"
          fill="rgba(0,255,136,0.35)" stroke="#00FF88" strokeWidth="1.5"/>
        {/* Hex count */}
        <text x="90" y="193" textAnchor="middle" fill="#00FF88" fontSize="28" fontWeight="700" fontFamily="monospace">+8</text>
        <text x="90" y="208" textAnchor="middle" fill="#00FF88" fontSize="11" fontFamily="monospace">hexes</text>
        {/* km² secured */}
        <text x="90" y="232" textAnchor="middle" fill="#8B94A8" fontSize="10" fontFamily="monospace">0.84 km² secured</text>
      </svg>
    </div>
  );
}

function RoutePreviewWithHexes() {
  // 280x200, route from bottom-left to top-right, hex cells overlaid
  // Route hexes r=16, owned along route, frontier surrounding
  return (
    <div style={{
      display: 'inline-block',
      border: '1px solid rgba(0,255,136,0.2)',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#161B2E',
    }}>
      <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="280" height="200" fill="#161B2E"/>
        {/* Subtle grid lines */}
        <line x1="0" y1="100" x2="280" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
        <line x1="140" y1="0" x2="140" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
        {/* Frontier hexes (dim green) */}
        <polygon points="85.9,107.0 85.9,123.0 72.0,131.0 58.1,123.0 58.1,107.0 72.0,99.0"
          fill="rgba(0,255,136,0.04)" stroke="rgba(0,255,136,0.25)" strokeWidth="1"/>
        <polygon points="58.9,127.0 58.9,143.0 45.0,151.0 31.1,143.0 31.1,127.0 45.0,119.0"
          fill="rgba(0,255,136,0.04)" stroke="rgba(0,255,136,0.25)" strokeWidth="1"/>
        <polygon points="143.9,77.0 143.9,93.0 130.0,101.0 116.1,93.0 116.1,77.0 130.0,69.0"
          fill="rgba(0,255,136,0.04)" stroke="rgba(0,255,136,0.25)" strokeWidth="1"/>
        <polygon points="171.9,57.0 171.9,73.0 158.0,81.0 144.1,73.0 144.1,57.0 158.0,49.0"
          fill="rgba(0,255,136,0.04)" stroke="rgba(0,255,136,0.25)" strokeWidth="1"/>
        <polygon points="228.9,27.0 228.9,43.0 215.0,51.0 201.1,43.0 201.1,27.0 215.0,19.0"
          fill="rgba(0,255,136,0.04)" stroke="rgba(0,255,136,0.25)" strokeWidth="1"/>
        {/* Owned hexes along route */}
        <polygon points="73.9,142.0 73.9,158.0 60.0,166.0 46.1,158.0 46.1,142.0 60.0,134.0"
          fill="rgba(0,255,136,0.22)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="101.9,122.0 101.9,138.0 88.0,146.0 74.1,138.0 74.1,122.0 88.0,114.0"
          fill="rgba(0,255,136,0.22)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="129.9,112.0 129.9,128.0 116.0,136.0 102.1,128.0 102.1,112.0 116.0,104.0"
          fill="rgba(0,255,136,0.22)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="157.9,92.0 157.9,108.0 144.0,116.0 130.1,108.0 130.1,92.0 144.0,84.0"
          fill="rgba(0,255,136,0.22)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="185.9,72.0 185.9,88.0 172.0,96.0 158.1,88.0 158.1,72.0 172.0,64.0"
          fill="rgba(0,255,136,0.22)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="213.9,57.0 213.9,73.0 200.0,81.0 186.1,73.0 186.1,57.0 200.0,49.0"
          fill="rgba(0,255,136,0.22)" stroke="#00FF88" strokeWidth="1.5"/>
        <polygon points="241.9,42.0 241.9,58.0 228.0,66.0 214.1,58.0 214.1,42.0 228.0,34.0"
          fill="rgba(0,255,136,0.22)" stroke="#00FF88" strokeWidth="1.5"/>
        {/* Route line (cyan, wavy) */}
        <path d="M40,170 C55,155 75,145 88,130 C102,114 115,108 130,98 C145,87 158,78 172,68 C186,57 200,52 228,40"
          stroke="#00D9FF" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
        {/* Start dot */}
        <circle cx="40" cy="170" r="7" fill="rgba(0,217,255,0.2)"/>
        <circle cx="40" cy="170" r="4" fill="#00D9FF"/>
        {/* End marker */}
        <circle cx="228" cy="40" r="5" fill="none" stroke="#00D9FF" strokeWidth="2"/>
        {/* Labels */}
        <text x="10" y="192" fill="rgba(0,255,136,0.5)" fontSize="8" fontFamily="monospace">EXISTING TERRITORY</text>
        <text x="175" y="192" fill="rgba(0,255,136,0.3)" fontSize="8" fontFamily="monospace">FRONTIER</text>
      </svg>
    </div>
  );
}

// ─── Route type diagrams ──────────────────────────────────────────────────────

function RouteTypeDiagrams() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
      {/* Loop */}
      <div style={{ textAlign: 'center' as const }}>
        <svg width="180" height="160" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="180" rx="8" fill="#161B2E"/>
          <ellipse cx="100" cy="88" rx="65" ry="45" stroke="#00D9FF" strokeWidth="2.5"/>
          <polygon points="148,55 160,49 154,62" fill="#00D9FF"/>
          <circle cx="100" cy="133" r="6" fill="#00D9FF"/>
          <circle cx="100" cy="133" r="3" fill="#0A0E1A"/>
          <text x="100" y="168" textAnchor="middle" fill="#8B94A8" fontSize="11" fontWeight="700" fontFamily="monospace">LOOP</text>
        </svg>
      </div>
      {/* Out & Back */}
      <div style={{ textAlign: 'center' as const }}>
        <svg width="180" height="160" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="180" rx="8" fill="#161B2E"/>
          <path d="M28 82 Q80 58 165 78" stroke="#00D9FF" strokeWidth="2.5" strokeLinecap="round"/>
          <polygon points="158,70 170,78 158,86" fill="#00D9FF"/>
          <path d="M165 92 Q80 115 28 98" stroke="#00D9FF" strokeWidth="2" strokeLinecap="round" opacity="0.4" strokeDasharray="6 4"/>
          <polygon points="36,103 25,95 36,88" fill="#00D9FF" opacity="0.45"/>
          <circle cx="167" cy="85" r="5" fill="none" stroke="#00D9FF" strokeWidth="2"/>
          <circle cx="28" cy="90" r="6" fill="#00D9FF"/>
          <circle cx="28" cy="90" r="3" fill="#0A0E1A"/>
          <text x="100" y="168" textAnchor="middle" fill="#8B94A8" fontSize="11" fontWeight="700" fontFamily="monospace">OUT &amp; BACK</text>
        </svg>
      </div>
    </div>
  );
}

// ─── Content sections ─────────────────────────────────────────────────────────

function Overview() {
  return (
    <DocSection id="overview" kicker="01 · OVERVIEW" title="What StormRun is">
      <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
        StormRun is an audio-driven running companion. You put on headphones, step outside your Shelter, and <strong>Audrey</strong> — your in-ear AI operator — narrates a mission around whatever streets are outside your door.
      </p>
      <p className="text-muted-foreground mb-4">
        The app sits between a running tracker, an audio drama, and a light RPG. GPS and pace data drive the fiction: pick up the pace and a chase resolves; slow down and Audrey checks in. When you can't run outdoors, missions are playable in <strong>Simulated Mode</strong> — the story runs on a timer against your profile pace, no GPS required.
      </p>

      <KvTable rows={[
        ['Core loop', 'Briefing → Run (live or simulated) → Debrief → Rewards → Hub'],
        ['Session length', 'Typically 15–35 min, scaled from profile preference'],
        ['Permissions', <><code>FINE_LOCATION</code>, <code>ACTIVITY_RECOGNITION</code>, background audio, optional notifications</>],
        ['Offline', 'Cached missions + simulated mode playable fully offline'],
        ['Platform', 'Android (Expo React Native)'],
      ]} />

      <h3 className="font-semibold text-base mt-6 mb-3">Five tabs, one goal</h3>
      <KvTable rows={[
        ['Mission Hub', 'Briefings from Audrey, active and recent missions, quick deploy.'],
        ['Map', 'Territory around the Shelter: missions, landmarks, hostile zones.'],
        ['Prep Bay', 'Loadout slots, perks, audio source, XP progression.'],
        ['Community', 'Friends list, incoming requests, and activity feed. Privacy controls per field.'],
        ['Profile', 'Runner stats, achievements, run history.'],
      ]} />
    </DocSection>
  );
}

function BootLogin() {
  return (
    <DocSection id="boot-login" kicker="02 · FIRST TOUCH" title="Boot & Login">
      <p className="text-muted-foreground mb-4">
        Cold launch shows a branded comms-booting splash. A session token is checked against secure storage; if valid, the runner is sent straight to Mission Hub. Otherwise they land on the Login / Register screen.
      </p>

      <PhoneGallery items={[
        { src: '/docs/app/app-open.png', caption: 'Splash · comms boot' },
        { src: '/docs/app/login.png', caption: 'Login / Register' },
      ]} />

      <KvTable rows={[
        ['Splash', '~1.2 s minimum while auth state resolves; longer if token refresh is in flight.'],
        ['Validation', 'Email format, password ≥ 8 chars. Errors appear inline; submit stays disabled until valid.'],
        ['Password reveal', '"SHOW" toggles masked/plaintext; does not persist.'],
        ['Failure modes', 'Network errors show a retry banner; 401 clears the token and re-renders login.'],
      ]} />
    </DocSection>
  );
}

function Onboarding() {
  return (
    <DocSection id="onboarding" kicker="03 · ONBOARDING" title="Onboarding">
      <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
        Onboarding is framed as Audrey's first transmission. Five steps, ~2 minutes. Audio narration plays throughout, with live transcripts at the bottom of each screen.
      </p>

      <PhoneGallery items={[
        { src: '/docs/onboarding/step1-welcome.png', caption: '1 · Welcome · Systems online' },
        { src: '/docs/onboarding/step2-audrey.png', caption: '2 · Audrey intro · Protocol removed' },
        { src: '/docs/onboarding/step3-vitals.png', caption: '3 · Vitals · Callsign & fitness' },
        { src: '/docs/onboarding/step4-shelter.png', caption: '4 · Shelter · Drop your pin' },
        { src: '/docs/onboarding/step5-mission.png', caption: '5 · Route preview · First mission' },
      ]} />

      <h3 className="font-semibold text-base mt-6 mb-3">Step-by-step</h3>
      <KvTable rows={[
        ['1 · Welcome', 'Audrey\'s first words: "Systems online. This is Audrey." Headphone icon. Single Continue CTA. Nothing collected.'],
        ['2 · Audrey intro', '"Grey Army protocol removed. This is Audrey, your survival implant." Sets narrative tone.'],
        ['3 · Vitals', 'Callsign (username), profile avatar, age/gender/weight/height, experience level (Beginner / Intermediate / Advanced), Route Style (Loop / Out & Back).'],
        ['4 · Shelter', '"Storms intensifying. We need a shelter." Runner confirms current GPS location or picks a different one on the map. All runs start and end here.'],
        ['5 · Route preview', 'First mission ("Storm Wall Breach") is pre-assigned. Route shown on map with distance/time estimate. Runner accepts to begin.'],
      ]} />

      <Callout variant="warn">
        Location permission is requested at the Shelter step — not on app open. This means the runner understands <em>why</em> before granting it.
      </Callout>

      <h3 className="font-semibold text-base mt-6 mb-2">Route style options</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Set during Vitals. Controls how routes are generated when starting any mission. Editable later in Edit Profile.
      </p>
      <KvTable rows={[
        ['Loop', 'Default. ORS generates a single large loop that returns to the start point.'],
        ['Out & Back', 'Route goes out half the target distance, then returns the same way.'],
      ]} />
      <RouteTypeDiagrams />
    </DocSection>
  );
}

function MissionHub() {
  return (
    <DocSection id="mission-hub" kicker="04 · TAB" title="Mission Hub">
      <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
        The landing tab. Audrey's live briefing sits at the top; below it, one featured mission, side ops, and a recap of the last run.
      </p>

      <PhoneGallery items={[
        { src: '/docs/app/mission-hub-1.png', caption: 'Mission Hub · featured' },
        { src: '/docs/app/mission-hub-2.png', caption: 'Priority mission detail' },
        { src: '/docs/app/mission-hub-3.png', caption: 'Side ops list' },
        { src: '/docs/app/mission-hub-4.png', caption: 'Last run recap' },
      ]} />

      <KvTable rows={[
        ['Audrey briefing', 'Updated each launch. Tone shifts with faction standing and weather; a waveform signals new VO.'],
        ['Priority mission', 'Story beat pinned by the narrative director. Includes chapter, estimated distance/time, and hazard warnings.'],
        ['Side ops', 'Short, procedurally-generated missions around the Shelter. Labeled by type (supply, scout, free run).'],
        ['Last run', 'Tap to reopen debrief summary. A way back into the narrative without deploying.'],
        ['Deploy CTA', '"BEGIN MISSION" opens the route briefing sheet. Disabled if the runner is already on an active run.'],
      ]} />
    </DocSection>
  );
}

function MapTab() {
  return (
    <DocSection id="map" kicker="05 · TAB" title="Map">
      <p className="text-muted-foreground mb-4">
        A dark-themed map centered on the Shelter pin. Territory is rendered using <strong>Uber H3 hexagonal cells</strong> at resolution 9 — each hex is approximately 174 m across (~0.105 km²). Claimed hexes appear as green polygons; adjacent unclaimed cells glow dimly as the frontier edge. Friends with visible territory appear as purple hex clusters.
      </p>

      <div className="my-6">
        <HexTerritoryMap />
      </div>

      <KvTable rows={[
        ['Shelter pin', 'Green house icon at the runner\'s home location. All runs originate and return here.'],
        ['Own territory', 'Green hex polygons covering H3 cells claimed through past runs. Each hex is ~174 m across. Total area shown as cell_count × 0.105 km².'],
        ['Frontier', 'Dim green hex outlines showing unclaimed H3 cells adjacent to your territory — the expansion edge. Static (no animation).'],
        ['Friend territory', 'Purple hex polygons for friends with public or friends-visible territory settings. Capped at 20 friends for performance. Their shelter is shown with a purple initials pin.'],
        ['Active location', 'Cyan pulse dot tracking your live GPS position. Updates during a run.'],
        ['Recenter button', 'Bottom-right button snaps the map back to your current location.'],
        ['Active friends chip', 'Shows the count of friends currently running or online when the count is greater than 0.'],
      ]} />
    </DocSection>
  );
}

function PrepBay() {
  return (
    <DocSection id="prep-bay" kicker="06 · TAB" title="Prep Bay">
      <p className="text-muted-foreground mb-4">
        Loadout management. Runners equip consumables for runs, manage perk slots, and track XP progression.
      </p>

      <PhoneGallery items={[
        { src: '/docs/app/prep-bay.png', caption: 'Prep Bay · loadout' },
        { src: '/docs/app/prep-bay-2.png', caption: 'Consumable detail' },
        { src: '/docs/app/prep-bay-2b.png', caption: 'Item equipped' },
      ]} />

      <KvTable rows={[
        ['Loadout slots', 'Four equipment slots (head, body, feet, accessory). Items affect run stats and narrative options.'],
        ['Consumables', 'Single-use items equipped before a run. Tap an item to see effects and quantity.'],
        ['Perks', 'Passive abilities unlocked through XP. Displayed as a grid with tier progress.'],
        ['XP bar', 'Global runner XP and current rank. Fills based on distance, pace, and mission completion.'],
        ['Audio source', 'Selected music service (Spotify / Apple Music / Local) shown and switchable from here.'],
      ]} />
    </DocSection>
  );
}

function Community() {
  return (
    <DocSection id="community" kicker="07 · TAB" title="Community">
      <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
        The Community tab is the social hub — friends, incoming requests, and a feed of recent friend activity. Three segment tabs open left-to-right: Activity → Friends → Requests. A numeric badge on the tab bar icon appears when there are unread friend requests.
      </p>

      <h3 className="font-semibold text-base mt-6 mb-1">Activity Feed</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Default tab. Shows a reverse-chronological feed of events from accepted friends: run completions (mission name, distance, pace) and achievement unlocks. Only visible to accepted friends — privacy-gated by each friend's settings.
      </p>

      <h3 className="font-semibold text-base mt-6 mb-1">Friends List</h3>
      <p className="text-sm text-muted-foreground mb-4">
        All accepted friends with presence status badges (online / running / offline). Tapping a friend opens their profile. The <strong>+ Add Friend</strong> FAB (bottom-right) opens the search modal.
      </p>

      <h3 className="font-semibold text-base mt-6 mb-1">Friend Requests</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Incoming pending requests with Accept / Decline actions. The tab label shows a live count badge. Accepting moves the user to the Friends list immediately.
      </p>

      <h3 className="font-semibold text-base mt-6 mb-1">Map Integration</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Friends with public or friends-visible territory appear on the Map tab as purple hex polygons with an initials pin at their shelter location. The app fetches friend territory boundaries on map open via <code>GET /api/friends/territories</code>. Capped at 20 friends for performance.
      </p>
      <div className="my-6">
        <FriendTerritoryMap />
      </div>

      <h3 className="font-semibold text-base mt-6 mb-1">Privacy Settings</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Each runner controls visibility of five profile fields independently: public / friends / private. Settings live in the Profile tab's settings sheet under the "Privacy" section.
      </p>

      <KvTable rows={[
        ['Friend search', 'Search by username (partial match) or full email address. Results show friendship status — already-friends and pending requests are labelled and the Add button is disabled.'],
        ['Presence status', '"online" on app foreground, "offline" on background, "running" during an active mission. Updated via PATCH /api/user/status. Friends see it on screen open (DB-only, no realtime push).'],
        ['Privacy fields', 'Achievements · Run Times · Territory Map · Status · Profile. Each independently set to public / friends / private. Defaults: achievements and run times → friends; territory map and profile → public; status → friends.'],
        ['Territory on map', 'H3 hex cells (resolution 9) owned by the friend. Shown as purple hex polygons only when privacy_territory_map permits. Shelter shown as a purple initials pin.'],
        ['Route leaderboard', 'After completing a mission run, a leaderboard entry is submitted automatically (best-effort, non-blocking). Viewable per-mission — your best pace vs. friends\' best pace vs. top public.'],
        ['Activity feed', 'Populated by run completions and achievement unlocks. Only shown to accepted friends when privacy settings allow.'],
      ]} />
    </DocSection>
  );
}

function Profile() {
  return (
    <DocSection id="profile" kicker="08 · TAB" title="Profile">
      <p className="text-muted-foreground mb-4">
        Runner stats, achievement tracking, and run history. Also the entry point for settings.
      </p>

      <PhoneGallery items={[
        { src: '/docs/app/profile.png', caption: 'Profile · stats' },
      ]} />

      <KvTable rows={[
        ['Stats', 'Total distance, total time, missions completed, best pace, longest run.'],
        ['Achievements', 'Badge grid — locked badges show silhouettes with completion criteria.'],
        ['Run history', 'Chronological list of completed runs with date, distance, and mission name.'],
        ['Avatar', 'Chosen during onboarding; changeable from Profile. Pre-set art or upload.'],
        ['Settings entry', 'Gear icon in the top-right opens the settings sheet.'],
      ]} />

      <h3 className="font-semibold text-base mt-6 mb-2">Route Style preference</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Set during onboarding Vitals and editable from Edit Profile. Controls how routes are generated for every mission.
      </p>
      <KvTable rows={[
        ['Loop', 'Default. One large loop that returns to the start point.'],
        ['Out & Back', 'Run half the distance outbound, then return the same way.'],
      ]} />
      <RouteTypeDiagrams />
    </DocSection>
  );
}

function Programs() {
  return (
    <DocSection id="programs" kicker="09 · PROGRAMS" title="Programs">
      <p className="text-muted-foreground mb-4">
        Structured training programs containing ordered sessions. Each session is a sequence of missions played over multiple runs, designed around a fitness or narrative arc.
      </p>

      <PhoneGallery items={[
        { src: '/docs/app/program-1.png', caption: 'Program list' },
        { src: '/docs/app/program-2.png', caption: 'Program detail' },
        { src: '/docs/app/program-3.png', caption: 'Session view' },
      ]} />

      <KvTable rows={[
        ['Program', 'A named training arc with a cover, description, total weeks, and difficulty rating.'],
        ['Session', 'A single day\'s workout within a program. Contains one or more ordered missions.'],
        ['Progress', 'Completed sessions are checked off; the active session is highlighted.'],
        ['Lock', 'Future sessions are locked until prior sessions are completed in order.'],
      ]} />
    </DocSection>
  );
}

function RunExperience() {
  return (
    <DocSection id="run" kicker="10 · RUN EXPERIENCE" title="Live & Simulated Runs">
      <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
        The run is the core product. Two modes: <strong>Live</strong> (GPS-tracked outdoors) and <strong>Simulated</strong> (timer-based, no GPS). Both play the same mission audio, but live mode reacts to actual pace and location.
      </p>

      <h3 className="font-semibold text-base mt-4 mb-2">Route setup</h3>
      <PhoneGallery items={[
        { src: '/docs/app/route-1.png', caption: 'Route · briefing' },
        { src: '/docs/app/route-2.png', caption: 'Route · map preview' },
        { src: '/docs/app/route-3.png', caption: 'Route · accept' },
      ]} />

      <h3 className="font-semibold text-base mt-6 mb-2">Territory context on route preview</h3>
      <p className="text-sm text-muted-foreground mb-4">
        The route preview map shows your existing green hex territory and dim frontier cells so you can see which direction expands your claimed area before committing to a route.
      </p>
      <div className="my-6">
        <RoutePreviewWithHexes />
      </div>

      <h3 className="font-semibold text-base mt-6 mb-2">During the run</h3>
      <PhoneGallery items={[
        { src: '/docs/app/start-run.png', caption: 'Live · run active' },
        { src: '/docs/app/start-run-test.png', caption: 'Simulated · run active' },
        { src: '/docs/app/mid-run-test-1.png', caption: 'Simulated · mid run' },
        { src: '/docs/app/mission-complete.png', caption: 'Mission complete' },
      ]} />

      <KvTable rows={[
        ['Live mode', 'GPS tracks position. Pace triggers audio cues. Route deviations trigger Audrey commentary.'],
        ['Simulated mode', 'Runs on a countdown timer calibrated to the runner\'s profile pace. No GPS needed. Identical audio.'],
        ['Audio ducking', 'Audrey\'s voice ducks music by ~20 dB during narration, then fades music back up.'],
        ['Debrief', 'After finishing: distance, time, pace, XP earned, items collected, story beat played.'],
        ['Abandon', 'Long-press the stop button to abandon; partial XP is still awarded.'],
      ]} />

      <Callout>
        <strong>Chase mechanic:</strong> If the runner slows below target pace during a chase sequence, Audrey warns them. If pace doesn't recover within the window, the chase resolves as a failure (story continues, but with a different branch).
      </Callout>

      <h3 className="font-semibold text-base mt-6 mb-2">Territory reward</h3>
      <p className="text-sm text-muted-foreground mb-4">
        When a run claims new hex cells, a "TERRITORY CLAIMED" card appears in the debrief with the hex count and km² secured. No new cells = no card shown.
      </p>
      <div className="my-6 flex justify-center">
        <TerritoryRewardCard />
      </div>
    </DocSection>
  );
}

// ─── Admin sections ───────────────────────────────────────────────────────────

function AdminOverview() {
  return (
    <DocSection id="admin-overview" kicker="ADMIN · 01" title="Admin Portal Overview">
      <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
        The admin portal is a web-based management interface for StormRun operators. It provides full control over missions, programs, users, items, and audio content.
      </p>

      <BrowserFrame src="/docs/admin/login.png" caption="Admin login" />

      <KvTable rows={[
        ['Access', 'Requires a manager or admin account. Token stored in sessionStorage as sr_token.'],
        ['URL', '/manage — not publicly linked'],
        ['Roles', 'admin (full access), manager (same access, used for day-to-day ops)'],
        ['Sections', 'Dashboard · Missions · Programs · Users · Items · Item Balance · Bulk Grant · Encouragement Audio · Geo Analytics'],
      ]} />
    </DocSection>
  );
}

function AdminDashboard() {
  return (
    <DocSection id="admin-dashboard" kicker="ADMIN · 02" title="Dashboard">
      <p className="text-muted-foreground mb-4">
        High-level metrics: active users, total runs, distance covered, and recent activity. The starting view after login.
      </p>

      <AdminGallery items={[
        { src: '/docs/admin/dashboard-1.png', caption: 'Dashboard · metrics' },
        { src: '/docs/admin/dashboard-2.png', caption: 'Dashboard · recent activity' },
      ]} />
    </DocSection>
  );
}

function AdminMissions() {
  return (
    <DocSection id="admin-missions" kicker="ADMIN · 03" title="Missions">
      <p className="text-muted-foreground mb-4">
        Create and manage missions. Each mission has metadata, objectives, rewards, and an ordered sequence of audio events that play during the run.
      </p>

      <h3 className="font-semibold text-base mt-4 mb-2">Mission list & creation</h3>
      <AdminGallery items={[
        { src: '/docs/admin/missions-1.png', caption: 'Mission list' },
        { src: '/docs/admin/mission-create-1.png', caption: 'Create mission · part 1' },
        { src: '/docs/admin/mission-create-2.png', caption: 'Create mission · part 2' },
      ]} />

      <h3 className="font-semibold text-base mt-6 mb-2">Edit & audio events</h3>
      <AdminGallery items={[
        { src: '/docs/admin/mission-edit-1.png', caption: 'Mission edit' },
        { src: '/docs/admin/mission-edit-2.png', caption: 'Mission edit · continued' },
        { src: '/docs/admin/mission-audio-events.png', caption: 'Audio events list' },
        { src: '/docs/admin/mission-audio-event-edit.png', caption: 'Audio event edit' },
      ]} />

      <KvTable rows={[
        ['Mission fields', 'Title, type, description, objectives, rewards, difficulty, estimated time/distance, hazards, priority flag, sort order.'],
        ['Audio events', 'Ordered sequence of audio cues attached to a mission. Each event has a trigger type (distance, time, pace) and a trigger value.'],
        ['Trigger types', 'distance_km (fires when runner reaches X km), time_seconds (fires at X seconds elapsed), pace events.'],
        ['Priority', 'Toggle is_priority to pin the mission to the top of Mission Hub for all users.'],
        ['Sort order', 'Integer; lower numbers appear higher in side ops lists.'],
      ]} />
    </DocSection>
  );
}

function AdminPrograms() {
  return (
    <DocSection id="admin-programs" kicker="ADMIN · 04" title="Programs">
      <p className="text-muted-foreground mb-4">
        Manage training programs and their sessions. Each session is an ordered list of missions.
      </p>

      <AdminGallery items={[
        { src: '/docs/admin/programs-1.png', caption: 'Programs list' },
        { src: '/docs/admin/programs-sessions.png', caption: 'Program sessions' },
        { src: '/docs/admin/programs-edit-session-1.png', caption: 'Edit session · part 1' },
        { src: '/docs/admin/programs-edit-session-2.png', caption: 'Edit session · part 2' },
      ]} />

      <KvTable rows={[
        ['Program fields', 'Name, description, difficulty, total weeks, cover image.'],
        ['Session fields', 'Name, description, order index, list of missions (ordered).'],
        ['Mission order', 'Within a session, missions are played in sequence. Reorder with drag handles.'],
        ['Publish', 'Programs are not visible to app users until published. Drafts can be edited freely.'],
      ]} />
    </DocSection>
  );
}

function AdminUsers() {
  return (
    <DocSection id="admin-users" kicker="ADMIN · 05" title="Users">
      <p className="text-muted-foreground mb-4">
        View all registered users, inspect their run history, and manage their roles and item balances.
      </p>

      <AdminGalleryWide items={[
        { src: '/docs/admin/users.png', caption: 'User list' },
      ]} />

      <h3 className="font-semibold text-base mt-6 mb-2">Expanded user view</h3>
      <AdminGallery items={[
        { src: '/docs/admin/users-expanded-1.png', caption: 'User profile & vitals' },
        { src: '/docs/admin/users-expanded-2.png', caption: 'Run history' },
        { src: '/docs/admin/users-expanded-3.png', caption: 'Missions completed' },
        { src: '/docs/admin/users-expanded-4.png', caption: 'Item inventory' },
        { src: '/docs/admin/users-expanded-5.png', caption: 'Item balance detail' },
        { src: '/docs/admin/users-expanded-6.png', caption: 'Admin actions' },
      ]} />

      <KvTable rows={[
        ['Roles', 'user (default), test, manager, admin. Role changes take effect immediately.'],
        ['Run history', 'Every run with date, distance, time, pace, and mission name.'],
        ['Item inventory', 'Items the user holds; admin can add or remove individual items.'],
        ['Reset', 'Admins can reset a user\'s onboarding state (shelter, vitals) from the expanded view.'],
      ]} />
    </DocSection>
  );
}

function AdminItems() {
  return (
    <DocSection id="admin-items" kicker="ADMIN · 06" title="Items & Item Balance">
      <p className="text-muted-foreground mb-4">
        Define collectible items and review the global distribution of items across all users.
      </p>

      <h3 className="font-semibold text-base mt-4 mb-2">Item management</h3>
      <AdminGallery items={[
        { src: '/docs/admin/items-1.png', caption: 'Item list' },
        { src: '/docs/admin/items-create.png', caption: 'Create item' },
        { src: '/docs/admin/items-edit.png', caption: 'Edit item' },
      ]} />

      <h3 className="font-semibold text-base mt-6 mb-2">Item balance</h3>
      <AdminGalleryWide items={[
        { src: '/docs/admin/itembalance-1.png', caption: 'Item balance · distribution across users' },
      ]} />

      <KvTable rows={[
        ['Item fields', 'Name, description, type (consumable/equipment), rarity, effects, icon.'],
        ['Effects', 'Structured JSON defining stat modifiers applied during a run (e.g. +10% pace threshold, +5% XP).'],
        ['Balance view', 'Aggregated view of how many of each item are held across all users. Useful for detecting economy imbalances.'],
      ]} />
    </DocSection>
  );
}

function AdminEncouragement() {
  return (
    <DocSection id="admin-encouragement" kicker="ADMIN · 07" title="Encouragement Audio">
      <p className="text-muted-foreground mb-4">
        Upload and manage short Audrey audio clips that play during runs to motivate the runner. These are separate from mission audio events — they're generic encouragement that can play in any run.
      </p>

      <AdminGallery items={[
        { src: '/docs/admin/encouragement-audio-1.png', caption: 'Encouragement audio list' },
        { src: '/docs/admin/encouragement-audio-add.png', caption: 'Add encouragement audio' },
        { src: '/docs/admin/encouragement-audio-edit.png', caption: 'Edit encouragement audio' },
      ]} />

      <KvTable rows={[
        ['Fields', 'Label, category, audio file (uploaded to Supabase Storage), transcript, duration, active toggle, sort order.'],
        ['Category', 'Groups clips by use (e.g. "pace_drop", "halfway", "final_push"). The run engine selects clips by category at the right moment.'],
        ['Active toggle', 'Inactive clips are never played. Use this to A/B or retire old recordings.'],
        ['Transcript', 'Displayed as subtitles during playback in the app.'],
      ]} />
    </DocSection>
  );
}

function AdminBulkGrant() {
  return (
    <DocSection id="admin-bulk-grant" kicker="ADMIN · 08" title="Bulk Grant">
      <p className="text-muted-foreground mb-4">
        Grant items to multiple users at once. Useful for rewards, beta incentives, or correcting item loss bugs.
      </p>

      <AdminGalleryWide items={[
        { src: '/docs/admin/bulk-grant.png', caption: 'Bulk grant · select users and items' },
      ]} />

      <KvTable rows={[
        ['Target', 'Select individual users, a role group (e.g. all "test" users), or all users.'],
        ['Items', 'Choose one or more items and quantities to grant.'],
        ['Confirmation', 'Preview shows total grants before executing. Action is not reversible from the UI (requires DB edit).'],
      ]} />

      <Callout variant="warn">
        Bulk grant cannot be undone from the admin portal. Double-check the target and quantity before confirming.
      </Callout>
    </DocSection>
  );
}

function AdminAnalytics() {
  return (
    <DocSection id="admin-analytics" kicker="ADMIN · 09" title="Geo Analytics">
      <p className="text-muted-foreground mb-4">
        A heatmap and trail visualization of all runs, overlaid on a map. Shows where runners are actually going — useful for mission route design and identifying dead zones.
      </p>

      <AdminGalleryWide items={[
        { src: '/docs/admin/geo-analytics.png', caption: 'Geo analytics · run heatmap' },
      ]} />

      <KvTable rows={[
        ['Heatmap', 'Density of run activity by geographic area. Brighter = more runs through that point.'],
        ['Trails', 'Individual run paths can be toggled on to see actual routes taken.'],
        ['Filters', 'Filter by date range, user role, or mission type.'],
        ['Use cases', 'Identify popular routes for new missions, find areas with no coverage, detect route generation edge cases.'],
      ]} />
    </DocSection>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, onJump }: { active: string; onJump: (id: string) => void }) {
  return (
    <aside
      className="hidden lg:flex flex-col gap-1 w-56 flex-shrink-0 sticky top-0 self-start overflow-y-auto"
      style={{ maxHeight: '100vh', paddingTop: 24, paddingBottom: 24 }}
    >
      <Link
        href="/manage/dashboard"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" />
        Back to Admin
      </Link>

      <div className="font-bold text-sm tracking-tight mb-4">StormRun Docs</div>

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-4">
          <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1 px-2">
            {group.label}
          </div>
          {group.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onJump(item.id)}
              className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                active === item.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const { ready } = useManageAuth();
  const [active, setActive] = useState('overview');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('[data-section]')) as HTMLElement[];

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY + 140;
        let current = sections[0]?.dataset.section ?? 'overview';
        for (const s of sections) {
          if (s.offsetTop <= y) current = s.dataset.section ?? current;
        }
        setActive(current);
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.offsetTop - 24, behavior: 'smooth' });
    setActive(id);
  };

  if (!ready) return null;

  return (
    <LightboxContext.Provider value={setLightboxSrc}>
    {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="border-b bg-card px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <span className="font-bold text-sm tracking-tight">StormRun Admin</span>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-medium">Documentation</span>
        <div className="ml-auto">
          <Link href="/manage/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto px-6 gap-12">
        <Sidebar active={active} onJump={jump} />

        {/* Main content */}
        <main className="flex-1 py-10 min-w-0">
          {/* Cover */}
          <div className="mb-16 pb-10 border-b">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
              FUNCTIONAL DOCUMENTATION · v0.1
            </p>
            <h1 className="text-4xl font-bold mb-4">StormRun</h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed mb-6">
              A complete walkthrough of the Android app and admin portal. Written for product, design, and new engineers who need to get oriented fast.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              {[
                ['Platform', 'Android (Expo RN)'],
                ['Version', '0.1.0 · build 42'],
                ['Last updated', 'Apr 20 · 2026'],
                ['Access', 'Logged-in admin / manager'],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-xs">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <Overview />
          <BootLogin />
          <Onboarding />
          <MissionHub />
          <MapTab />
          <PrepBay />
          <Community />
          <Profile />
          <Programs />
          <RunExperience />

          <div className="border-t my-10 pt-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-8">
              ADMIN PORTAL
            </p>
          </div>

          <AdminOverview />
          <AdminDashboard />
          <AdminMissions />
          <AdminPrograms />
          <AdminUsers />
          <AdminItems />
          <AdminEncouragement />
          <AdminBulkGrant />
          <AdminAnalytics />

          <div className="border-t mt-16 pt-8 text-sm text-muted-foreground">
            StormRun Functional Documentation · Internal use only.
          </div>
        </main>
      </div>
    </div>
    </LightboxContext.Provider>
  );
}
