import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { REFERRAL_EVENTS, referralTier, VALIDATION_MATCHES } from '../game/referral.js';

const MILESTONES = ['played7', 'firstPack', 'proLeague', 'firstLopte'];

export default function ReferralPanel() {
  const code = useGameStore((s) => s.referralCode);
  const referrals = useGameStore((s) => s.referrals);
  const earned = useGameStore((s) => s.referralEarned);
  const inviteFriend = useGameStore((s) => s.inviteFriend);
  const friendEvent = useGameStore((s) => s.friendEvent);
  const inviteSecondLevel = useGameStore((s) => s.inviteSecondLevel);
  const ensureCode = useGameStore((s) => s._ensureReferralCode);

  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  const validated = referrals.filter((r) => r.validated && r.level === 1).length;
  const tier = referralTier(validated);
  const direct = referrals.filter((r) => r.level === 1);

  const ev = (id, key) => { const r = friendEvent(id, key); setMsg(r.ok ? '' : r.reason); };

  return (
    <div className="referral">
      <div className="ref__head">
        <div>
          <h3>Tvoj referral kod</h3>
          <code className="ref__code" onClick={ensureCode}>goaleadors.com/join?ref={code || '— (pozovi prvog prijatelja)'}</code>
        </div>
        <div className={`ref__tier ref__tier--${tier.name.toLowerCase()}`}>
          <span className="ref__tname">{tier.name}{tier.title ? ' 👑' : ''}</span>
          <span className="ref__tmult">×{tier.mult} nagrade · {validated} validnih</span>
        </div>
      </div>

      <div className="ref__network">
        Moja mreža: zarađeno <strong>{earned.kovanice.toLocaleString('sr')} 🪙</strong> · <strong>{earned.lopte} ⚽</strong> · <strong>{earned.packs}</strong> kesica
      </div>

      <div className="social__add">
        <input value={name} maxLength={24} placeholder="Ime prijatelja" onChange={(e) => setName(e.target.value)} />
        <button onClick={() => { const r = inviteFriend(name); setMsg(r.ok ? '' : r.reason); if (r.ok) setName(''); }}>Pozovi</button>
      </div>
      {msg && <p className="social__msg">{msg}</p>}

      {direct.length === 0 ? (
        <p className="prog__muted">Pozovi prijatelje da zaradiš nagrade (obje strane dobijaju, §17.2).</p>
      ) : (
        direct.map((f) => {
          const second = referrals.filter((r) => r.parentId === f.id);
          return (
            <div key={f.id} className="friend">
              <div className="friend__head">
                <strong>{f.name}</strong>
                <span className={`friend__status ${f.validated ? 'is-val' : ''}`}>
                  {f.validated ? 'validiran ✓' : `čeka validaciju (${VALIDATION_MATCHES} mečeva)`}
                </span>
              </div>
              <div className="friend__events">
                {MILESTONES.map((key) => (
                  <button
                    key={key}
                    disabled={f.done[key] || (key !== 'played7' && !f.validated)}
                    onClick={() => ev(f.id, key)}
                    title={REFERRAL_EVENTS[key].label}
                  >
                    {f.done[key] ? '✓ ' : ''}{shortLabel(key)}
                  </button>
                ))}
                <button className="friend__l2" disabled={!f.validated} onClick={() => inviteSecondLevel(f.id, `${f.name} #2`)}>
                  +2. nivo (20%)
                </button>
              </div>
              {second.length > 0 && (
                <div className="friend__second">2. nivo: {second.map((s) => s.name).join(', ')}</div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function shortLabel(key) {
  return { played7: '7 mečeva', firstPack: 'Prva kesica', proLeague: 'Profi liga', firstLopte: 'Prvi €' }[key] || key;
}
