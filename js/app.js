/* Riz.Fun — commodities directory + create UI (frontend only) */
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

  const DEMO_STORAGE_KEY = "rizfun.demoLaunches.v1";
  const DEMO_MCAP_START = 5000;
  const DEMO_MCAP_GRAD = 35000;
  const DEMO_BUY_NAMES = ["anon", "whale", "degen", "ct", "based", "farmer", "sniper", "ape"];
  let demoLaunches = [];
  let demoTickTimer = null;
  let demoImageDataUrl = "";

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
          recentBuys: Array.isArray(x.recentBuys) ? x.recentBuys.slice(0, 6) : [],
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
      : '<div class="demo-buy"><span>Waiting for mock buys…</span></div>';
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

    if (featured) {
      if (!demoLaunches.length) {
        featured.innerHTML =
          '<div class="empty-state">' +
          '<p class="empty-title">Demo board is empty</p>' +
          '<p class="empty-sub">Create a local DEMO launch with a live quote (BNB / XAUt / PAXG). Cards stay in this browser only — protocol is not live.</p>' +
          '<div class="demo-empty-actions">' +
          '<button type="button" class="btn btn-primary btn-sm" data-goto="create">Create DEMO launch</button>' +
          "</div></div>";
      } else {
        featured.innerHTML = demoLaunches.map(demoCardHtml).join("");
      }
      $all("[data-goto]", featured).forEach((el) => {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          const id = el.getAttribute("data-goto");
          if (id) showView(id);
        });
      });
    }

    if (tbody) {
      if (!demoLaunches.length) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="empty-cell">No DEMO launches yet — use Create to add a mock card.</td></tr>';
      } else {
        tbody.innerHTML = demoLaunches
          .map((launch, i) => {
            const pct = curvePct(launch.mcap);
            return (
              "<tr>" +
              '<td class="mono">' +
              (i + 1) +
              "</td>" +
              "<td><div class=\"pair\">" +
              demoAvatarHtml(launch) +
              "<div><div class=\"name\">" +
              escapeHtml(launch.name) +
              ' <span class="demo-badge" style="margin-left:6px;vertical-align:middle">DEMO</span></div>' +
              '<div class="sym mono">$' +
              escapeHtml(launch.ticker) +
              "</div></div></div></td>" +
              '<td class="mono">' +
              escapeHtml(launch.quote) +
              "</td>" +
              '<td class="mcap-cell"><div class="mono">' +
              usd(launch.mcap) +
              '</div><div class="progress"><i style="width:' +
              pct +
              '%"></i></div>' +
              '<div class="mcap-meta"><span>' +
              pct +
              "%</span><span>" +
              usd(DEMO_MCAP_GRAD) +
              "</span></div></td>" +
              '<td class="mono">' +
              usd(launch.volume) +
              "</td>" +
              '<td><span class="status-badge soon">DEMO · not on-chain</span></td>' +
              "</tr>"
            );
          })
          .join("");
      }
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
        msg.textContent = "Add a name and ticker to create a DEMO launch.";
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
        "DEMO launch “" +
        launch.name +
        "” ($" +
        launch.ticker +
        ") added to Markets. Local only — not on-chain.";
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

  function showView(id) {
    $all(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + id));
    $all(".nav-btn[data-view]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-view") === id)
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (location.hash !== "#" + id) {
      history.replaceState(null, "", "#" + id);
    }
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
    const name = ($("#tokName") && $("#tokName").value.trim()) || "—";
    const tickerRaw = ($("#tokTicker") && $("#tokTicker").value.trim().toUpperCase()) || "";
    const firstBuy = ($("#firstBuy") && $("#firstBuy").value.trim()) || "0";

    const feeEl = $("#sumFee");
    const quoteEl = $("#sumQuote");
    const nameEl = $("#sumName");
    const tickEl = $("#sumTicker");
    if (feeEl) feeEl.textContent = feePct.toFixed(1) + "%";
    if (quoteEl) quoteEl.textContent = selectedQuote;
    if (nameEl) nameEl.textContent = name;
    if (tickEl) tickEl.textContent = tickerRaw ? "$" + tickerRaw : "—";
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
            msg.textContent = "Image too large for DEMO storage — try under ~400KB.";
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
    $all(".nav-btn[data-view], [data-goto]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const id = el.getAttribute("data-view") || el.getAttribute("data-goto");
        if (id) showView(id);
      });
    });
    const hash = (location.hash || "#home").replace("#", "");
    const allowed = ["home", "commodities", "create", "about"];
    const legacy = { markets: "commodities", launches: "commodities" };
    const resolved = legacy[hash] || hash;
    showView(allowed.includes(resolved) ? resolved : "home");
    window.addEventListener("hashchange", () => {
      const h = (location.hash || "#home").replace("#", "");
      const r = legacy[h] || h;
      if (allowed.includes(r)) showView(r);
    });
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
    demoLaunches = loadDemoLaunches();
    await loadQuotes();
    updateCatalogStats();
    renderCommodityGallery();
    renderDirectoryFilters();
    renderDirectory();
    renderDemoLaunches();
    startDemoTicker();
    renderCreateQuotes();
    updateSummary();
    const submit = $("#createSubmit");
    if (submit) {
      submit.disabled = false;
      submit.dataset.mode = "demo";
      submit.textContent = "Create DEMO launch";
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
