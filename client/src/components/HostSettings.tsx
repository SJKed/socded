import { useGameStore } from '../store/gameStore';
import { socket } from '../socket';

export function HostSettings() {
  const settings = useGameStore((s) => s.settings);

  function update(partial: Partial<typeof settings>) {
    socket.emit('update_settings', partial);
  }

  return (
    <div className="card gap-md">
      <h3>Game Settings</h3>

      <div>
        <p className="label">Rounds</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[2, 3, 5, 7].map((n) => (
            <button
              key={n}
              onClick={() => update({ roundCount: n })}
              style={{
                flex: 1,
                minHeight: 48,
                background: settings.roundCount === n ? 'var(--accent)' : 'var(--bg-raised)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Time Per Clue</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '10s', value: 10 },
            { label: '20s', value: 20 },
            { label: '30s', value: 30 },
            { label: '45s', value: 45 },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => update({ clueTimeSeconds: value })}
              style={{
                flex: 1,
                minHeight: 48,
                background: settings.clueTimeSeconds === value ? 'var(--accent)' : 'var(--bg-raised)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontWeight: 700,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Max Round Time</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '3 min', value: 180 },
            { label: '5 min', value: 300 },
            { label: '8 min', value: 480 },
            { label: '∞', value: 9999 },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => update({ timerSeconds: value })}
              style={{
                flex: 1,
                minHeight: 48,
                background: settings.timerSeconds === value ? 'var(--accent)' : 'var(--bg-raised)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
        <div>
          <p style={{ fontWeight: 600 }}>Easy Mode</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Outsider sees 3 topic hints
          </p>
        </div>
        <button
          onClick={() => update({ easyMode: !settings.easyMode })}
          style={{
            width: 56,
            height: 32,
            borderRadius: 999,
            background: settings.easyMode ? 'var(--accent)' : 'var(--bg-raised)',
            border: '1px solid var(--border)',
            minHeight: 'unset',
            padding: 0,
            position: 'relative',
            transition: 'background 0.2s',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: settings.easyMode ? 28 : 4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
            }}
          />
        </button>
      </div>
    </div>
  );
}
