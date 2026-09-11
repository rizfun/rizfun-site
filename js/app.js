/* Riz.Fun. commodities directory + create UI (frontend only) */
(function () {
  "use strict";

  const FALLBACK_QUOTES = [
    {
      symbol: "BNB",
      name: "BNB",
      mint: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      kind: "native",
      category: "native",
      status: "live",
      enabled: true,
      icon: "🍚",
      vibe: "Native gas · rice narrative on BSC",
    },
    {
      symbol: "XAUt",
      name: "Tether Gold",
      mint: "0x21cAef8A43163Eea865baeE23b9C2E327696A3bf",
      decimals: 6,
      kind: "tokenized_gold",
      category: "metals",
      status: "live",
      enabled: true,
      icon: "✦",
      vibe: "Tokenized gold · XAUt pair on BSC",
    },
    {
      symbol: "PAXG",
      name: "PAX Gold",
      mint: "0x7950865a9140cb519342433146ed5b40c6f210f7",
      decimals: 18,
      kind: "tokenized_gold",
      category: "metals",
      status: "live",
      enabled: true,
      icon: "◈",
      vibe: "Tokenized gold · Binance-peg on BSC",
    },
  ];

  const VIBES = {
    BNB: "Native gas · rice narrative on BSC",
    XAUt: "Tokenized gold · XAUt pair on BSC",
    PAXG: "Tokenized gold · Binance-peg on BSC",
  };

  let quotes = FALLBACK_QUOTES.slice();
  let selectedQuote = "BNB";
  let filterCategory = "ALL";
  let filterStatus = "ALL";
  let feePct = 2;

  /* localStorage DEMO mock only (launches / holdings / rewards). Never secrets. */
  const DEMO_STORAGE_KEY = "rizfun.demoLaunches.v1";
  const DEMO_MCAP_START = 5000;
  const DEMO_MCAP_GRAD = 35000;
  const DEMO_BUY_NAMES = ["anon", "whale", "degen", "ct", "based", "farmer", "sniper", "ape"];
  let demoLaunches = [];
  let marketsFilter = "ALL";
  let demoTickTimer = null;
  let demoImageDataUrl = "";
  let currentTokenId = null;
  let tokenTradeSide = "buy";
  let tokenChartTf = "1m";
  const DEMO_HOLDINGS_KEY = "rizfun.demoHoldings.v1";
  let demoHoldings = {};

  function loadDemoLaunches() {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && x.id && x.name && x.ticker && x.quote)
        .map((x) => ({
          id: String(x.id),
          name: String(x.name).slice(0, 32),
          ticker: String(x.ticker).toUpperCase().slice(0, 10),
          quote: String(x.quote),
          fee: Number(x.fee) || 2,
          mcap: Math.max(DEMO_MCAP_START, Math.min(DEMO_MCAP_GRAD, Number(x.mcap) || DEMO_MCAP_START)),
          volume: Math.max(0, Number(x.volume) || 0),
          createdAt: Number(x.createdAt) || Date.now(),
          imageDataUrl: typeof x.imageDataUrl === "string" ? x.imageDataUrl : "",
          recentBuys: Array.isArray(x.recentBuys)
            ? x.recentBuys.slice(0, 8).map((b) => ({
                who: String((b && b.who) || "anon"),
                amountUsd: Number((b && b.amountUsd) || 0),
                quote: String((b && b.quote) || x.quote || ""),
                at: Number((b && b.at) || Date.now()),
                side: (b && b.side) === "sell" ? "sell" : "buy",
              }))
            : [],
        }));
    } catch (_) {
      return [];
    }
  }

  function saveDemoLaunches() {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoLaunches));
    } catch (err) {
      console.warn("Could not persist demo launches", err);
    }
    try { renderRewardsPanel(); } catch (_) {}
  }

  function loadDemoHoldings() {
    try {
      const raw = localStorage.getItem(DEMO_HOLDINGS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveDemoHoldings() {
    try {
      localStorage.setItem(DEMO_HOLDINGS_KEY, JSON.stringify(demoHoldings));
    } catch (err) {
      console.warn("Could not persist demo holdings", err);
    }
    try { renderRewardsPanel(); } catch (_) {}
  }

  function getHolding(id) {
    return Math.max(0, Number(demoHoldings[id]) || 0);
  }

  function setHolding(id, n) {
    demoHoldings[id] = Math.max(0, Math.round(Number(n) || 0));
    saveDemoHoldings();
  }

  const DEMO_REWARDS_KEY = "rizfun.demoRewards.v1";
  const REWARDS_PERIOD_MS = 15 * 60 * 1000;
  let rewardsCountdownTimer = null;

  function loadDemoRewardsMeta() {
    try {
      const raw = localStorage.getItem(DEMO_REWARDS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveDemoRewardsMeta(meta) {
    try {
      localStorage.setItem(DEMO_REWARDS_KEY, JSON.stringify(meta || {}));
    } catch (err) {
      console.warn("Could not persist demo rewards", err);
    }
  }

  function nextRewardsTick(now) {
    const t = Number(now) || Date.now();
    return Math.ceil((t + 1) / REWARDS_PERIOD_MS) * REWARDS_PERIOD_MS;
  }

  function lastRewardsTick(now) {
    const t = Number(now) || Date.now();
    return Math.floor(t / REWARDS_PERIOD_MS) * REWARDS_PERIOD_MS;
  }

  function formatCountdown(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function formatAgoShort(ts) {
    const d = Math.max(0, Date.now() - Number(ts || 0));
    if (d < 60000) return "just now";
    if (d < 3600000) return Math.floor(d / 60000) + "m ago";
    return Math.floor(d / 3600000) + "h ago";
  }

  function hash01(str) {
    let h = 2166136261;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  }

  function mockAccruedForLaunch(launch, walletAddr) {
    if (!launch) return 0;
    const hold = getHolding(launch.id);
    const vol = Math.max(0, Number(launch.volume) || 0);
    const fee = Math.max(0.5, Number(launch.fee) || 2) / 100;
    const holderShare = 0.4;
    const bagWeight = hold > 0 ? Math.min(1, hold / 250000) : 0.08;
    const base = vol * fee * holderShare * bagWeight;
    const jitter = 0.65 + hash01((walletAddr || "anon") + ":" + launch.id) * 0.7;
    const tickBoost = 0.0008 + hash01(launch.id + ":tick") * 0.0025;
    const ticks = Math.max(1, Math.floor((Date.now() - (launch.createdAt || Date.now())) / REWARDS_PERIOD_MS));
    const accrued = base * jitter + ticks * tickBoost * (0.3 + bagWeight);
    // Keep amounts readable for quote units
    if ((launch.quote || "").toUpperCase() === "BNB") return Math.round(accrued * 10000) / 10000;
    return Math.round(accrued * 100000) / 100000;
  }

  function ensureRewardsMeta(walletAddr) {
    const meta = loadDemoRewardsMeta();
    const key = (walletAddr || "anon").toLowerCase();
    if (!meta[key]) meta[key] = { byId: {} };
    if (!meta[key].byId) meta[key].byId = {};
    let changed = false;
    demoLaunches.forEach((L) => {
      if (!meta[key].byId[L.id]) {
        meta[key].byId[L.id] = {
          accrued: mockAccruedForLaunch(L, walletAddr),
          lastTick: lastRewardsTick(Date.now()),
        };
        changed = true;
      } else {
        // Soft refresh accrued upward toward latest mock so DEMO feels alive
        const next = mockAccruedForLaunch(L, walletAddr);
        const prev = Number(meta[key].byId[L.id].accrued) || 0;
        if (next > prev) {
          meta[key].byId[L.id].accrued = next;
          changed = true;
        }
        const last = lastRewardsTick(Date.now());
        if (Number(meta[key].byId[L.id].lastTick) !== last) {
          meta[key].byId[L.id].lastTick = last;
          changed = true;
        }
      }
    });
    if (changed) saveDemoRewardsMeta(meta);
    return meta[key];
  }

  function updateRewardsCountdown() {
    const el = $("#rewardsCountdown");
    if (!el) return;
    const now = Date.now();
    const next = nextRewardsTick(now);
    el.textContent = formatCountdown(next - now);
  }

  function startRewardsCountdown() {
    updateRewardsCountdown();
    if (rewardsCountdownTimer) clearInterval(rewardsCountdownTimer);
    rewardsCountdownTimer = setInterval(updateRewardsCountdown, 1000);
  }

  function renderRewardsPanel() {
    const disconnected = $("#rewardsDisconnected");
    const connected = $("#rewardsConnected");
    const body = $("#rewardsBody");
    const emptyNote = $("#rewardsEmptyNote");
    const pill = $("#rewardsWalletPill");
    if (!disconnected || !connected || !body) return;

    const w = (window.RizWallet && window.RizWallet.getState && window.RizWallet.getState()) || {};
    const isConnected = !!w.connected && !!w.address;

    disconnected.hidden = isConnected;
    connected.hidden = !isConnected;
    if (!isConnected) {
      body.innerHTML = "";
      return;
    }

    if (pill) pill.textContent = w.truncated || "connected";
    const bag = ensureRewardsMeta(w.address);
    if (!demoLaunches.length) {
      body.innerHTML =
        '<tr><td colspan="5"><div class="empty-state" style="padding:28px 12px">' +
        '<p class="empty-title">No DEMO markets yet</p>' +
        '<p class="empty-sub">Launch a DEMO coin, mock a trade, then check accrued quote here.</p>' +
        '<div class="demo-empty-actions">' +
        '<button type="button" class="btn btn-primary btn-sm" data-goto="create">Launch DEMO</button>' +
        "</div></div></td></tr>";
      if (emptyNote) emptyNote.hidden = false;
      return;
    }
    if (emptyNote) emptyNote.hidden = true;

    body.innerHTML = demoLaunches
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((L) => {
        const row = (bag.byId && bag.byId[L.id]) || {};
        const accrued = Number(row.accrued);
        const amt = Number.isFinite(accrued) ? accrued : mockAccruedForLaunch(L, w.address);
        const hold = getHolding(L.id);
        const quote = escapeHtml(L.quote || "?");
        const last = Number(row.lastTick) || lastRewardsTick(Date.now());
        return (
          "<tr>" +
          '<td><div class="rewards-mkt"><strong>' +
          escapeHtml(L.name) +
          '</strong><span class="mono">$' +
          escapeHtml(L.ticker) +
          "</span></div></td>" +
          '<td class="mono">' +
          quote +
          "</td>" +
          '<td class="mono">' +
          (hold > 0 ? hold.toLocaleString() : "viewer") +
          "</td>" +
          '<td class="mono rewards-accrued">' +
          amt +
          " " +
          quote +
          "</td>" +
          '<td class="mono">' +
          formatAgoShort(last) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function setupRewards() {
    startRewardsCountdown();
    renderRewardsPanel();
    const btn = $("#rewardsConnectBtn");
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.RizWallet && typeof window.RizWallet.connect === "function") {
          window.RizWallet.connect().catch(function () {});
        }
      });
    }
    if (window.RizWallet && typeof window.RizWallet.onChange === "function") {
      window.RizWallet.onChange(function () {
        renderRewardsPanel();
      });
    }
  }


  function showToast(msg) {
    const host = $("#toastHost");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = String(msg || "");
    host.appendChild(el);
    setTimeout(() => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 220);
    }, 2600);
  }

  function findDemoLaunch(id) {
    if (!id) return null;
    return demoLaunches.find((x) => x.id === id) || null;
  }

  function hashSeed(str) {
    let h = 2166136261;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildSparkPoints(launch, tf) {
    const n = tf === "1d" ? 28 : tf === "1h" ? 36 : tf === "5m" ? 40 : 48;
    const seed = hashSeed((launch && launch.id) || "demo") ^ (tf || "1m").length * 97;
    const rnd = mulberry32(seed);
    const end = Math.max(DEMO_MCAP_START, Number(launch && launch.mcap) || DEMO_MCAP_START);
    const pts = [];
    let v = end * (0.72 + rnd() * 0.18);
    for (let i = 0; i < n; i++) {
      const t = i / Math.max(1, n - 1);
      const drift = (end - v) * (0.04 + t * 0.08);
      const noise = (rnd() - 0.48) * end * 0.035;
      v = Math.max(DEMO_MCAP_START * 0.85, v + drift + noise);
      pts.push(v);
    }
    pts[pts.length - 1] = end;
    return pts;
  }

  function renderSparkline(launch) {
    const wrap = $("#tokenChartWrap");
    if (!wrap) return;
    const pts = buildSparkPoints(launch, tokenChartTf);
    const w = 640;
    const h = 220;
    const padX = 8;
    const padY = 16;
    const min = Math.min.apply(null, pts);
    const max = Math.max.apply(null, pts);
    const span = Math.max(1, max - min);
    const coords = pts.map((v, i) => {
      const x = padX + (i / Math.max(1, pts.length - 1)) * (w - padX * 2);
      const y = h - padY - ((v - min) / span) * (h - padY * 2);
      return [x, y];
    });
    const line = coords.map((c, i) => (i ? "L" : "M") + c[0].toFixed(1) + "," + c[1].toFixed(1)).join(" ");
    const area =
      line +
      " L" +
      coords[coords.length - 1][0].toFixed(1) +
      "," +
      (h - 2) +
      " L" +
      coords[0][0].toFixed(1) +
      "," +
      (h - 2) +
      " Z";
    const lastY = coords[coords.length - 1][1];
    wrap.innerHTML =
      '<svg viewBox="0 0 ' +
      w +
      " " +
      h +
      '" preserveAspectRatio="none" role="img" aria-label="Demo sparkline">' +
      '<defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#F9F0DF" stop-opacity="0.35"/>' +
      '<stop offset="100%" stop-color="#F9F0DF" stop-opacity="0"/>' +
      "</linearGradient></defs>" +
      '<path d="' +
      area +
      '" fill="url(#sparkFill)"/>' +
      '<path d="' +
      line +
      '" fill="none" stroke="#F9F0DF" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<line x1="' +
      padX +
      '" x2="' +
      (w - padX) +
      '" y1="' +
      lastY.toFixed(1) +
      '" y2="' +
      lastY.toFixed(1) +
      '" stroke="#3ddc97" stroke-width="1" stroke-dasharray="4 4" opacity="0.85"/>' +
      "</svg>";
  }

  function openTokenPage(id) {
    currentTokenId = id || null;
    const path = id ? "#token/" + encodeURIComponent(id) : "#token";
    if (location.hash !== path) {
      history.replaceState(null, "", path);
    }
    showView("token", { skipHash: true });
    renderTokenPage();
  }

  function renderTokenPage() {
    const empty = $("#tokenEmpty");
    const content = $("#tokenContent");
    const launch = findDemoLaunch(currentTokenId);
    if (!launch) {
      if (empty) empty.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (content) content.hidden = false;

    const pct = curvePct(launch.mcap);
    const av = $("#tokenAvatar");
    if (av) {
      av.className = "token-avatar " + avatarClass(launch.quote);
      if (launch.imageDataUrl) {
        av.innerHTML = '<img src="' + launch.imageDataUrl + '" alt=""/>';
      } else {
        av.textContent = (launch.ticker || "?").slice(0, 4);
      }
    }
    const setTxt = (sel, val) => {
      const el = $(sel);
      if (el) el.textContent = val;
    };
    setTxt("#tokenName", launch.name);
    setTxt("#tokenTicker", "$" + launch.ticker);
    setTxt("#tokenPairPill", "Paired with " + launch.quote);
    setTxt("#tokenFeePill", "Fee " + Number(launch.fee || 2).toFixed(1) + "%");
    setTxt("#tokenMcap", usd(launch.mcap));
    setTxt("#tokenMcapSub", "Curve " + usd(DEMO_MCAP_START) + " to " + usd(DEMO_MCAP_GRAD));
    setTxt("#tokenCurvePct", pct + "%");
    setTxt("#tokenCurveMeta", usd(DEMO_MCAP_START) + " to " + usd(DEMO_MCAP_GRAD));
    const bar = $("#tokenCurveBar");
    if (bar) bar.style.width = pct + "%";
    setTxt("#tokenVol", usd(launch.volume));
    setTxt("#tokenFee", Number(launch.fee || 2).toFixed(1) + "%");
    setTxt("#tokenChartPair", "$" + launch.ticker + " / " + launch.quote);
    setTxt("#tokenPayPill", launch.quote);
    setTxt("#tokenLiqPair", "$" + launch.ticker + " / " + launch.quote);
    setTxt("#tokenContractId", launch.id);
    const hint = $("#tokenAmtHint");
    if (hint) hint.textContent = tokenTradeSide === "buy" ? "(" + launch.quote + ")" : "($ tokens mock)";
    const hold = getHolding(launch.id);
    setTxt("#tokenHoldings", "Bag: " + hold.toLocaleString("en-US") + " $" + launch.ticker);
    updateTradeTabUi();
    renderSparkline(launch);

    const tbody = $("#tokenTradesBody");
    if (tbody) {
      const rows = (launch.recentBuys || []).slice();
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="empty-cell">No trades yet. Hit Buy or Sell.</td></tr>';
      } else {
        tbody.innerHTML = rows
          .map((b) => {
            const side = b.side === "sell" ? "sell" : "buy";
            return (
              "<tr>" +
              '<td class="side-' +
              side +
              ' mono">' +
              side.toUpperCase() +
              "</td>" +
              "<td>" +
              escapeHtml(b.who) +
              "</td>" +
              '<td class="mono">' +
              usd(b.amountUsd) +
              "</td>" +
              '<td class="mono">' +
              escapeHtml(b.quote || launch.quote) +
              "</td>" +
              '<td class="mono">' +
              timeAgo(b.at) +
              "</td>" +
              "</tr>"
            );
          })
          .join("");
      }
    }
  }

  function updateTradeTabUi() {
    $all(".token-trade-tab").forEach((btn) => {
      btn.classList.toggle("on", btn.getAttribute("data-side") === tokenTradeSide);
    });
    const tradeBtn = $("#tokenTradeBtn");
    if (tradeBtn) {
      tradeBtn.textContent = tokenTradeSide === "buy" ? "Buy DEMO" : "Sell DEMO";
      tradeBtn.classList.toggle("sell-mode", tokenTradeSide === "sell");
    }
  }

  function executeDemoTrade() {
    const launch = findDemoLaunch(currentTokenId);
    if (!launch) {
      showToast("No DEMO for that id");
      return;
    }
    const amtEl = $("#tokenTradeAmt");
    const amt = Number(amtEl && amtEl.value);
    if (!(amt > 0)) {
      showToast("Amount needs to be > 0");
      return;
    }

    if (tokenTradeSide === "buy") {
      const usdNotional = Math.round(amt * (launch.quote === "BNB" ? 600 : 2400) * (0.85 + Math.random() * 0.3));
      const tokensOut = Math.max(1, Math.round(usdNotional * (18 + Math.random() * 40)));
      const buy = {
        who: "you",
        amountUsd: Math.max(1, usdNotional),
        quote: launch.quote,
        at: Date.now(),
        side: "buy",
      };
      launch.recentBuys = [buy].concat(launch.recentBuys || []).slice(0, 8);
      launch.volume = Math.round((Number(launch.volume) || 0) + buy.amountUsd);
      const bump = Math.round(buy.amountUsd * (0.4 + Math.random() * 0.85));
      launch.mcap = Math.min(DEMO_MCAP_GRAD, Math.round(Number(launch.mcap) + bump));
      setHolding(launch.id, getHolding(launch.id) + tokensOut);
      saveDemoLaunches();
      renderDemoLaunches();
      renderTokenPage();
      showToast("Bought +" + tokensOut.toLocaleString("en-US") + " $" + launch.ticker + " (DEMO)");
      return;
    }

    const bag = getHolding(launch.id);
    if (bag <= 0) {
      showToast("Bag empty. Buy first.");
      return;
    }
    const sellTokens = Math.min(bag, Math.max(1, Math.round(amt)));
    const usdNotional = Math.max(1, Math.round(sellTokens / (25 + Math.random() * 30)));
    const sell = {
      who: "you",
      amountUsd: usdNotional,
      quote: launch.quote,
      at: Date.now(),
      side: "sell",
    };
    launch.recentBuys = [sell].concat(launch.recentBuys || []).slice(0, 8);
    launch.volume = Math.round((Number(launch.volume) || 0) + usdNotional);
    const drop = Math.round(usdNotional * (0.25 + Math.random() * 0.55));
    launch.mcap = Math.max(DEMO_MCAP_START, Math.round(Number(launch.mcap) - drop));
    setHolding(launch.id, bag - sellTokens);
    saveDemoLaunches();
    renderDemoLaunches();
    renderTokenPage();
    showToast("Sold -" + sellTokens.toLocaleString("en-US") + " $" + launch.ticker + " (DEMO)");
  }

  function setupTokenPage() {
    $all(".token-trade-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        tokenTradeSide = btn.getAttribute("data-side") === "sell" ? "sell" : "buy";
        updateTradeTabUi();
        const launch = findDemoLaunch(currentTokenId);
        if (launch) {
          const hint = $("#tokenAmtHint");
          if (hint) hint.textContent = tokenTradeSide === "buy" ? "(" + launch.quote + ")" : "($ tokens mock)";
        }
      });
    });
    $all(".token-chart-tabs .tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        tokenChartTf = btn.getAttribute("data-tf") || "1m";
        $all(".token-chart-tabs .tab").forEach((t) =>
          t.classList.toggle("active", t.getAttribute("data-tf") === tokenChartTf)
        );
        const launch = findDemoLaunch(currentTokenId);
        if (launch) renderSparkline(launch);
      });
    });
    const tradeBtn = $("#tokenTradeBtn");
    if (tradeBtn) tradeBtn.addEventListener("click", executeDemoTrade);
    const copyBtn = $("#tokenCopyId");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const id = currentTokenId || (($("#tokenContractId") && $("#tokenContractId").textContent) || "");
        if (!id || id === "-" || id === ". ") return;
        try {
          await navigator.clipboard.writeText(id);
          showToast("Copied");
        } catch (_) {
          showToast(id);
        }
      });
    }
  }

  function parseTokenRoute() {
    const params = new URLSearchParams(location.search);
    const q = params.get("token");
    if (q) return { view: "token", id: q };
    const hash = (location.hash || "#home").replace(/^#/, "");
    if (hash.startsWith("token/")) {
      return { view: "token", id: decodeURIComponent(hash.slice(6)) || null };
    }
    if (hash === "token") return { view: "token", id: null };
    return null;
  }

  function usd(n) {
    const v = Math.round(Number(n) || 0);
    return "$" + v.toLocaleString("en-US");
  }

  function curvePct(mcap) {
    const span = DEMO_MCAP_GRAD - DEMO_MCAP_START;
    const p = ((Number(mcap) - DEMO_MCAP_START) / span) * 100;
    return Math.max(0, Math.min(100, Math.round(p)));
  }

  function timeAgo(ts) {
    const sec = Math.max(0, Math.floor((Date.now() - Number(ts)) / 1000));
    if (sec < 5) return "just now";
    if (sec < 60) return sec + "s ago";
    const m = Math.floor(sec / 60);
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    return h + "h ago";
  }

  function randomBuy(quote) {
    const who = DEMO_BUY_NAMES[Math.floor(Math.random() * DEMO_BUY_NAMES.length)];
    const amt = (Math.random() * 180 + 12).toFixed(0);
    return {
      who: who,
      amountUsd: Number(amt),
      quote: quote,
      at: Date.now(),
      side: "buy",
    };
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function demoAvatarHtml(launch) {
    const cls = avatarClass(launch.quote);
    if (launch.imageDataUrl) {
      return (
        '<div class="avatar ' +
        cls +
        '"><img src="' +
        launch.imageDataUrl +
        '" alt=""/></div>'
      );
    }
    const letters = escapeHtml((launch.ticker || "?").slice(0, 4));
    return '<div class="avatar ' + cls + '">' + letters + "</div>";
  }


  function isGraduated(launch) {
    return Number(launch && launch.mcap) >= DEMO_MCAP_GRAD;
  }

  function marketStatusLabel(launch) {
    return isGraduated(launch) ? "Graduated" : "On curve";
  }

  function marketStatusBadge(launch) {
    if (isGraduated(launch)) {
      return '<span class="status-badge live">Graduated</span>';
    }
    return '<span class="status-badge soon">On curve</span>';
  }

  function filteredDemoLaunches() {
    if (marketsFilter === "curve") return demoLaunches.filter((L) => !isGraduated(L));
    if (marketsFilter === "grad") return demoLaunches.filter((L) => isGraduated(L));
    return demoLaunches.slice();
  }

  function marketsRowHtml(launch) {
    const pct = curvePct(launch.mcap);
    const pair = "$" + escapeHtml(launch.ticker) + " / " + escapeHtml(launch.quote);
    return (
      '<tr class="markets-row" data-demo-id="' +
      escapeHtml(launch.id) +
      '" title="Open token" role="link" tabindex="0">' +
      "<td><div class=\"pair\">" +
      demoAvatarHtml(launch) +
      "<div><div class=\"name\">" +
      escapeHtml(launch.name) +
      ' <span class="demo-badge" style="margin-left:6px;vertical-align:middle">DEMO</span></div>' +
      '<div class="sym mono">' +
      pair +
      "</div></div></div></td>" +
      '<td class="mono">' +
      escapeHtml(launch.quote) +
      "</td>" +
      '<td class="mono">' +
      usd(launch.mcap) +
      "</td>" +
      '<td class="mono">' +
      usd(launch.volume) +
      "</td>" +
      '<td class="mcap-cell"><div class="mono">' +
      pct +
      '%</div><div class="progress"><i style="width:' +
      pct +
      '%"></i></div>' +
      '<div class="mcap-meta"><span>' +
      usd(DEMO_MCAP_START) +
      "</span><span>" +
      usd(DEMO_MCAP_GRAD) +
      "</span></div></td>" +
      "<td>" +
      marketStatusBadge(launch) +
      "</td>" +
      "</tr>"
    );
  }

  function bindMarketsRows(root) {
    if (!root) return;
    $all("tr[data-demo-id]", root).forEach((row) => {
      const go = () => openTokenPage(row.getAttribute("data-demo-id"));
      row.addEventListener("click", go);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });
    });
  }

  function renderMarketsFilters() {
    const el = $("#marketsFilters");
    if (!el) return;
    const tabs = [
      ["ALL", "All"],
      ["curve", "On curve"],
      ["grad", "Graduated"],
    ];
    el.innerHTML = tabs
      .map(
        ([id, label]) =>
          '<button type="button" class="tab' +
          (marketsFilter === id ? " active" : "") +
          '" data-mkt-filter="' +
          id +
          '">' +
          label +
          " (DEMO)</button>"
      )
      .join("");
    $all("[data-mkt-filter]", el).forEach((btn) => {
      btn.addEventListener("click", () => {
        marketsFilter = btn.getAttribute("data-mkt-filter") || "ALL";
        renderMarketsFilters();
        renderDemoLaunches();
      });
    });
  }

  function mockWallet(seed) {
    const h = hashSeed(String(seed || "w"));
    const hex = (h.toString(16) + "abcdef0123456789").slice(0, 8);
    return "0x" + hex + "…" + ((h >>> 8) & 0xffff).toString(16).padStart(4, "0");
  }

  function renderRewardsLeaderboard() {
    const body = $("#rewardsLeaderboardBody");
    if (!body) return;
    const rows = [];
    const list = demoLaunches.slice().sort((a, b) => (b.volume || 0) - (a.volume || 0));
    if (!list.length) {
      // still show a few fake wallets so the section is not empty
      for (let i = 0; i < 5; i++) {
        rows.push({
          rank: i + 1,
          wallet: mockWallet("empty-" + i),
          market: " - ",
          ticker: "",
          quote: "BNB",
          accrued: (0.01 + hash01("e" + i) * 0.12).toFixed(4),
        });
      }
      // fix emdash
      rows.forEach((r) => { if (r.market === " - ") r.market = "no market yet"; });
    } else {
      list.slice(0, 8).forEach((L, i) => {
        const accrued = mockAccruedForLaunch(L, mockWallet(L.id + ":lb"));
        rows.push({
          rank: i + 1,
          wallet: mockWallet(L.id + ":top"),
          market: L.name,
          ticker: L.ticker,
          quote: L.quote,
          accrued: accrued,
        });
        if (i < 4) {
          rows.push({
            rank: rows.length + 1,
            wallet: mockWallet(L.id + ":rand"),
            market: L.name,
            ticker: L.ticker,
            quote: L.quote,
            accrued: Math.round(accrued * (0.35 + hash01(L.id + "r") * 0.5) * 1e5) / 1e5,
          });
        }
      });
      rows.sort((a, b) => Number(b.accrued) - Number(a.accrued));
      rows.forEach((r, i) => { r.rank = i + 1; });
    }
    body.innerHTML = rows
      .slice(0, 10)
      .map((r) => {
        const mkt =
          r.ticker
            ? '<div class="rewards-mkt"><strong>' +
              escapeHtml(r.market) +
              '</strong><span class="mono">$' +
              escapeHtml(r.ticker) +
              "</span></div>"
            : '<span class="mono">' + escapeHtml(r.market) + "</span>";
        return (
          "<tr>" +
          '<td class="mono">' +
          r.rank +
          "</td>" +
          '<td class="mono">' +
          escapeHtml(r.wallet) +
          "</td>" +
          "<td>" +
          mkt +
          "</td>" +
          '<td class="mono">' +
          escapeHtml(r.quote) +
          "</td>" +
          '<td class="mono rewards-accrued">' +
          r.accrued +
          " " +
          escapeHtml(r.quote) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function demoCardHtml(launch) {
    const pct = curvePct(launch.mcap);
    const buy = launch.recentBuys && launch.recentBuys[0];
    const buyHtml = buy
      ? '<div class="demo-buy"><span><strong>' +
        escapeHtml(buy.who) +
        "</strong> bought</span><span class=\"buy-amt\">" +
        usd(buy.amountUsd) +
        "</span><span class=\"buy-ago\">" +
        timeAgo(buy.at) +
        "</span></div>"
      : '<div class="demo-buy"><span>Waiting for mock buys...</span></div>';
    return (
      '<article class="demo-card" data-demo-id="' +
      escapeHtml(launch.id) +
      '">' +
      '<div class="demo-card-top">' +
      '<div class="demo-card-identity">' +
      demoAvatarHtml(launch) +
      "<div><div class=\"tok-name\">" +
      escapeHtml(launch.name) +
      '</div><div class="tok-sym mono">$' +
      escapeHtml(launch.ticker) +
      " · " +
      escapeHtml(launch.quote) +
      "</div></div></div>" +
      '<div class="demo-card-badges">' +
      '<span class="demo-badge">DEMO</span>' +
      '<span class="quote-pill">' +
      escapeHtml(launch.quote) +
      "</span></div></div>" +
      '<div class="demo-card-stats">' +
      '<div class="demo-stat"><div class="l">Mock mcap</div><div class="v">' +
      usd(launch.mcap) +
      '</div></div>' +
      '<div class="demo-stat"><div class="l">Mock volume</div><div class="v">' +
      usd(launch.volume) +
      "</div></div></div>" +
      '<div class="demo-curve">' +
      '<div class="demo-curve-meta mono"><span>Bonding curve</span><span>' +
      pct +
      "% · " +
      usd(DEMO_MCAP_START) +
      "→" +
      usd(DEMO_MCAP_GRAD) +
      "</span></div>" +
      '<div class="progress" aria-hidden="true"><i style="width:' +
      pct +
      '%"></i></div></div>' +
      '<div class="demo-fee-split">' +
      '<span>Fee split</span>' +
      '<span class="split-chip">40% holders</span>' +
      '<span class="split-chip">30% $RIZ</span>' +
      '<span class="split-chip">30% protocol</span>' +
      "</div>" +
      '<div class="demo-activity">' +
      '<div class="demo-activity-label mono">Mock recent buys</div>' +
      buyHtml +
      "</div></article>"
    );
  }

  function renderDemoLaunches() {
    const featured = $("#featuredLaunches");
    const tbody = $("#launchesBody");
    const empty = $("#marketsEmpty");
    const countEl = $("#marketsCount");
    const rows = filteredDemoLaunches();

    if (countEl) {
      countEl.textContent = rows.length + " of " + demoLaunches.length + " DEMO";
    }

    if (featured) {
      const board = featured.closest(".markets-board") || featured.parentElement;
      if (!demoLaunches.length) {
        featured.innerHTML = "";
        if (empty) {
          empty.hidden = false;
          empty.innerHTML =
            '<p class="empty-title">Markets is empty</p>' +
            '<p class="empty-sub">Launch a DEMO coin with BNB, XAUt, or PAXG. Rows stay in this browser.</p>' +
            '<div class="demo-empty-actions">' +
            '<button type="button" class="btn btn-primary btn-sm" data-goto="create">Launch DEMO coin</button>' +
            "</div>";
        }
        if (board) board.hidden = true;
      } else if (!rows.length) {
        featured.innerHTML =
          '<tr><td colspan="6" class="empty-cell">No DEMO markets in this filter.</td></tr>';
        if (empty) empty.hidden = true;
        if (board) board.hidden = false;
      } else {
        featured.innerHTML = rows.map(marketsRowHtml).join("");
        if (empty) empty.hidden = true;
        if (board) board.hidden = false;
        bindMarketsRows(featured);
      }
      if (empty) {
        $all("[data-goto]", empty).forEach((el) => {
          el.addEventListener("click", (e) => {
            e.preventDefault();
            const id = el.getAttribute("data-goto");
            if (id) showView(id);
          });
        });
      }
    }

    if (tbody) {
      if (!demoLaunches.length) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="empty-cell">No DEMO coins yet. Use Launch to add a mock row.</td></tr>';
      } else {
        tbody.innerHTML = demoLaunches.map(marketsRowHtml).join("");
        bindMarketsRows(tbody);
      }
    }

    try { renderRewardsLeaderboard(); } catch (_) {}

    const tokenView = $("#view-token");
    if (tokenView && tokenView.classList.contains("active") && currentTokenId) {
      renderTokenPage();
    }
  }

  function tickDemoActivity() {
    if (!demoLaunches.length) return;
    let changed = false;
    demoLaunches.forEach((launch) => {
      if (Math.random() > 0.55) return;
      const buy = randomBuy(launch.quote);
      launch.recentBuys = [buy].concat(launch.recentBuys || []).slice(0, 5);
      launch.volume = Math.round((Number(launch.volume) || 0) + buy.amountUsd);
      const bump = Math.round(buy.amountUsd * (0.35 + Math.random() * 0.9));
      launch.mcap = Math.min(DEMO_MCAP_GRAD, Math.round(Number(launch.mcap) + bump));
      changed = true;
    });
    if (changed) {
      saveDemoLaunches();
      renderDemoLaunches();
    } else {
      /* still refresh "ago" labels */
      renderDemoLaunches();
    }
    const tokenView = $("#view-token");
    if (tokenView && tokenView.classList.contains("active") && currentTokenId) {
      renderTokenPage();
    }
  }

  function startDemoTicker() {
    if (demoTickTimer) clearInterval(demoTickTimer);
    demoTickTimer = setInterval(tickDemoActivity, 3500);
  }

  function createDemoLaunchFromForm() {
    const nameEl = $("#tokName");
    const tickEl = $("#tokTicker");
    const msg = $("#createMsg");
    const name = (nameEl && nameEl.value.trim()) || "";
    const ticker = (tickEl && tickEl.value.trim().toUpperCase()) || "";
    if (!name || !ticker) {
      if (msg) {
        msg.textContent = "Add a name and ticker to launch a DEMO coin.";
        msg.hidden = false;
      }
      return false;
    }
    const q = quotes.find((x) => x.symbol === selectedQuote);
    if (!isLive(q)) {
      if (msg) {
        msg.textContent = "Pick a live quote: BNB, XAUt, or PAXG.";
        msg.hidden = false;
      }
      return false;
    }
    const firstBuyRaw = ($("#firstBuy") && $("#firstBuy").value.trim()) || "0";
    const firstBuy = Number(firstBuyRaw) > 0 ? Number(firstBuyRaw) : 0;
    const seedMcap = Math.min(
      DEMO_MCAP_GRAD - 500,
      DEMO_MCAP_START + Math.round(800 + Math.random() * 4200) + (firstBuy > 0 ? 900 : 0)
    );
    const launch = {
      id: "demo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      name: name.slice(0, 32),
      ticker: ticker.slice(0, 10),
      quote: selectedQuote,
      fee: feePct,
      mcap: seedMcap,
      volume: Math.round(200 + Math.random() * 1800) + (firstBuy > 0 ? 400 : 0),
      createdAt: Date.now(),
      imageDataUrl: demoImageDataUrl || "",
      recentBuys: [randomBuy(selectedQuote)],
    };
    demoLaunches.unshift(launch);
    if (demoLaunches.length > 24) demoLaunches = demoLaunches.slice(0, 24);
    saveDemoLaunches();
    renderDemoLaunches();
    if (msg) {
      msg.textContent =
        "DEMO coin “" +
        launch.name +
        "” ($" +
        launch.ticker +
        ") added to Markets. Local DEMO only.";
      msg.hidden = false;
    }
    showView("home");
    const board = $("#featuredLaunches");
    if (board) board.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  window.RizDemo = {
    createFromForm: createDemoLaunchFromForm,
    render: renderDemoLaunches,
    openToken: openTokenPage,
    list: function () {
      return demoLaunches.slice();
    },
  };


  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function isLive(q) {
    if (!q) return false;
    if (q.status === "live") return true;
    if (q.status === "soon") return false;
    return q.enabled !== false;
  }

  function liveQuotes() {
    return quotes.filter(isLive);
  }

  function avatarClass(quote) {
    const q = (quote || "").toLowerCase();
    if (q === "bnb" || q === "xaut" || q === "paxg") return q;
    return "";
  }

  function categoryClass(q) {
    const c = ((q && q.category) || "").toLowerCase();
    if (c === "native" || c === "metals" || c === "energy" || c === "agriculture") return "cat-" + c;
    const sym = ((q && q.symbol) || "").toLowerCase();
    if (sym === "bnb") return "cat-native";
    if (["xaut", "paxg", "xag", "xpt", "xpd", "copper", "alu", "iron", "li"].includes(sym))
      return "cat-metals";
    if (["wti", "brent", "ng", "coal", "u", "oil"].includes(sym)) return "cat-energy";
    return "cat-agriculture";
  }

  function categoryLabel(q) {
    const c = ((q && q.category) || "").toLowerCase();
    if (c === "native") return "Native";
    if (c === "metals") return "Metals";
    if (c === "energy") return "Energy";
    if (c === "agriculture") return "Agriculture";
    return q && q.kind === "native" ? "Native" : "Commodity";
  }

  function quoteIcon(q) {
    if (q && q.icon) return q.icon;
    return q && q.symbol ? q.symbol.slice(0, 4) : "?";
  }

  function quoteMeta(symbol) {
    const q = quotes.find((x) => x.symbol === symbol);
    return {
      symbol: symbol,
      name: (q && q.name) || symbol,
      vibe: (q && (q.vibe || q.notes)) || VIBES[symbol] || "",
      kind: (q && q.kind) || "",
      category: (q && q.category) || "",
    };
  }

  function displayName(q) {
    if (!q) return "";
    if (q.symbol === "BNB") return "BNB";
    if (q.symbol === "XAUt") return "Gold (XAUt)";
    if (q.symbol === "PAXG") return "Gold (PAXG)";
    return q.name || q.symbol;
  }

  function shortDesc(q) {
    return (q && (q.vibe || q.notes)) || "";
  }

  function filteredQuotes() {
    return quotes.filter((q) => {
      const cat = ((q.category || "").toLowerCase() || "other");
      const catOk =
        filterCategory === "ALL" ||
        (filterCategory === "native" && cat === "native") ||
        (filterCategory === "metals" && cat === "metals") ||
        (filterCategory === "energy" && cat === "energy") ||
        (filterCategory === "agriculture" && cat === "agriculture");
      const live = isLive(q);
      const statusOk =
        filterStatus === "ALL" ||
        (filterStatus === "live" && live) ||
        (filterStatus === "soon" && !live);
      return catOk && statusOk;
    });
  }

  function showView(id, opts) {
    opts = opts || {};
    if (id === "docs") id = "about";
    $all(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + id));
    $all(".nav-btn[data-view]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-view") === id)
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!opts.skipHash) {
      if (id === "token") {
        const path = currentTokenId ? "#token/" + encodeURIComponent(currentTokenId) : "#token";
        if (location.hash !== path) history.replaceState(null, "", path);
      } else if (location.hash !== "#" + id) {
        history.replaceState(null, "", "#" + id);
      }
    }
    if (id === "token") renderTokenPage();
    if (id === "rewards") { renderRewardsPanel(); renderRewardsLeaderboard(); }
    if (id === "home") renderDemoLaunches();
  }

  function selectCommodity(symbol, opts) {
    opts = opts || {};
    const q = quotes.find((x) => x.symbol === symbol);
    if (!isLive(q)) return;
    selectedQuote = symbol;
    renderCreateQuotes();
    updateSummary();
    renderCommodityGallery();
    renderDirectory();
    if (opts.go === "create") {
      showView("create");
    } else if (opts.go === "commodities") {
      showView("commodities");
    }
  }

  function updateCatalogStats() {
    const live = liveQuotes().length;
    const total = quotes.length;
    const v = $("#statQuotesValue");
    const s = $("#statQuotesSub");
    if (v) v.textContent = String(total);
    if (s) s.textContent = live + " live · " + (total - live) + " soon";
    const countEl = $("#directoryCount");
    if (countEl) {
      const n = filteredQuotes().length;
      countEl.textContent = n + " of " + total + " commodities";
    }
  }

  function commodityCardHtml(q) {
    const live = isLive(q);
    const cls = [avatarClass(q.symbol), categoryClass(q), live ? "live" : "soon"]
      .filter(Boolean)
      .join(" ");
    const vibe = shortDesc(q);
    const badge = live
      ? '<span class="status-badge live">Live</span>'
      : '<span class="status-badge soon">Soon</span>';
    const hint = live
      ? '<span class="cta-hint">Use in Create →</span>'
      : '<span class="cta-hint soon-hint">Registry · quote TBD</span>';
    const tag = live ? "button" : "div";
    const typeAttr = live ? ' type="button"' : "";
    const dataAttr = live ? ' data-commodity="' + q.symbol + '"' : ' aria-disabled="true"';
    return (
      "<" +
      tag +
      typeAttr +
      ' class="commodity-card ' +
      cls +
      '"' +
      dataAttr +
      ">" +
      '<div class="card-top">' +
      '<div class="icon">' +
      quoteIcon(q) +
      "</div>" +
      badge +
      "</div>" +
      '<div class="sym">' +
      displayName(q) +
      "</div>" +
      '<div class="name"><span class="cat-pill">' +
      categoryLabel(q) +
      "</span> · " +
      q.symbol +
      "</div>" +
      '<p class="vibe">' +
      vibe +
      "</p>" +
      hint +
      "</" +
      tag +
      ">"
    );
  }

  function renderCommodityGallery() {
    /* Home no longer lists commodities. full catalog is view-commodities only. */
    const el = $("#homeLiveQuotes");
    if (!el) return;
    const live = (STATE.commodities || []).filter(function (c) {
      return String(c.status || "").toLowerCase() === "live";
    }).slice(0, 3);
    if (!live.length) {
      el.innerHTML = '<p class="mono" style="color:var(--muted);font-size:.8rem">No live quotes yet.</p>';
      return;
    }
    el.innerHTML = live.map(function (c) {
      const sym = escapeHtml(c.symbol || c.ticker || "?");
      const name = escapeHtml(c.name || "");
      return (
        '<button type="button" class="live-quote-chip" data-goto="create" title="Create against ' + sym + '">' +
          '<span class="dot-live" aria-hidden="true"></span>' +
          '<span><span class="sym mono">' + sym + '</span>' +
          '<div class="meta">' + name + ' · Live</div></span>' +
        '</button>'
      );
    }).join("");
  }

  function renderDirectoryFilters() {
    const catEl = $("#dirCategoryFilters");
    const statusEl = $("#dirStatusFilters");
    if (catEl) {
      const cats = [
        ["ALL", "All"],
        ["native", "Native"],
        ["metals", "Metals"],
        ["energy", "Energy"],
        ["agriculture", "Agriculture"],
      ];
      catEl.innerHTML = cats
        .map(
          ([id, label]) =>
            '<button type="button" class="tab' +
            (filterCategory === id ? " active" : "") +
            '" data-dir-cat="' +
            id +
            '">' +
            label +
            "</button>"
        )
        .join("");
      $all("[data-dir-cat]", catEl).forEach((btn) => {
        btn.addEventListener("click", () => {
          filterCategory = btn.getAttribute("data-dir-cat");
          renderDirectoryFilters();
          renderDirectory();
          updateCatalogStats();
        });
      });
    }
    if (statusEl) {
      const statuses = [
        ["ALL", "All status"],
        ["live", "Live"],
        ["soon", "Soon"],
      ];
      statusEl.innerHTML = statuses
        .map(
          ([id, label]) =>
            '<button type="button" class="tab' +
            (filterStatus === id ? " active" : "") +
            '" data-dir-status="' +
            id +
            '">' +
            label +
            "</button>"
        )
        .join("");
      $all("[data-dir-status]", statusEl).forEach((btn) => {
        btn.addEventListener("click", () => {
          filterStatus = btn.getAttribute("data-dir-status");
          renderDirectoryFilters();
          renderDirectory();
          updateCatalogStats();
        });
      });
    }
  }

  function renderDirectory() {
    const tbody = $("#directoryBody");
    const grid = $("#directoryGrid");
    const rows = filteredQuotes();
    updateCatalogStats();

    if (tbody) {
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="empty-cell">No commodities match these filters.</td></tr>';
      } else {
        tbody.innerHTML = rows
          .map((q) => {
            const live = isLive(q);
            const badge = live
              ? '<span class="status-badge live">Live</span>'
              : '<span class="status-badge soon">Soon</span>';
            const action = live
              ? '<button type="button" class="btn btn-ghost btn-sm" data-goto-create-with="' +
                q.symbol +
                '">Create</button>'
              : '<span class="muted-action">Soon</span>';
            return (
              "<tr class=\"" +
              (live ? "row-live" : "row-soon") +
              "\">" +
              "<td><div class=\"pair\">" +
              '<div class="avatar ' +
              avatarClass(q.symbol) +
              " " +
              categoryClass(q) +
              '">' +
              quoteIcon(q) +
              "</div>" +
              "<div><div class=\"name\">" +
              displayName(q) +
              '</div><div class="sym mono">' +
              categoryLabel(q) +
              "</div></div></div></td>" +
              '<td class="mono">' +
              q.symbol +
              "</td>" +
              "<td><span class=\"cat-pill\">" +
              categoryLabel(q) +
              "</span></td>" +
              "<td>" +
              badge +
              "</td>" +
              '<td class="desc-cell">' +
              shortDesc(q) +
              '</td>' +
              "<td>" +
              action +
              "</td>" +
              "</tr>"
            );
          })
          .join("");
        $all("[data-goto-create-with]", tbody).forEach((btn) => {
          btn.addEventListener("click", () => {
            selectCommodity(btn.getAttribute("data-goto-create-with"), { go: "create" });
          });
        });
      }
    }

    if (grid) {
      grid.innerHTML = rows.map(commodityCardHtml).join("");
      $all("[data-commodity]", grid).forEach((btn) => {
        btn.addEventListener("click", () => {
          selectCommodity(btn.getAttribute("data-commodity"), { go: "create" });
        });
      });
    }
  }

  function renderLaunchesEmpty() {
    renderDemoLaunches();
  }

  function renderCreateQuotes() {
    const el = $("#quotePicker");
    if (!el) return;
    const enabled = liveQuotes();
    if (!enabled.find((q) => q.symbol === selectedQuote) && enabled[0]) {
      selectedQuote = enabled[0].symbol;
    }
    el.innerHTML = enabled
      .map((q) => {
        const on = q.symbol === selectedQuote ? " on" : "";
        const cls = avatarClass(q.symbol);
        const vibe = q.vibe || VIBES[q.symbol] || "";
        return (
          '<button type="button" class="quote ' +
          cls +
          on +
          '" data-symbol="' +
          q.symbol +
          '">' +
          '<div class="icon-sm">' +
          quoteIcon(q) +
          "</div>" +
          '<div class="t">' +
          displayName(q) +
          "</div>" +
          '<div class="d">' +
          vibe +
          "</div>" +
          "</button>"
        );
      })
      .join("");
    $all(".quote", el).forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedQuote = btn.getAttribute("data-symbol");
        renderCreateQuotes();
        updateSummary();
      });
    });
  }

  function updateSummary() {
    const meta = quoteMeta(selectedQuote);
    const name = ($("#tokName") && $("#tokName").value.trim()) || ". ";
    const tickerRaw = ($("#tokTicker") && $("#tokTicker").value.trim().toUpperCase()) || "";
    const firstBuy = ($("#firstBuy") && $("#firstBuy").value.trim()) || "0";

    const feeEl = $("#sumFee");
    const quoteEl = $("#sumQuote");
    const nameEl = $("#sumName");
    const tickEl = $("#sumTicker");
    if (feeEl) feeEl.textContent = feePct.toFixed(1) + "%";
    if (quoteEl) quoteEl.textContent = selectedQuote;
    if (nameEl) nameEl.textContent = name;
    if (tickEl) tickEl.textContent = tickerRaw ? "$" + tickerRaw : ". ";
    const fb = $("#sumFirstBuy");
    if (fb)
      fb.textContent =
        firstBuy && Number(firstBuy) > 0 ? firstBuy + " " + selectedQuote : "None";

    const badge = $("#sumPairBadge");
    const pairName = $("#sumPairName");
    if (badge) {
      badge.className = "pair-badge " + avatarClass(selectedQuote);
      badge.textContent = selectedQuote.slice(0, 4);
    }
    if (pairName) pairName.textContent = displayName(meta);
  }

  function setupCreateForm() {
    const feeInput = $("#feeRange");
    const feeVal = $("#feeVal");
    if (feeInput) {
      feeInput.addEventListener("input", () => {
        feePct = Number(feeInput.value);
        if (feeVal) feeVal.textContent = feePct.toFixed(1) + "%";
        updateSummary();
      });
    }
    ["tokName", "tokTicker", "firstBuy"].forEach((id) => {
      const el = $("#" + id);
      if (el) el.addEventListener("input", updateSummary);
    });
    const ticker = $("#tokTicker");
    if (ticker) {
      ticker.addEventListener("input", () => {
        ticker.value = ticker.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
        updateSummary();
      });
    }
    const imgInput = $("#tokImage");
    const preview = $("#imgPreview");
    if (imgInput && preview) {
      imgInput.addEventListener("change", () => {
        const file = imgInput.files && imgInput.files[0];
        if (!file) {
          preview.classList.remove("show");
          preview.removeAttribute("src");
          demoImageDataUrl = "";
          return;
        }
        if (file.size > 400000) {
          const msg = $("#createMsg");
          if (msg) {
            msg.textContent = "Image too large for DEMO storage. try under ~400KB.";
            msg.hidden = false;
          }
          imgInput.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          demoImageDataUrl = String(reader.result || "");
          preview.src = demoImageDataUrl;
          preview.classList.add("show");
        };
        reader.readAsDataURL(file);
      });
    }
    const form = $("#createForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        createDemoLaunchFromForm();
      });
    }
  }

  function setupNav() {
    document.addEventListener("click", (e) => {
      const jump = e.target && e.target.closest && e.target.closest("[data-docs-jump]");
      if (jump) {
        e.preventDefault();
        const targetId = jump.getAttribute("data-docs-jump");
        showView("about");
        const node = targetId && document.getElementById(targetId);
        if (node) setTimeout(() => node.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
        return;
      }
      const el = e.target && e.target.closest && e.target.closest(".nav-btn[data-view], [data-goto]");
      if (!el) return;
      e.preventDefault();
      let id = el.getAttribute("data-view") || el.getAttribute("data-goto");
      if (!id) return;
      if (id === "docs") id = "about";
      if (id !== "token") currentTokenId = null;
      showView(id);
    });
    const applyRoute = () => {
      const tokenRoute = parseTokenRoute();
      if (tokenRoute) {
        currentTokenId = tokenRoute.id;
        showView("token", { skipHash: true });
        return;
      }
      const hash = (location.hash || "#home").replace("#", "");
      const allowed = ["home", "commodities", "create", "rewards", "riz", "about", "docs"];
      const legacy = { markets: "home", launches: "home", docs: "about", "view-rewards": "rewards", "view-riz": "riz" };
      const resolved = legacy[hash] || hash;
      currentTokenId = null;
      showView(allowed.includes(resolved) ? resolved : "home", { skipHash: true });
    };
    applyRoute();
    window.addEventListener("hashchange", applyRoute);
    window.addEventListener("popstate", applyRoute);
  }

  async function loadQuotes() {
    try {
      const res = await fetch("commodities.json", { cache: "no-store" });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (data && Array.isArray(data.quotes) && data.quotes.length) {
        quotes = data.quotes.map((q) => ({
          ...q,
          status: q.status || (q.enabled === false ? "soon" : "live"),
          category: q.category || (q.kind === "native" ? "native" : "metals"),
          vibe: q.vibe || VIBES[q.symbol] || q.notes || "",
        }));
      }
    } catch (err) {
      console.warn("Using embedded quote registry fallback", err);
      quotes = FALLBACK_QUOTES.slice();
    }
  }

  async function init() {
    setupNav();
    setupCreateForm();
    setupTokenPage();
    setupRewards();
    demoLaunches = loadDemoLaunches();
    demoHoldings = loadDemoHoldings();
    await loadQuotes();
    updateCatalogStats();
    renderCommodityGallery();
    renderDirectoryFilters();
    renderDirectory();
    renderMarketsFilters();
    renderDemoLaunches();
    renderRewardsLeaderboard();
    startDemoTicker();
    renderCreateQuotes();
    updateSummary();
    const submit = $("#createSubmit");
    if (submit) {
      submit.disabled = false;
      submit.dataset.mode = "demo";
      submit.textContent = "Launch DEMO coin";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();



// Imagine hero: play once, hold last frame (tagline baked in video)
(function () {
  var v = document.getElementById("rizImagine");
  if (!v) return;
  v.addEventListener("ended", function () {
    try { v.pause(); if (isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.04); } catch (e) {}
  });
})();
