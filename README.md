# Riz.Fun. public site

Static HTML/CSS/JS for **Riz.Fun** (`$RIZ`) on **BNB Chain**.

**Brand lock:** hard neo-brutal cream rice-grain + black block sunglasses. Inter Black / grotesque, pure `#000` + cream `#F9F0DF`. Not soft gold Instrument Serif luxury.

Tagline: **Got commodity rizz.** · Memes that pair with commodities. On BNB. · [@RizForFun](https://x.com/RizForFun)

Commodities-first launcher UI: pair memes against a **commodity quote directory** (gold, silver, oil, wheat, corn, coffee…). Day-1 live quotes: **BNB**, **XAUt**, **PAXG**.

## Open locally

```bash
cd web
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/

## Views

| Tab | What |
|-----|------|
| **Home** | Pitch + hero video + DEMO Markets board (pair / quote / mcap / vol / curve / status) |
| **Commodities** | Full quote-asset directory (table + grid); Live / Soon |
| **Create** | Live commodity picker (BNB / XAUt / PAXG) + token details |
| **Rewards** | `#rewards`. Holder fee share + DEMO earnings + DEMO leaderboard |
| **$RIZ** | `#riz`. Protocol token page. 30% buyback leg. MOCK / Soon stats. No fake live address |
| **Docs** | `#about` or `#docs`. How it works, fees, quotes, FAQ. Markdown copies in `docs/` |
| **Token (DEMO)** | `#token/<demoId>` or `?token=<id>`. Chart, buy/sell mock, curve, trades. Local only |

## Assets

- Locked hard logo: `assets/rizfun-logo.png`
- Hero final hold (hands-on-hips + logo black-lens sunglasses): `assets/riz-hero-final-hold.png`
- Logo sunglasses: `assets/riz-glasses-logo.png`
- Grain body (walk anim): `assets/rizfun-grain-body.png`
- Optional brand banner (not shown on homepage): `assets/rizfun-banner.png`
- Quote registry: `commodities.json` (~31 CME-style softs / metals / energy)

## Honest empty state

DEMO Markets board fills from local Create launches. Honest DEMO badges. Explorer stays Soon until real addresses.

## Deploy

GitHub Pages serves `rizfun/rizfun-site` from repo root.
