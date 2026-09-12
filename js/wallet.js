/* Riz.Fun - EIP-1193 injected wallet (MetaMask / Rabby / Binance Wallet). BNB Chain. */
(function (global) {
  "use strict";

  var BSC = {
    chainId: "0x38",
    chainIdDec: 56,
    chainName: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: [
      "https://bsc-dataseed.binance.org/",
      "https://bsc-dataseed1.bnbchain.org/",
      "https://bsc-dataseed1.defibit.io/",
    ],
    blockExplorerUrls: ["https://bscscan.com"],
  };

  var STORAGE_KEY = "rizfun.wallet.v1";
  var listeners = [];
  var state = {
    address: null,
    chainId: null,
    connecting: false,
    error: null,
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function truncate(addr) {
    if (!addr || addr.length < 10) return addr || "";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
  }

  function emit() {
    var snap = getState();
    listeners.forEach(function (fn) {
      try {
        fn(snap);
      } catch (e) {
        console.warn("[RizWallet] listener error", e);
      }
    });
    renderNav();
    showBanner(state.error);
  }

  function getState() {
    return {
      address: state.address,
      chainId: state.chainId,
      connecting: state.connecting,
      error: state.error,
      connected: !!state.address,
      onBsc: isBsc(state.chainId),
      truncated: truncate(state.address),
      provider: getProvider(),
    };
  }

  function isBsc(chainId) {
    if (chainId == null) return false;
    var n = typeof chainId === "string" ? parseInt(chainId, 16) : Number(chainId);
    return n === BSC.chainIdDec;
  }

  function normalizeChainId(raw) {
    if (raw == null) return null;
    if (typeof raw === "number") return "0x" + raw.toString(16);
    var s = String(raw).toLowerCase();
    if (s.indexOf("0x") === 0) return s;
    var n = parseInt(s, 10);
    if (!isNaN(n)) return "0x" + n.toString(16);
    return s;
  }

  function getProvider() {
    var eth = global.ethereum;
    if (eth) {
      if (Array.isArray(eth.providers) && eth.providers.length) {
        var mm = eth.providers.find(function (p) {
          return p.isMetaMask && !p.isBraveWallet;
        });
        var rabby = eth.providers.find(function (p) {
          return p.isRabby;
        });
        var binance = eth.providers.find(function (p) {
          return p.isBinance || p.isBinanceWallet || p.isBinanceChain;
        });
        return rabby || mm || binance || eth.providers[0] || eth;
      }
      return eth;
    }
    if (global.BinanceChain && typeof global.BinanceChain.request === "function") {
      return global.BinanceChain;
    }
    if (global.okxwallet && global.okxwallet.ethereum) return global.okxwallet.ethereum;
    return null;
  }

  function hasInjected() {
    return !!getProvider();
  }

  function waitForProvider(ms) {
    ms = ms || 2500;
    return new Promise(function (resolve) {
      if (getProvider()) return resolve(getProvider());
      var done = false;
      function finish(p) {
        if (done) return;
        done = true;
        global.removeEventListener("ethereum#initialized", onInit);
        resolve(p || getProvider());
      }
      function onInit() {
        finish(getProvider());
      }
      global.addEventListener("ethereum#initialized", onInit, { once: true });
      var t0 = Date.now();
      var iv = setInterval(function () {
        if (getProvider()) {
          clearInterval(iv);
          finish(getProvider());
        } else if (Date.now() - t0 > ms) {
          clearInterval(iv);
          finish(null);
        }
      }, 100);
    });
  }

  function persist(addr) {
    try {
      if (addr) localStorage.setItem(STORAGE_KEY, JSON.stringify({ address: addr }));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }

  function readPersisted() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.address ? parsed.address : null;
    } catch (_) {
      return null;
    }
  }

  function setError(msg) {
    state.error = msg || null;
    emit();
  }

  function showBanner(msg) {
    var el = $("#walletErrorBanner");
    if (!el) {
      el = document.createElement("div");
      el.id = "walletErrorBanner";
      el.className = "wallet-error-banner";
      el.hidden = true;
      var nav = document.querySelector("header.nav");
      if (nav && nav.parentNode) nav.parentNode.insertBefore(el, nav.nextSibling);
      else document.body.insertBefore(el, document.body.firstChild);
    }
    if (msg) {
      el.hidden = false;
      el.textContent = msg;
    } else {
      el.hidden = true;
      el.textContent = "";
    }
  }

  async function request(method, params) {
    var provider = getProvider();
    if (!provider) throw new Error("No injected wallet. Open https://riz4.fun and unlock MetaMask / Rabby / Binance Wallet.");
    return provider.request({ method: method, params: params || [] });
  }

  async function readChainId() {
    var id = await request("eth_chainId");
    state.chainId = normalizeChainId(id);
    return state.chainId;
  }

  async function ensureBsc() {
    var id = await readChainId();
    if (isBsc(id)) return true;
    try {
      await request("wallet_switchEthereumChain", [{ chainId: BSC.chainId }]);
    } catch (err) {
      var code = err && (err.code || (err.data && err.data.originalError && err.data.originalError.code));
      if (code === 4902 || (err && /Unrecognized chain|not added/i.test(String(err.message || err)))) {
        await request("wallet_addEthereumChain", [
          {
            chainId: BSC.chainId,
            chainName: BSC.chainName,
            nativeCurrency: BSC.nativeCurrency,
            rpcUrls: BSC.rpcUrls,
            blockExplorerUrls: BSC.blockExplorerUrls,
          },
        ]);
      } else if (code === 4001) {
        throw new Error("Network switch rejected.");
      } else {
        throw err;
      }
    }
    await readChainId();
    if (!isBsc(state.chainId)) throw new Error("Please switch to BNB Chain (56).");
    return true;
  }

  async function connect() {
    if (state.connecting) return getState();
    state.connecting = true;
    state.error = null;
    emit();
    try {
      if (location.protocol === "http:" && /riz4\.fun|rizfun\.github\.io/i.test(location.hostname)) {
        throw new Error("Open the site in HTTPS (https://riz4.fun) so MetaMask can connect.");
      }
      await waitForProvider(3000);
      if (!hasInjected()) {
        throw new Error("No browser wallet found. Install MetaMask, Rabby, or Binance Wallet, then unlock it on https://riz4.fun");
      }
      var accounts = await request("eth_requestAccounts");
      if (!accounts || !accounts.length) throw new Error("No account returned.");
      state.address = accounts[0];
      persist(state.address);
      await ensureBsc();
      bindProviderEvents();
      state.connecting = false;
      state.error = null;
      emit();
      return getState();
    } catch (err) {
      state.connecting = false;
      var msg =
        err && err.code === 4001
          ? "Connection rejected."
          : (err && err.message) || String(err);
      state.error = msg;
      emit();
      throw err;
    }
  }

  function disconnect() {
    state.address = null;
    state.error = null;
    persist(null);
    emit();
  }

  async function silentRestore() {
    await waitForProvider(1500);
    if (!hasInjected()) return;
    var saved = readPersisted();
    if (!saved) return;
    try {
      var accounts = await request("eth_accounts");
      if (accounts && accounts.length) {
        var match = accounts.find(function (a) {
          return a.toLowerCase() === saved.toLowerCase();
        });
        state.address = match || accounts[0];
        persist(state.address);
        await readChainId();
        bindProviderEvents();
        emit();
      } else {
        persist(null);
      }
    } catch (_) {}
  }

  var eventsBound = false;
  function bindProviderEvents() {
    var provider = getProvider();
    if (!provider || eventsBound || !provider.on) return;
    eventsBound = true;
    provider.on("accountsChanged", function (accounts) {
      if (!accounts || !accounts.length) {
        disconnect();
        return;
      }
      state.address = accounts[0];
      persist(state.address);
      emit();
    });
    provider.on("chainChanged", function (chainId) {
      state.chainId = normalizeChainId(chainId);
      emit();
    });
    provider.on("disconnect", function () {
      disconnect();
    });
  }

  function onChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (f) {
        return f !== fn;
      });
    };
  }

  function renderNav() {
    var slot = $("#walletSlot");
    if (!slot) return;
    var s = getState();
    if (s.connecting) {
      slot.innerHTML =
        '<button type="button" class="btn btn-ghost btn-sm wallet-btn" disabled>Connecting…</button>';
      return;
    }
    if (s.connected) {
      var warn = s.onBsc
        ? ""
        : '<button type="button" class="btn btn-ghost btn-sm wallet-btn wallet-wrong" data-wallet-action="switch">Wrong network</button>';
      slot.innerHTML =
        warn +
        '<div class="wallet-connected">' +
        '<span class="wallet-addr mono" title="' +
        s.address +
        '">' +
        s.truncated +
        "</span>" +
        '<button type="button" class="btn btn-ghost btn-sm wallet-btn" data-wallet-action="disconnect">Disconnect</button>' +
        "</div>";
    } else {
      slot.innerHTML =
        '<button type="button" class="btn btn-primary btn-sm wallet-btn" data-wallet-action="connect">Connect Wallet</button>';
    }
  }

  function updateCreateUi() {
    var submit = $("#createSubmit");
    var msg = $("#createMsg");
    if (!submit) return;
    var s = getState();
    var ready = global.RizDeployments && global.RizDeployments.isReady();
    submit.disabled = false;
    if (!s.connected) {
      submit.textContent = "Connect Wallet";
      submit.dataset.mode = "connect";
    } else if (!s.onBsc) {
      submit.textContent = "Switch to BNB Chain";
      submit.dataset.mode = "switch";
    } else if (!ready) {
      submit.textContent = "Factory config missing";
      submit.disabled = true;
      submit.dataset.mode = "blocked";
    } else {
      submit.textContent = "Launch on BSC";
      submit.dataset.mode = "launch";
    }
    if (msg && s.error) {
      msg.textContent = s.error;
      msg.hidden = false;
    }
  }

  function wireCreateSubmit() {
    var form = $("#createForm");
    if (!form || form.dataset.walletWired) return;
    form.dataset.walletWired = "1";
    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var submit = $("#createSubmit");
        var msg = $("#createMsg");
        var mode = submit && submit.dataset.mode;
        var s = getState();

        if (mode === "connect" || !s.connected) {
          connect()
            .then(function () {
              if (msg) {
                msg.textContent = "Wallet connected on BNB Chain.";
                msg.hidden = false;
              }
              updateCreateUi();
            })
            .catch(function (err) {
              if (msg) {
                msg.textContent = (err && err.message) || "Could not connect wallet.";
                msg.hidden = false;
              }
            });
          return;
        }
        if (mode === "switch" || !s.onBsc) {
          ensureBsc()
            .then(function () {
              if (msg) {
                msg.textContent = "Switched to BNB Chain.";
                msg.hidden = false;
              }
              updateCreateUi();
            })
            .catch(function (err) {
              if (msg) {
                msg.textContent = (err && err.message) || "Could not switch network.";
                msg.hidden = false;
              }
            });
          return;
        }
        if (mode !== "launch") {
          if (msg) {
            msg.textContent = "Launch unavailable - factory config missing.";
            msg.hidden = false;
          }
          return;
        }
        if (!global.RizLaunch || typeof global.RizLaunch.launchFromForm !== "function") {
          if (msg) {
            msg.textContent = "Launch module not loaded.";
            msg.hidden = false;
          }
          return;
        }
        submit.disabled = true;
        submit.textContent = "Confirm in wallet…";
        if (msg) {
          msg.textContent = "Sending launch tx to factory (0.001 BNB fee)…";
          msg.hidden = false;
        }
        global.RizLaunch.launchFromForm(form)
          .then(function (entry) {
            var link =
              entry.txHash && global.RizDeployments
                ? global.RizDeployments.txUrl(entry.txHash)
                : "";
            if (msg) {
              msg.innerHTML =
                "Launched <strong>" +
                (entry.symbol || "") +
                "</strong>" +
                (entry.token ? ' · <span class="mono">' + entry.token + "</span>" : "") +
                (link ? ' · <a href="' + link + '" target="_blank" rel="noopener">BscScan</a>' : "");
              msg.hidden = false;
            }
            if (global.RizApp && typeof global.RizApp.refreshLaunches === "function") {
              global.RizApp.refreshLaunches();
            }
            updateCreateUi();
          })
          .catch(function (err) {
            if (msg) {
              msg.textContent = (err && err.message) || "Launch failed.";
              msg.hidden = false;
            }
            updateCreateUi();
          });
      },
      true
    );
  }

  function wireGlobalClicks() {
    if (document.documentElement.dataset.rizWalletClick) return;
    document.documentElement.dataset.rizWalletClick = "1";
    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest && e.target.closest("[data-wallet-action]");
      if (!btn) return;
      e.preventDefault();
      var action = btn.getAttribute("data-wallet-action");
      if (action === "connect") {
        connect().catch(function () {});
      } else if (action === "disconnect") {
        disconnect();
      } else if (action === "switch") {
        ensureBsc().catch(function (err) {
          setError((err && err.message) || "Could not switch network");
        });
      }
    });
  }

  function wireRizCopy() {
    var btn = $("#copyRizCa");
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", function () {
      var ca =
        (global.RizDeployments && global.RizDeployments.DEPLOY.rizToken) ||
        "0xf451035b8154d51850aba222df7640815692ffff";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ca).then(function () {
          btn.textContent = "Copied";
          setTimeout(function () {
            btn.textContent = "Copy contract";
          }, 1200);
        });
      }
    });
  }

  function init() {
    wireGlobalClicks();
    renderNav();
    wireCreateSubmit();
    wireRizCopy();
    updateCreateUi();
    onChange(updateCreateUi);
    silentRestore().then(function () {
      renderNav();
      updateCreateUi();
    });
  }

  var api = {
    BSC: BSC,
    connect: connect,
    disconnect: disconnect,
    ensureBsc: ensureBsc,
    getState: getState,
    hasInjected: hasInjected,
    truncate: truncate,
    onChange: onChange,
    renderNav: renderNav,
    init: init,
  };

  global.RizWallet = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
