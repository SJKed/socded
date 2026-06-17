import { useState } from 'react';
import QRCode from 'react-qr-code';

interface Props {
  roomCode: string;
  onClose: () => void;
}

export function ShareModal({ roomCode, onClose }: Props) {
  const url = `${window.location.origin}/room/${roomCode}`;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: 'Join my Outsider game', url });
    } else {
      handleCopy();
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 28,
          width: '100%',
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 4 }}>Invite Players</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Scan the QR code or share the link
          </p>
        </div>

        {/* QR Code */}
        <div
          style={{
            background: '#fff',
            padding: 16,
            borderRadius: 12,
            lineHeight: 0,
          }}
        >
          <QRCode value={url} size={180} />
        </div>

        {/* Room code */}
        <div style={{ textAlign: 'center' }}>
          <p className="label" style={{ marginBottom: 6 }}>Room Code</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--accent-bright)' }}>
            {roomCode}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {'share' in navigator ? (
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleShare}>
              Share Invite Link
            </button>
          ) : (
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          )}
          <button className="btn-ghost" style={{ width: '100%' }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
