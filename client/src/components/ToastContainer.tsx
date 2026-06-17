import { useToastStore } from '../store/toastStore';

const COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  info:    { bg: 'var(--bg-raised)',             border: 'var(--border)',  icon: 'ℹ️' },
  success: { bg: 'rgba(56,161,105,0.15)',         border: 'rgba(56,161,105,0.4)', icon: '✓' },
  warning: { bg: 'rgba(217,119,6,0.15)',          border: 'rgba(217,119,6,0.4)',  icon: '⚠️' },
  error:   { bg: 'rgba(229,62,62,0.15)',          border: 'rgba(229,62,62,0.4)',  icon: '✕' },
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 'min(92vw, 360px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const c = COLORS[t.type] ?? COLORS.info;
        return (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.95rem',
              fontWeight: 600,
              backdropFilter: 'blur(8px)',
              pointerEvents: 'all',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              animation: 'toast-in 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{c.icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
