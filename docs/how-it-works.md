# How it works

Riz.Fun is a commodity-paired memecoin launcher on BNB Chain (BSC).

Pick a quote asset. Launch a coin against it. Trade on a bonding curve. At the end of the curve, liquidity moves into a locked Uniswap v4 pool.

## 1. Pair with a commodity

Day-1 live quotes:

- **BNB** (native)
- **XAUt** (Tether Gold on BSC)
- **PAXG** (Binance-peg PAX Gold)

The Commodities tab also lists metals, energy, and agriculture as **Soon**. Those are registry rows, not live mints yet.

## 2. Ride the curve

- Fixed supply: **1B**
- Curve opens around **$5k** mcap
- Curve graduates around **$35k** mcap
- You trade in the paired quote the whole way

## 3. Graduate to locked Uniswap v4

At the endpoint, curve reserves seed a **Uniswap v4** full-range pool on BSC.

- Post-grad fees go through the **v4 hook**
- LP is locked. Nobody pulls it.

## Live status

Launcher is **live on BSC Mainnet**. Connect wallet, pay 0.001 BNB launch fee, get a real token + curve. Factory: [`0xE946…1b72`](https://bscscan.com/address/0xE9468A60067B935aeA99D2353407070522201b72). Protocol token `$RIZ`: [`0xf451…ffff`](https://bscscan.com/token/0xf451035b8154d51850aba222df7640815692ffff).
