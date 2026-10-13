'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BookOpen, LogOut, Download, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { useBag } from '@/lib/cart';
import { commerceRequest, type CommerceStatus, type AccountUser, type AccountOrder, type LibraryItem } from './commerce-client';
import { styles, formatMoney } from './store-shell';

function LibraryAccess({ item }: { item: LibraryItem }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [access, setAccess] = useState<{ url: string; expiresAt: string } | null>(null);
  async function requestAccess() {
    setBusy(true); setError('');
    try { setAccess(await commerceRequest<{ url: string; expiresAt: string }>(`/api/account/library/${encodeURIComponent(item.assetId)}/access`, { method: 'POST', body: '{}' })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Access could not be prepared.'); }
    finally { setBusy(false); }
  }
  const isAudio = /audio|mp3|m4a|wav|ogg/i.test(item.format);
  return <div className={styles.panel}><div className={styles.headingRow}><div><h3>{item.title}</h3><p className={styles.muted}>{item.format} · {item.language}</p></div><span className={`${styles.tag} ${item.status === 'active' ? styles.tagGreen : ''}`}>{item.status === 'active' ? 'In your library' : 'Access ended'}</span></div>{item.status === 'active' && <button type="button" className={styles.buttonOutline} onClick={requestAccess} disabled={busy}>{busy ? 'Preparing access…' : access ? 'Renew access link' : isAudio ? 'Listen or download' : 'Open download options'}{isAudio ? <BookOpen size={15} aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}</button>}{access && <div className="mt-4">{isAudio && <audio className={styles.player} controls preload="metadata" src={access.url} onPlay={(event) => { document.querySelectorAll('audio').forEach((player) => { if (player !== event.currentTarget) player.pause(); }); }}>Your browser does not support this audio player.</audio>}<a className={styles.button} href={access.url} target="_blank" rel="noopener noreferrer">Download {item.format}<ExternalLink size={15} aria-hidden="true" /><span className="sr-only"> (opens a new tab)</span></a><p className={styles.hint}>This private access link expires {new Date(access.expiresAt).toLocaleString('en-GB')}. You can request a new link here.</p>{/epub/i.test(item.format) && <p className={styles.hint}>Open the downloaded EPUB in a compatible reader. A KARUU file does not add a store purchase to your Kindle or Google Play account.</p>}</div>}{error && <p className={`${styles.notice} ${styles.error} mt-4`} role="alert">{error}</p>}</div>;
}

export function AccountContent({ checkoutOrder = '', checkoutReturn = false, initialTab = 'library', resetToken = '', verified = false }: { checkoutOrder?: string; checkoutReturn?: boolean; initialTab?: 'library' | 'orders' | 'benefits'; resetToken?: string; verified?: boolean }) {
  const bag = useBag();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [status, setStatus] = useState<CommerceStatus | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(verified ? 'Your email has been verified. You can now sign in.' : '');
  const [resetMode, setResetMode] = useState<'request' | 'confirm' | null>(resetToken ? 'confirm' : null);
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const loadAccount = useCallback(async () => {
    setDataLoading(true);
    try { const [purchases, works] = await Promise.all([commerceRequest<{ orders: AccountOrder[] }>('/api/account/orders'), commerceRequest<{ items: LibraryItem[] }>('/api/account/library')]); setOrders(purchases.orders); setLibrary(works.items); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Your account could not be loaded.'); }
    finally { setDataLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([commerceRequest<{ user: AccountUser | null }>('/api/auth/me'), commerceRequest<CommerceStatus>('/api/commerce/status')]).then(([session, settings]) => { if (active) { setUser(session.user); setStatus(settings); } }).catch((reason: Error) => { if (active) setError(reason.message); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (user) void loadAccount(); }, [user, loadAccount]);
  const returnedOrder = orders.find((order) => order.id === checkoutOrder);
  const paidReturn = returnedOrder && ['paid', 'delivered', 'fulfilled', 'delivery_pending'].includes(returnedOrder.status);
  useEffect(() => { if (paidReturn && bag.ids.length) bag.clear(); }, [paidReturn, bag]);
  useEffect(() => {
    if (!checkoutReturn || !checkoutOrder || !user || paidReturn || ['refunded', 'cancelled', 'failed'].includes(returnedOrder?.status || '')) return;
    let attempts = 0;
    const timer = window.setInterval(() => { attempts += 1; if (attempts >= 12) window.clearInterval(timer); void loadAccount(); }, 5000);
    return () => window.clearInterval(timer);
  }, [checkoutReturn, checkoutOrder, user, paidReturn, returnedOrder?.status, loadAccount]);
  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'register') { await commerceRequest<{ verificationRequired: boolean }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName: name }) }); setNotice('Check your email to verify your address, then sign in.'); setMode('login'); setPassword(''); }
      else { const session = await commerceRequest<{ user: AccountUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setUser(session.user); setPassword(''); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Sign-in could not be completed.'); }
    finally { setBusy(false); }
  }
  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (resetMode === 'confirm') {
        await commerceRequest('/api/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ token: resetToken, password }) });
        setNotice('Your password was updated. Sign in with your new password.'); setResetMode(null); setUser(null); setPassword('');
        const url = new URL(window.location.href); url.searchParams.delete('reset'); window.history.replaceState({}, '', url);
      } else {
        const result = await commerceRequest<{ message: string }>('/api/auth/reset/request', { method: 'POST', body: JSON.stringify({ email }) });
        setNotice(result.message); setResetMode(null);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The password reset could not be completed.'); }
    finally { setBusy(false); }
  }
  async function logout() { setBusy(true); setError(''); try { await commerceRequest('/api/auth/logout', { method: 'POST', body: '{}' }); setUser(null); setOrders([]); setLibrary([]); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Sign-out could not be completed.'); } finally { setBusy(false); } }
  if (!ready) return <div className={styles.panel} role="status">Checking your account…</div>;
  return <>
    {checkoutReturn && <div className={`${styles.notice} mb-5`} role="status">{paidReturn ? 'Your payment has been confirmed. Your order and included works are listed below.' : 'You returned from the payment page. Your order is being checked; access appears only after payment confirmation.'}</div>}
    {error && <div className={`${styles.notice} ${styles.error} mb-5`} role="alert">{error}</div>}{notice && <div className={`${styles.notice} ${styles.success} mb-5`} role="status">{notice}</div>}
    {!user || resetMode ? <div className={styles.twoColumns}><section className={styles.panel}>{resetMode ? <><h2>{resetMode === 'confirm' ? 'Choose a new password.' : 'Reset your password.'}</h2><p className={styles.muted}>{resetMode === 'confirm' ? 'Use the one-time link from your email. Links expire after 15 minutes.' : 'We will email a reset link if a verified account exists for this address.'}</p><form className="mt-5" onSubmit={resetPassword}>{resetMode === 'request' ? <div className={styles.field}><label className={styles.label} htmlFor="reset-email">Email address</label><input id="reset-email" type="email" autoComplete="email" className={styles.input} required value={email} maxLength={254} onChange={(event) => setEmail(event.target.value)} /></div> : <div className={styles.field}><label className={styles.label} htmlFor="reset-password">New password</label><input id="reset-password" type="password" autoComplete="new-password" className={styles.input} required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /><p className={styles.hint}>12–128 characters. Existing signed-in sessions will end.</p></div>}<button type="submit" className={styles.button} disabled={busy}>{busy ? 'Please wait…' : resetMode === 'confirm' ? 'Update password' : 'Email reset link'}</button><button type="button" className={styles.buttonOutline} onClick={() => { setResetMode(null); setPassword(''); }}>Back to sign in</button></form></> : <><div className={styles.tabs}><button type="button" className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`} aria-pressed={mode === 'login'} onClick={() => setMode('login')}>Sign in</button><button type="button" className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`} aria-pressed={mode === 'register'} onClick={() => setMode('register')}>Create account</button></div><h2>{mode === 'login' ? 'Welcome back.' : 'Make room for your next story.'}</h2><form onSubmit={authenticate}>{mode === 'register' && <div className={styles.field}><label className={styles.label} htmlFor="account-name">Your name</label><input id="account-name" autoComplete="name" className={styles.input} value={name} onChange={(event) => setName(event.target.value)} maxLength={100} /></div>}<div className={styles.field}><label className={styles.label} htmlFor="account-email">Email address</label><input id="account-email" type="email" autoComplete="email" className={styles.input} required value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} /></div><div className={styles.field}><label className={styles.label} htmlFor="account-password">Password</label><input id="account-password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} className={styles.input} required minLength={mode === 'register' ? 12 : 1} value={password} onChange={(event) => setPassword(event.target.value)} maxLength={128} />{mode === 'register' && <p className={styles.hint}>Use at least 12 characters. Your email must be verified before purchases.</p>}</div><button type="submit" className={`${styles.button} w-full`} disabled={busy || (mode === 'register' ? !status?.accounts : !status?.database)}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>{!status?.accounts && <p className={`${styles.notice} mt-4`}>{status?.database ? 'New account registration is currently unavailable. Existing members can sign in.' : 'KARUU account sign-in is not available yet. You can still explore works and use their existing platform links.'}</p>}</form>{mode === 'login' && <button type="button" className={`${styles.compact} mt-4 underline`} onClick={() => { setResetMode('request'); setError(''); setPassword(''); }}>Forgot your password?</button>}</>}</section><section className={`${styles.panel} !bg-[#f1eeff]`}><BookOpen size={32} className="mb-5" strokeWidth={1.3} aria-hidden="true" /><h2>Your own collection.</h2><p className={styles.muted}>Your KARUU account brings together your orders, purchased ebooks and listening editions. You can return here to request access to your own works.</p><hr className={styles.divider} /><h3>Already reading somewhere else?</h3><p className={styles.muted}>Google Play, Kindle and Payhip purchases stay in their own libraries. They do not automatically appear as KARUU orders.</p><div className={styles.actions}><Link href="/creations" className={styles.buttonOutline}>Explore digital creations</Link></div></section></div> : <><div className={styles.headingRow}><div><p className={styles.eyebrow}>Your KARUU account</p><h2 className="mt-1">{user.email}</h2></div><div className={styles.actions}>{user.role === 'admin' && <Link href="/admin" className={styles.buttonOutline}><ShieldCheck size={16} aria-hidden="true" />Manage store</Link>}<button type="button" onClick={logout} disabled={busy} className={styles.buttonOutline}><LogOut size={16} aria-hidden="true" />Sign out</button></div></div><div className={styles.tabs} aria-label="Account sections">{[['library', 'My creations'], ['orders', 'My orders'], ['benefits', 'Member benefits']].map(([value, label]) => <button key={value} type="button" className={`${styles.tab} ${tab === value ? styles.tabActive : ''}`} aria-pressed={tab === value} onClick={() => setTab(value as typeof tab)}>{label}</button>)}<button type="button" disabled={dataLoading} className={styles.tab} onClick={loadAccount}><RefreshCw size={15} className="inline mr-2" aria-hidden="true" />{dataLoading ? 'Refreshing…' : 'Refresh'}</button></div>{dataLoading && <p className={styles.muted} role="status">Loading your orders and works…</p>}
      {tab === 'library' && (library.length ? <div className={styles.twoColumns}>{library.map((item) => <LibraryAccess key={`${item.assetId}-${item.orderId}`} item={item} />)}</div> : <div className={styles.empty}><BookOpen size={35} className="mx-auto" aria-hidden="true" /><h2>Your collection starts here.</h2><p className={styles.muted}>Confirmed KARUU purchases appear here. No works have been added to this account yet.</p><Link href="/creations" className={styles.button}>Explore creations</Link></div>)}
      {tab === 'orders' && <section className={styles.panel}><h2>Your KARUU orders</h2>{orders.length ? <div className={styles.rows}>{orders.map((order) => <article key={order.id} className={styles.row}><div><h3>{order.items.map((item) => item.title).join(' + ')}</h3><p>{new Date(order.createdAt).toLocaleDateString('en-GB')} · {formatMoney(order.totalMinor, order.currency)}</p><p className={styles.mono}>Order {order.id}</p>{order.items.map((item, index) => <p key={index}>{item.components.join(' + ')}</p>)}</div><span className={styles.tag}>{order.status.replaceAll('_', ' ')}</span></article>)}</div> : <p className={styles.muted}>No KARUU orders are recorded for this account.</p>}<p className={styles.noteLine}>For an order question or refund request, <Link href="/contact" className="underline">contact KARUU</Link> and include your order number. Digital files already downloaded cannot be remotely removed from your device.</p></section>}
      {tab === 'benefits' && <section className={styles.panel}><h2>Your member benefits</h2><p className={styles.muted}>Purchased content is listed in My creations. Any future game points or reward programme will be separate from content access.</p><div className={`${styles.notice} mt-4`}>No reward programme is currently active. Purchased content access is recorded separately in My creations.</div><div className={styles.actions}><Link href="/member-benefits" className={styles.buttonOutline}>Read about member benefits</Link></div></section>}
    </>}
  </>;
}
