# Security

Short notes for users and anyone shipping this stack. Plain facts. DEMO today. Mainnet later.

## What is safe in DEMO

- Connect Wallet uses an injected browser wallet only (MetaMask, Rabby, Binance Wallet). The site never asks for a seed phrase or private key.
- Create / Launch, Markets boards, token pages, and Rewards accrual are local mock data in your browser (`localStorage`). Clearing site data removes them.
- No protocol contracts are live for public use. DEMO buttons do not send mainnet transactions and do not move real fees.
- Wallet `localStorage` may keep the connected address for reconnect. That is not a secret. DEMO keys store mock launches, holdings, and reward ticks only.

## What we never do

- Ask you to type a seed, mnemonic, or private key into the site
- Store API secrets or keys in the frontend
- Treat DEMO ids as live BNB Chain contracts
- Claim verified mainnet addresses before they exist

## What must be true before mainnet

1. External audit of factory, hook, locker, fee distributor, token, and oracle wiring
2. Multisig (or timelock) for owner, treasury, buyback, and protocol recipients. No single hot key as sole owner
3. No private keys in the browser or in the public repo
4. Contracts verified on BscScan, with addresses published from a signed channel
5. LP lock path has no admin withdraw or sweep escape hatch
6. Fee distributor `distribute` stays keeper/owner gated, with bounded holder batches
7. Production oracle is documented (source, heartbeat, staleness). Mock oracle stays test-only
8. Upgrade stance stays explicit: no silent proxy upgrade without disclosure and review

## DEMO vs live (copy boundaries)

| Surface | DEMO now | Live later |
|--------|----------|------------|
| Launch | Local card only | On-chain create after deploy + audit |
| Markets / token page | Mock mcap, volume, chart | Real pool + explorer links |
| Rewards | Mock accrued quote in browser | Keeper-driven commodity payouts |
| $RIZ | Fee-split label only | Real buyback leg after token exists |
| Explorer | Disabled / Soon | BscScan for verified addresses |

## Wallet hygiene (you)

- Use a hardware wallet or a dedicated hot wallet with limited funds
- Reject unexpected signature or network prompts. This DEMO UI only needs account access and BSC network switch
- Never paste a seed into a website, Discord DM, or "support" chat

## Report issues

Prefer responsible disclosure to the Riz.Fun maintainers before public exploit write-ups. Do not send seeds or private keys when reporting.

Site Docs: https://rizfun.github.io/rizfun-site/#about  
X: https://x.com/RizForFun
