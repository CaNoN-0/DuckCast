# DuckCast 🦆

**A social layer for prediction markets, powered by [Panta](https://panta.market).**

Prediction market odds tell you *what* the crowd thinks, but never *why*. DuckCast makes the "why" a first-class, verifiable object:

- **Trade live Panta markets** on Solana with your own wallet: quote, sign, done.
- **Post a thesis** explaining your call. Every thesis is **signed by your wallet** and **stamped with your live Panta position**, so "I'm long YES" is a verified fact, not a claim.
- **Prediction Battles** form automatically when two forecasters holding opposite verified positions argue the same market. The community backs the stronger argument.
- **An AI analyst (Gemini)** that reads the *live* Panta price, trade tape and your real position, and refuses client-supplied odds.

> Built for the Colosseum Crypto World's Fair (Panta API Sidetrack).

---

## How the Panta API is integrated

Every market, price, trade, position, buy, claim and market creation in DuckCast goes through the Panta API. The API key lives only on the DuckCast server ([`server/panta.ts`](server/panta.ts)). The browser receives market data and **unsigned** transactions, which the user's wallet signs.

| DuckCast feature | Panta API | Code |
|---|---|---|
| Market feed, categories | `GET /markets/` (paginated, per phase), `GET /markets/{id}/` for spot prices, `GET /categories/` | [`server/panta.ts`](server/panta.ts) → [`MarketsContext`](src/context/MarketsContext.tsx) |
| Market page: odds, trade tape, chart | `GET /markets/{id}/`, `GET /markets/{id}/trades/` | [`MarketDetailPage`](src/components/marketplace/MarketDetailPage.tsx) |
| Live order preview | `POST /primaryorderquote/` (debounced) | `MarketDetailPage` |
| **Buy YES / NO** | `POST /primaryorderquote/` → `POST /primaryorderbuild/` → *wallet signs & broadcasts* → `POST /primaryordersubmit/` → `POST /primaryorderverify/` | [`executePantaBuy`](src/payments/predictionTransaction.ts) |
| Volume attribution | `POST /trades/` for every buy and win claim | `executePantaBuy`, `executePantaClaim` |
| Portfolio and "Your position" | `GET /positions/?wallet=` + market prices (mark-to-market per Panta docs) | [`getWalletPositions`](server/panta.ts), [`ProfilePage`](src/components/profile/ProfilePage.tsx) |
| **Claim winnings** | `POST /claim/build/` → *wallet signs* → `POST /trades/` | [`executePantaClaim`](src/payments/predictionTransaction.ts) |
| **Create a market** | `POST /markets/create/image-upload/` → `POST /markets/create/quote/` → `POST /markets/create/build/` → *wallet signs* → `POST /markets/register/` | [`CreatePantaMarketForm`](src/components/marketplace/CreatePantaMarketForm.tsx) |
| Verified-position theses and battles | `GET /positions/?wallet=` checked server-side when a thesis is posted | [`server/social.ts`](server/social.ts) |
| AI analyst grounding | `GET /markets/{id}/`, `/trades/`, `/positions/` | [`server.ts`](server.ts) `buildGroundedContext` |

### Transaction flow (non-custodial)

```
Browser                      DuckCast server               Panta API              Solana
───────                      ───────────────               ─────────              ──────
amount, side ───────────────▶ /api/panta/orders/quote ────▶ /primaryorderquote/
                             /api/panta/orders/build ────▶ /primaryorderbuild/
◀── unsigned instructions + blockhash ─────────────────────
compile v0 tx (fee payer = user)
wallet.signAndSendTransaction ─────────────────────────────────────────────────▶ tx
signature ──────────────────▶ /orders/submit, /orders/verify ▶ /primaryordersubmit/, /primaryorderverify/
                             /trades/report ──────────────▶ /trades/  (attribution)
```

Neither Panta nor DuckCast ever holds keys or funds. See [`src/solana/transactions.ts`](src/solana/transactions.ts) for how Panta's instruction lists are compiled into a wallet-signable v0 transaction.

### Panta API details we handle

- **List rows have no prices** (and sometimes no titles): the feed enriches the top markets with detail calls, cached 30s and shared across all viewers.
- **Prices come as decimals or 1e9-scaled strings**: normalised in `normalizePrice`.
- **Rate limits** (read 120/min, quote 30/min, build 20/min, …): a per-family limiter keeps DuckCast at about 85% of each budget, plus per-IP limits on our own routes.
- **Cursor pagination can loop**: we stop on a repeated cursor.
- **Quotes expire in ~90s, blockhashes in ~60s**: the buy flow re-quotes and builds right before the wallet prompt.
- **Charts**: Panta's trade tape has no per-trade price, so DuckCast snapshots spot prices whenever it reads a market and persists the series (`data/price-history.json`).
- **Error codes** (`QUOTE_STALE`, `AMOUNT_TOO_SMALL`, `MARKET_NOT_IN_PRIMARY`, …) are passed through and shown as human-readable messages.

### Attribution

Per Panta's Terms of Use §6, every Panta-powered surface shows **"Powered by Panta"** linking to panta.market ([`PoweredByPanta`](src/components/panta/PoweredByPanta.tsx)), and every `/api/panta/*` response carries `X-Powered-By: Panta`.

---

## Trust model

| Claim in the UI | How it's verified |
|---|---|
| A trade happened | Real Solana signature, confirmed on our RPC and by Panta's verify endpoint, linked to Solscan |
| A thesis was written by a wallet | ed25519 wallet signature over the market, side, wallet, timestamp and text, verified server-side ([`server/social.ts`](server/social.ts)) |
| "Verified position" badge | Server looks up the author's Panta positions at posting time; the badge only appears if they hold that side |
| AI analysis uses real data | For Panta markets the server ignores client-sent odds and builds context from Panta itself |

If the server has no `PANTA_API_KEY`, DuckCast falls back to clearly labelled **demo data** with trading disabled. It never simulates a transaction.

---

## Running locally

Requirements: Node 22.6+ (Node 24 recommended), a Solana wallet (Phantom, Solflare, Backpack…) with a little SOL and USDC on **mainnet** (Panta markets settle in native USDC on Solana mainnet).

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # http://localhost:3000
```

| Variable | Required | Notes |
|---|---|---|
| `PANTA_API_KEY` | yes (for live mode) | Create via the [Panta quickstart](https://docs.panta.market/quickstart). **Server-side only.** |
| `VITE_PROJECT_ID` | yes | Free Reown/WalletConnect project id from [cloud.reown.com](https://cloud.reown.com). Allow-list `localhost` and your deploy domain. |
| `VITE_SOLANA_RPC_URL` | recommended | A Helius / QuickNode / Alchemy mainnet RPC. The public endpoint is heavily rate-limited. |
| `GEMINI_API_KEY` | optional | Enables the AI analyst; without it the analyst returns a data-only summary. |

Production: `npm run build && npm start` (serves `dist/` and the API from one Node process).

## Demo walkthrough

1. **Predictions** shows live Panta markets with a "Powered by Panta" banner.
2. Open a market. The order slip shows a **live Panta quote** (shares, avg price, protocol fee).
3. **Buy YES** for $1–$5. Approve in your wallet; the progress bar walks Quote → Build → Sign → Submit → Confirm and links the transaction on Solscan.
4. **Sign & Post** a thesis. It appears with a *Verified position* badge because you now hold YES.
5. From a second wallet, buy NO and post an opposing thesis. A **Prediction Battle** appears on the marketplace.
6. **Ask DuckCast AI** for a bull/bear/risk breakdown grounded in the live price, trade tape and your position.
7. **Profile** shows positions marked to Panta prices, resolved results with **Claim** buttons, and transaction receipts.
8. **Create Prediction** publishes a real market through Panta (quote fee → sign → register).

## Project structure

```
server.ts                 Express app: Panta + social routers, grounded Gemini endpoints, Vite/static
server/panta.ts           Panta API proxy: auth, throttling, caching, normalisation, validation
server/social.ts          Wallet-signed theses, verified positions, battles (data/social.json)
src/services/pantaApi.ts  Typed browser client for /api/panta
src/services/pantaAdapter.ts  Panta market → DuckCast view model
src/payments/predictionTransaction.ts  Buy / claim / create flows
src/solana/transactions.ts Compile Panta instructions → v0 tx, sign & broadcast
src/context/MarketsContext.tsx  Live feed (30s refresh) with labelled demo fallback
```

## Known limitations

- Panta's public API covers **primary-phase** buys. Markets that graduate to the secondary order book link out to panta.market for trading.
- Theses and battles are stored in a JSON file on the server, which is fine for the hackathon; a database is the next step.
- The global leaderboard is sample data until enough DuckCast-traded markets resolve.
