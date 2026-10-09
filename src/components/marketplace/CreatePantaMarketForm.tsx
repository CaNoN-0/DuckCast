/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creates a real Panta market: (optional image upload) -> fee quote -> wallet signs -> register.
 */

import React, { useMemo, useState } from 'react';
import { Check, ImagePlus, Info, Loader2 } from 'lucide-react';
import { pantaApi, PantaCreateQuote, describePantaError } from '../../services/pantaApi';
import { PANTA_CATEGORY_SLUGS } from '../../services/pantaAdapter';
import {
  CreateMarketInput,
  executeMarketCreation,
  quoteMarketCreation,
  TransactionStep,
  UserRejectedError
} from '../../payments/predictionTransaction';
import { useSolanaWallet } from '../../wallet/WalletContext';
import { formatUsdc } from '../../solana/usdc';
import { PoweredByPanta } from '../panta/PoweredByPanta';

interface Props {
  onCreated: (marketId: string) => void;
  onCancel: () => void;
  onOpenWalletModal: () => void;
}

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toUnix = (local: string) => Math.floor(new Date(local).getTime() / 1000);

const inputCls =
  'w-full px-3 py-2 text-sm font-medium bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500';
const labelCls = 'block text-xs font-bold text-neutral-800 tracking-tight mb-1';

