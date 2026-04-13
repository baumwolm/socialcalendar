export default function TopNav({ onOpenBrandVoice }) {
  return (
    <nav style={s.nav}>
      <div style={s.left}>
        {/* Rep'd wordmark */}
        <div style={s.logoWrap}>
          <div style={s.logoCircle}>R</div>
          <span style={s.logoText}>Rep'd</span>
        </div>
        <div style={s.divider} />
        <span style={s.productName}>SOCIAL CALENDAR</span>
      </div>

      <div style={s.right}>
        <button style={s.brandBtn} onClick={onOpenBrandVoice}>
          ✦ Brand Voice
        </button>
      </div>
    </nav>
  )
}

const s = {
  nav: {
    height: 'var(--nav-height)',
    background: 'var(--navy)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
    zIndex: 100,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 28, height: 28,
    borderRadius: 6,
    background: 'var(--crimson)',
    color: '#fff',
    fontSize: 14, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '-0.01em',
  },
  divider: {
    width: 1,
    height: 18,
    background: 'rgba(255,255,255,0.2)',
    margin: '0 16px',
  },
  productName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  brandBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 14px',
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.85)',
    borderRadius: 6,
    fontSize: 12, fontWeight: 500,
    border: '1px solid rgba(255,255,255,0.15)',
    transition: 'background 0.1s',
  },
}
