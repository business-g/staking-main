import { ALLOWED_ROUTES } from "./constants";
import type { BridgeFormState } from "./reducer";
import type { ChainId, TokenSymbol, WalletBalances } from "./types";

// ─── Derived Logic ────────────────────────────────────────────────────────────
//
// Pure functions over BridgeFormState. No side effects, no UI concerns.
// All route validity is derived exclusively from ALLOWED_ROUTES.
//
// Selection order enforced here mirrors the reducer cascade:
//   from → to → token → amount

/**
 * Returns every source chain that has at least one valid route.
 * Token is not yet known at this step, so all potential sources are shown.
 *
 * → ["ethereum", "arbitrum", "optimism"]
 */
export function getAvailableSourceChains(): ChainId[] {
  return Array.from(new Set(ALLOWED_ROUTES.map((r) => r.from)));
}

/**
 * Returns destination chains reachable from the selected source chain.
 * Token is not yet known at this step — destinations span all tokens.
 *
 * ethereum → ["arbitrum", "optimism", "base", "polygon", "avalanche"]
 * arbitrum → ["ethereum", "base"]
 * optimism → ["ethereum"]
 * null     → []
 */
export function getAvailableDestinationChains(
  state: Pick<BridgeFormState, "from">,
): ChainId[] {
  const { from } = state;
  if (!from) return [];

  return Array.from(
    new Set(ALLOWED_ROUTES.filter((r) => r.from === from).map((r) => r.to)),
  );
}

/**
 * Returns tokens available for the selected from→to route that also have
 * a non-zero wallet balance on the source chain.
 *
 * Both `from` and `to` must be set — token is the last selection step.
 * Tokens with zero balance are excluded per constraint 4.
 *
 * ethereum→arbitrum + {ETH: 2n, USDC: 500n} → ["ETH"]  (ETH is the only route)
 * ethereum→polygon  + {USDC: 500n}           → ["USDC"]
 * null→any          → []
 */
export function getAvailableTokens(
  state: Pick<BridgeFormState, "from" | "to" | "balances">,
): TokenSymbol[] {
  const { from, to, balances } = state;
  if (!from || !to) return [];

  const routeTokens = Array.from(
    new Set(
      ALLOWED_ROUTES
        .filter((r) => r.from === from && r.to === to)
        .map((r) => r.token),
    ),
  );

  // Constraint 4: exclude tokens with no balance on the source chain.
  return routeTokens.filter((token) => {
    const balance = balances[from]?.[token];
    return balance !== undefined && balance > BigInt(0);
  });
}

/**
 * Returns true when the selected token + from + to combination exists
 * in ALLOWED_ROUTES. Any null field returns false.
 */
export function isRouteValid(
  state: Pick<BridgeFormState, "token" | "from" | "to">,
): boolean {
  const { token, from, to } = state;
  if (!token || !from || !to) return false;

  return ALLOWED_ROUTES.some(
    (r) => r.token === token && r.from === from && r.to === to,
  );
}

/**
 * Returns true when a token can be selected:
 * - from and to are both set
 * - at least one route exists for the pair
 * - the wallet has a non-zero balance for at least one of those tokens
 *
 * This is the single source of truth for whether the token selector is usable.
 */
export function canSelectToken(
  state: Pick<BridgeFormState, "from" | "to" | "balances">,
): boolean {
  return getAvailableTokens(state).length > 0;
}

// ─── Balance ──────────────────────────────────────────────────────────────────

/**
 * Returns the raw bigint balance for a token on a chain.
 * Returns BigInt(0) when the chain or token is absent from the balance map.
 */
export function getBalance(
  balances: WalletBalances,
  chain: ChainId,
  token: TokenSymbol,
): bigint {
  return balances[chain]?.[token] ?? BigInt(0);
}

/**
 * Returns true when the selected amount is positive and does not exceed
 * the wallet balance for the selected token on the source chain.
 *
 * Returns false when any of from, token, or amount is null, or when amount
 * is zero (can't bridge nothing).
 */
export function hasSufficientBalance(
  state: Pick<BridgeFormState, "from" | "token" | "amount" | "balances">,
): boolean {
  const { from, token, amount, balances } = state;
  if (!from || !token || amount === null || amount <= BigInt(0)) return false;
  return amount <= getBalance(balances, from, token);
}

/**
 * Returns true when the state has sufficient data to produce a quote request:
 * valid route + positive amount that does not exceed the source-chain balance.
 *
 * Data predicate only — does not inspect `status`.
 * The state machine controls *when* to fetch; this answers *whether* the
 * inputs are complete and fundable.
 */
export function canFetchQuote(
  state: Pick<BridgeFormState, "token" | "from" | "to" | "amount" | "balances">,
): boolean {
  return isRouteValid(state) && hasSufficientBalance(state);
}