export function CreatePantaMarketForm({ onCreated, onCancel, onOpenWalletModal }: Props) {
  const { connectedWallet, signer, refreshBalances } = useSolanaWallet();

  const defaults = useMemo(() => {
    const start = new Date(Date.now() + 70 * 60_000); // Panta requires startTime >= now + minimumStartDelay (~1h)
    const end = new Date(Date.now() + 7 * 86_400_000);
    const resolve = new Date(end.getTime() + 2 * 3_600_000);
    return { start: toLocalInput(start), end: toLocalInput(end), resolve: toLocalInput(resolve) };
  }, []);

  const [question, setQuestion] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('crypto');
  const [description, setDescription] = useState('');
  const [resolutionRule, setResolutionRule] = useState('');
  const [sources, setSources] = useState('');
  const [startLocal, setStartLocal] = useState(defaults.start);
  const [endLocal, setEndLocal] = useState(defaults.end);
  const [resolveLocal, setResolveLocal] = useState(defaults.resolve);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const [quote, setQuote] = useState<PantaCreateQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<TransactionStep>('idle');
  const [stepMessage, setStepMessage] = useState('');

  const busy = quoting || uploading || ['building', 'waiting_approval', 'confirming', 'submitting'].includes(step);
  const feeUsdc = quote ? Number(quote.paymentUsdc) / 1e6 : 0;

  const buildInput = (): CreateMarketInput | string => {
    if (!connectedWallet) return 'Connect your wallet first.';
    if (!question.trim()) return 'Question is required.';
    if (!resolutionRule.trim()) return 'Resolution rule is required.';
    const sourcesOfTruth = sources
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sourcesOfTruth.length === 0) return 'Add at least one source of truth.';
    if (!/^https?:\/\//.test(imageUrl)) return 'A public image URL is required (upload one or paste a link).';
    const startTime = toUnix(startLocal);
    const endTime = toUnix(endLocal);
    const resolutionTime = toUnix(resolveLocal);
    if (startTime < Date.now() / 1000 + 3600) return 'Trading must open at least 1 hour from now.';
    if (!(startTime < endTime && endTime <= resolutionTime)) return 'Times must satisfy: opens < closes ≤ resolves.';
    return {
      wallet: connectedWallet.address,
      question: question.trim(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      resolutionRule: resolutionRule.trim(),
      sourcesOfTruth,
      category,
      startTime,
      endTime,
      resolutionTime,
      imageUrl,
      region: 'Global'
    };
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      // Panta returns a short-lived signed Cloudinary form; image bytes never pass through Panta or DuckCast.
      const sig = await pantaApi.imageUploadSignature();
      const form = new FormData();
      Object.entries(sig.fields).forEach(([k, v]) => form.append(k, String(v)));
      form.append('file', file);
      const res = await fetch(sig.uploadUrl, { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok || !json.secure_url) throw new Error(json?.error?.message || 'Image upload failed.');
      setImageUrl(json.secure_url);
    } catch (err) {
      setError(describePantaError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      onOpenWalletModal();
      return;
    }
    const input = buildInput();
    if (typeof input === 'string') {
      setError(input);
      return;
    }
    setError(null);
    setQuoting(true);
    try {
      setQuote(await quoteMarketCreation(input));
    } catch (err) {
      setError(describePantaError(err));
    } finally {
      setQuoting(false);
    }
  };

  const handleCreate = async () => {
    if (!quote || !connectedWallet || !signer) return;
    if ((connectedWallet.usdcBalance ?? 0) < feeUsdc) {
      setError(`Creating this market costs ${formatUsdc(feeUsdc)} USDC; your balance is ${formatUsdc(connectedWallet.usdcBalance ?? 0)}.`);
      return;
    }
    setError(null);
    try {
      const { marketId } = await executeMarketCreation(
        { wallet: connectedWallet.address, createId: quote.createId, question: question.trim(), feeUsdc, signer },
        (s, msg) => {
          setStep(s);
          setStepMessage(msg || '');
        }
      );
      refreshBalances();
      onCreated(marketId);
    } catch (err) {
      setStep('idle');
      setError(err instanceof UserRejectedError ? 'Cancelled in your wallet.' : describePantaError(err));
    }
  };

  if (!connectedWallet) {
    return (
      <div className="p-6 space-y-4 text-sm">
        <p className="text-neutral-700">
          Markets are created on-chain through Panta and paid for in USDC by your wallet. Connect a Solana wallet to continue.
        </p>
        <button
          type="button"
          onClick={onOpenWalletModal}
          className="px-4 py-2 bg-[#09090B] text-white text-xs font-bold rounded-lg cursor-pointer"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleQuote} className="p-6 space-y-4">
      <div>
        <label className={labelCls}>Prediction Question *</label>
        <input
          type="text"
          required
          maxLength={512}
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            setQuote(null);
          }}
          placeholder="e.g. Will SOL close above $300 on Dec 31, 2026 (UTC)?"
          className={`${inputCls} font-semibold`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Short title</label>
          <input type="text" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SOL > $300 EOY" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {PANTA_CATEGORY_SLUGS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Resolution rule *</label>
        <textarea
          rows={2}
          maxLength={2048}
          value={resolutionRule}
          onChange={(e) => {
            setResolutionRule(e.target.value);
            setQuote(null);
          }}
          placeholder="Resolves YES if the CoinGecko SOL/USD daily close for Dec 31, 2026 (UTC) is above $300.00; otherwise NO."
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Sources of truth * (one per line)</label>
          <textarea rows={2} value={sources} onChange={(e) => setSources(e.target.value)} placeholder="https://www.coingecko.com/en/coins/solana" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Context for traders" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Trading opens *</label>
          <input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} className={`${inputCls} text-xs`} />
        </div>
        <div>
          <label className={labelCls}>Trading closes *</label>
          <input type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} className={`${inputCls} text-xs`} />
        </div>
        <div>
          <label className={labelCls}>Resolves *</label>
          <input type="datetime-local" value={resolveLocal} onChange={(e) => setResolveLocal(e.target.value)} className={`${inputCls} text-xs`} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Market image * (square, ~1024×1024)</label>
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <img src={imageUrl} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-lg object-cover border border-neutral-200" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400">
              <ImagePlus className="w-5 h-5" />
            </div>
          )}
          <label className="px-3 py-2 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer inline-flex items-center gap-1.5">
            {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Upload
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="…or paste a public https:// image URL"
            className={`${inputCls} text-xs flex-1`}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <Info className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {quote && (
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-mono-tabular space-y-1.5">
          <div className="flex items-center justify-between font-bold text-emerald-900">
            <span>Creation fee (Panta quote)</span>
            <span>{formatUsdc(feeUsdc)} USDC</span>
          </div>
          <div className="flex items-center justify-between text-emerald-800/90">
            <span>→ Seeds market liquidity</span>
            <span>{formatUsdc(Number(quote.liquidityInjectionUsdc) / 1e6)}</span>
          </div>
          <div className="flex items-center justify-between text-emerald-800/90">
            <span>→ Platform</span>
            <span>{formatUsdc(Number(quote.platformRevenueUsdc) / 1e6)}</span>
          </div>
          <p className="text-[11px] text-emerald-800/80 pt-1">Quote valid until {new Date(quote.expiresAt).toLocaleTimeString()}.</p>
        </div>
      )}

      {step !== 'idle' && (
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
          {step === 'confirmed' ? <Check className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 animate-spin" />}
          {stepMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100">
        <PoweredByPanta />
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer">
            Cancel
          </button>
          {quote ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold font-display tracking-tight text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Sign & create · {formatUsdc(feeUsdc)}
            </button>
          ) : (
            <button
              type="submit"
              disabled={busy || !question.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold font-display tracking-tight text-white bg-[#09090B] hover:bg-neutral-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {quoting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Get creation quote
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
