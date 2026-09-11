# Riz.Fun — brief complet pour ChatGPT (11 sept 2026)

Tu aides OxAkatsukiBOT (France). Il ne code pas. Pain (Grok Bot) build. Coller ce brief tel quel.

## En une phrase
Riz.Fun = launcher memecoins sur **BNB Chain (BSC)** où chaque meme est **pairé à une commodity** (or, BNB, etc.), pas seulement à BNB. Inspiration produit: commodites.market / CME. **Pas un clone UI.** Fork contrats Pons (MIT) côté protocole. Brand: grain de riz cream + lunettes noires, tagline **Got commodity rizz.** Site public en anglais crypto UX, audience mondiale (pas de wording “English CT” public).

## Liens publics
- Site (GitHub Pages): https://rizfun.github.io/rizfun-site/
- Repo site: https://github.com/rizfun/rizfun-site (compte GitHub **@rizfun**, PAS akatsukibot)
- Repo code principal (si utilisé): https://github.com/rizfun/rizfun
- X: https://x.com/RizForFun
- Ref concurrent: https://www.commodites.market/ et https://www.commodites.market/rewards

## Statut honnête
- **UI = DEMO** (localStorage, faux buys, pas de txs on-chain).
- **Contrats = local Foundry seulement** (tests verts). **Aucun deploy live / testnet broadcast.**
- Scripts deploy **refusent** `PRIVATE_KEY` / broadcast tant que l’user n’a pas dit GO (ça coûte du BNB).
- Jamais demander ni stocker une **seed phrase**.

---

## Décisions produit LOCK (ne pas contredire)

### Chain & graduation
- Chain: **BSC**
- Buy gas: **BNB** natif
- Pairing: meme vs **commodity quote** (live day-1: **BNB, XAUt, PAXG**; reste Soon dans le directory)
- Bonding curve cible: ~**$5k → ~$35k**, supply fixe **1B**
- Graduation: **Uniswap v4 sur BSC** (hook fees post-grad). **Pancake n’est PAS le défaut** (user a choisi Uni pour garder les fees lifetime via hook)
- LP: locked / pas de withdraw style locker

### Fees
- Trading fee create: bande **1–3%** (UI)
- Split cible des fees (jambe quote):
  - **40%** holders du marché, payés **dans la commodity pairée**
  - **30%** buyback **$RIZ**
  - **30%** protocol
  - **Creator 0%**
- Cadence rewards cible (comme CME rewards): **toutes les 15 minutes**, auto, **nothing to claim** (pas encore live on-chain; simu Foundry + page Rewards DEMO)

### Brand
- Nom: **Riz.Fun** · ticker protocol: **$RIZ**
- Tagline: **Got commodity rizz.**
- Bio vibe: Memes that pair with commodities. On BNB.
- **INTERDIT public:** “rice + rizz” copy
- **INTERDIT public:** “English CT”
- Couleur cream site alignée phrase anim: **`#F9F0DF`**
- Hero: vidéo Imagine grain + lunettes logo + phrase baked (mp4 sur le site)
- Ton copy: humain, pas style IA, **pas de tirets longs em dash (—)**

### Sécu (priorité user)
- Max sécu avant argent réel
- Pas de clés dans le frontend
- Wallet = provider injecté seulement (MetaMask/Rabby/Binance)
- Mainnet seulement après checklist / review (idéalement audit payant plus tard) + treasury wallet neuf (multisig recommandé)
- DEMO clairement non-custodial mock

---

## Site — ce qui existe (Pages)

Nav typique: Home · Commodities · Launch · Rewards · Docs · Connect Wallet

### Home
- Hero + vidéo brand
- **PAS** la liste complète des commodities (user a refusé)
- Board **DEMO coins** (créés en local)
- Stats marketing (curve, $RIZ, etc.)

### Commodities
- Directory complet (metals/energy/ag + Soon)
- Live créables: BNB / XAUt / PAXG

### Launch
- Formulaire “**Launch a DEMO coin**” (plus “create a launch”)
- Quote live + name/ticker + fee
- Ajoute une carte DEMO en localStorage (pas de tx)

### Token page DEMO
- Route: `#token/<demoId>`
- Chart mock, courbe $5k→$35k, buy/sell DEMO (mock), trades récents, badge DEMO
- Style esprit commodites.market/token/... mais brand Riz.Fun

