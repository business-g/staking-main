// ─── Chain ───────────────────────────────────────────────────────────────────

export type ChainId =
  | "ethereum"
  | "arbitrum"
  | "optimism"
  | "base"
  | "polygon"
  | "avalanche";

export type Chain = {
  id: ChainId;
  name: string;
  /** EVM numeric chain ID */
  chainNumber: number;
  /** Symbol of the chain's native gas token */
  nativeCurrency: string;
};

// ─── Token ───────────────────────────────────────────────────────────────────

export type TokenSymbol = "ETH" | "USDC";

export type Token = {
  symbol: TokenSymbol;
  name: string;
  decimals: number;
  /**
   * Contract address on each chain.
   * Absent for native tokens (e.g. ETH on Ethereum).
   */
  addresses: Partial<Record<ChainId, `0x${string}`>>;
};

// ─── Route ───────────────────────────────────────────────────────────────────

/** Every valid bridge route expressed as a discriminated union.
 *  Invalid combinations are inexpressible at the type level. */
export type ETHRoute =
  | { token: "ETH"; from: "ethereum"; to: "arbitrum" }
  | { token: "ETH"; from: "ethereum"; to: "optimism" }
  | { token: "ETH"; from: "ethereum"; to: "base" }
  | { token: "ETH"; from: "arbitrum"; to: "ethereum" };

export type USDCRoute =
  | { token: "USDC"; from: "ethereum"; to: "polygon" }
  | { token: "USDC"; from: "ethereum"; to: "avalanche" }
  | { token: "USDC"; from: "arbitrum"; to: "base" }
  | { token: "USDC"; from: "optimism"; to: "ethereum" };

export type Route = ETHRoute | USDCRoute;

// ─── Bridge State ─────────────────────────────────────────────────────────────

export type BridgeStatus =
  | "idle"       // nothing selected
  | "ready"      // route + amount valid, awaiting submission
  | "pending"    // tx submitted to source chain, waiting for inclusion
  | "bridging"   // included on source, waiting for destination
  | "complete"   // funds arrived on destination
  | "failed";    // tx reverted or bridge error

export type BridgeTransaction = {
  sourceTxHash: `0x${string}`;
  /** Populated once the bridge has settled on the destination chain */
  destinationTxHash: `0x${string}` | null;
  submittedAt: number; // unix ms
  completedAt: number | null;
};

/**
 * Represents the connected wallet's token balances.
 * Only chains/tokens relevant to the allowed routes are tracked.
 */
export type WalletBalances = {
  [C in ChainId]?: {
    [T in TokenSymbol]?: bigint;
  };
};

export type BridgeState = {
  /** The route the user has chosen, or null if none selected yet */
  selectedRoute: Route | null;
  /**
   * Raw input amount in the token's smallest unit (wei / USDC atoms).
   * null when the field is empty or unparseable.
   */
  amount: bigint | null;
  /** Live balances for the connected wallet */
  balances: WalletBalances;
  status: BridgeStatus;
  /** Populated once a transaction has been submitted */
  transaction: BridgeTransaction | null;
  /** Human-readable error from the last failed operation */
  error: string | null;
};
