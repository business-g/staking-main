import type { Chain, Route, Token, WalletBalances } from "./types";

// ─── Chains ──────────────────────────────────────────────────────────────────

export const CHAINS: Record<string, Chain> = {
  ethereum:  { id: "ethereum",  name: "Ethereum",  chainNumber: 1,     nativeCurrency: "ETH" },
  arbitrum:  { id: "arbitrum",  name: "Arbitrum",  chainNumber: 42161, nativeCurrency: "ETH" },
  optimism:  { id: "optimism",  name: "Optimism",  chainNumber: 10,    nativeCurrency: "ETH" },
  base:      { id: "base",      name: "Base",      chainNumber: 8453,  nativeCurrency: "ETH" },
  polygon:   { id: "polygon",   name: "Polygon",   chainNumber: 137,   nativeCurrency: "POL" },
  avalanche: { id: "avalanche", name: "Avalanche", chainNumber: 43114, nativeCurrency: "AVAX" },
} as const;

// ─── Tokens ──────────────────────────────────────────────────────────────────

export const TOKENS: Record<string, Token> = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    addresses: {
      // ETH is native on L1/L2s; no contract address needed
    },
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    addresses: {
      ethereum:  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      arbitrum:  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      optimism:  "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      base:      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      polygon:   "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      avalanche: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    },
  },
} as const;

// ─── Allowed Routes ───────────────────────────────────────────────────────────

export const ALLOWED_ROUTES: Route[] = [
  // ETH
  { token: "ETH",  from: "ethereum", to: "arbitrum"  },
  { token: "ETH",  from: "ethereum", to: "optimism"  },
  { token: "ETH",  from: "ethereum", to: "base"      },
  { token: "ETH",  from: "arbitrum", to: "ethereum"  },
  // USDC
  { token: "USDC", from: "ethereum", to: "polygon"   },
  { token: "USDC", from: "ethereum", to: "avalanche" },
  { token: "USDC", from: "arbitrum", to: "base"      },
  { token: "USDC", from: "optimism", to: "ethereum"  },
];

// ─── Mock Balances ────────────────────────────────────────────────────────────
// Prototype only. Reflects "user has ETH and USDC on Ethereum" from requirements.

export const MOCK_BALANCES: WalletBalances = {
  ethereum: {
    ETH:  BigInt("2400000000000000000"), // 2.4 ETH  (18 decimals)
    USDC: BigInt("1200000000"),          // 1200 USDC (6 decimals)
  },
  arbitrum: {
    ETH:  BigInt("300000000000000000"),  // 0.3 ETH  (18 decimals)
    USDC: BigInt("500000000"),           // 500 USDC (6 decimals)
  },
  // All other chains have zero balance — absent keys resolve to BigInt(0) via getBalance.
};

/** Returns all routes available for a given token + source chain. */
export function getAvailableRoutes(
  token: Route["token"],
  from: Route["from"],
): Route[] {
  return ALLOWED_ROUTES.filter((r) => r.token === token && r.from === from);
}
