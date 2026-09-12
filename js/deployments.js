/* Riz.Fun - BSC mainnet deployments (production). Do not invent addresses. */
(function (global) {
  "use strict";
  var DEPLOY = {
    chainId: 56,
    chainIdHex: "0x38",
    mode: "live",
    factory: "0xE9468A60067B935aeA99D2353407070522201b72",
    owner: "0xD100f5D71605B874C162Fd06Fa2e6d5704c93460",
    protocolFeeRecipient: "0x0e6Cf4AF115b611901fc27D6f95F5bBB82d06792",
    poolManager: "0x28e2Ea090877bF75740558f6BFB36A5ffeE9e9dF",
    positionManager: "0x7A4a5c919aE2541AeD11041A1AEeE68f1287f95b",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    locker: "0xbD035E3450B96db51C7Db8EfB0A0e4b54FC40C52",
    memeHook: "0x236F78C0120990A5f246A3291e65E9d3C324e044",
    feeEscrow: "0x32126d5a25dD1AeAe44F745E4Ca528Df2F44c3ca",
    buybackVault: "0xC923C4eA52E4bE74C38AC844e16dfa2b77920955",
    launchDeployer: "0x78019C86b6cE303E3F5992f93ec339Df84ed545f",
    graduationExecutor: "0xC379eAec63d93f34a1F0322C0093E880DD28efd0",
    graduationGuard: "0xA7B3215d38Cba48D3075820e618CE5e7e055c37B",
    launchFeeWei: "1000000000000000",
    defaultLaunchConfigId: 0,
    obsoleteFactory: "0x5da9d4bbe2eca15d198c254e4419a3d1c3b9c3c0",
    obsoleteFactoryPrev: "0xFd0D4aaA8627646856CB14B1F9356C2f77a7F2ae",
    rizToken: "0xf451035b8154d51850aba222df7640815692ffff",
    explorer: "https://bscscan.com",
    quotes: {
      BNB: "0x0000000000000000000000000000000000000000",
      XAUt: "0x21cAef8A43163Eea865baeE23b9C2E327696A3bf",
      PAXG: "0x7950865a9140cB519342433146Ed5b40c6F210f7",
    },
  };

  function isReady() {
    return !!(DEPLOY.factory && DEPLOY.factory !== "0x0000000000000000000000000000000000000000");
  }

  function quoteAddress(symbol) {
    return DEPLOY.quotes[symbol] || null;
  }

  function txUrl(hash) {
    return DEPLOY.explorer + "/tx/" + hash;
  }

  function addressUrl(addr) {
    return DEPLOY.explorer + "/address/" + addr;
  }

  global.RizDeployments = {
    DEPLOY: DEPLOY,
    isReady: isReady,
    quoteAddress: quoteAddress,
    txUrl: txUrl,
    addressUrl: addressUrl,
  };
})(typeof window !== "undefined" ? window : globalThis);