### Rewards DEMO
- Route: `#rewards`
- Pitch holders 40% en commodity / 15 min / nothing to claim
- Split chips 40/30/30
- Earnings mock si wallet connecté
- Protocol not live

### Docs
- Route: `#about` (alias `#docs`)
- How it works · Fees · Quotes · FAQ · About
- Markdown aussi sous `/docs/*.md` sur le repo (pas d’onglet “docs/*.md” dans l’UI)

### En cours / à venir gratuit (peut arriver juste après ce brief)
- Markets board plus “exchange” (On curve / Graduated mock)
- Page protocol **$RIZ** (TVL/burn mock Soon)
- Leaderboard Rewards mock
- Explorer links Soon (BscScan pattern)
- Section Security docs + SECURITY.md Foundry

---

## Code contrats — local Foundry

Path machine Pain: `/workspace/akatsuki/orefun/bsc/riz-foundry/`

### Stack
- Foundry
- Couche **V6**: factory / fee hook / position seeder / range math / launcher token / locker
- Couche **commodity**: `CommodityCoin`, `MockOracle`, `HolderFeeDistributor`
- Tests e2e demo: `make demo` ou `forge test --match-contract RizDemoFlow -vvv`

### Commandes
```bash
cd /workspace/akatsuki/orefun/bsc/riz-foundry
forge test
make demo
```

### État tests (11 sept 2026)
**34 passed, 0 failed** (suites: CommodityCoin, RizDemoFlow, DeployRizV6Path, RizFeeHook, RizLaunchFactory, RizPositionSeeder, RizV6RangeMath)

Inclut tests rewards 2 rounds + warp **15 minutes**.

### Deploy
- Scripts: `script/DeployRizV6.s.sol`, `DeployRizBsc.s.sol`, etc.
- **Dry-run only** tant que pas de GO user
- Refus broadcast / PRIVATE_KEY volontaire

### Adresses Uniswap v4 BSC (infra existante, pas “nos” contrats)
- PoolManager référence doc: `0x28e2ea090877bf75740558f6bfb36a5ffee9e9df`
- Factory/hook Riz.Fun: **n’existent qu’après vrai broadcast**. Ne pas inventer.

---

## Comparaison vs commodites.market (gap)

Eux live: markets on-chain, launch réel, token pages, rewards auto + USDG, TVL, graduated, burn/exchange coin, explorer.

Nous: UX DEMO ~largement couverte (launch/token/rewards/docs/commodities). Trou principal = **on-chain live** (deploy, trading réel, distributor 15 min réel, oracles, cashout stable).

---

## Ce que ChatGPT doit faire / ne pas faire

**Faire**
- Aider à reviewer architecture, checklist sécu, copy, plan deploy testnet
- Proposer améliorations UI/produit cohérentes avec les LOCKS
- Expliquer simplement à l’user non-dev

**Ne pas faire**
- Inventer des adresses contrats Riz.Fun “live”
- Dire que le trading est live
- Remettre Pancake comme graduation par défaut
- Remettre “rice + rizz” ou “English CT” en public
- Demander une seed
- Contredire fee split 40/30/30 ou Uni v4 BSC

---

## Prochaines étapes (ordre logique)

### Gratuit (UI / local)
1. Finir Markets mock + page $RIZ + leaderboard + Security docs
2. Durcir tests / SECURITY.md
3. CT organique @RizForFun (vidéo hero déjà dispo)

### Payant / user GO
1. Treasury wallet neuf (jamais seed dans le chat)
2. Review sécu scripts deploy
3. Broadcast testnet puis mainnet (BNB)
4. Brancher site Create/Buy/Sell/Rewards sur adresses réelles
5. Audit externe recommandé avant gros TVL

---

## Fichiers utiles (côté Pain)
- Site working copy: `/workspace/akatsuki/orefun/bsc/web/`
- Brand/logo: `/workspace/akatsuki/orefun/bsc/brand/`
- Hero mp4: `web/assets/riz-hero-imagine.mp4` (latest avec tagline)
- Handoff dossier: `/workspace/akatsuki/orefun/bsc/RIZFUN-HANDOFF/`
- Foundry DEMO note: `riz-foundry/DEMO.md`

Fin du brief.
