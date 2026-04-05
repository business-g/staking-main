import type { ChainId, TokenSymbol, WalletBalances } from "./types";
import { ALLOWED_ROUTES } from "./constants";

// ─── Flow Status ──────────────────────────────────────────────────────────────

export type FlowStatus =
  | "idle"          // nothing selected
  | "editing"       // user is filling in the form
  | "validating"    // amount submitted, checking against balance / rules
  | "loading-quote" // validation passed, fetching bridge quote
  | "quote-ready"   // quote in hand, ready to confirm
  | "confirming"    // user reviewing before final submit
  | "pending"       // tx submitted, waiting for on-chain settlement
  | "success"       // bridge complete
  | "error";        // unrecoverable failure (quote fetch, tx revert)

// ─── Quote ────────────────────────────────────────────────────────────────────

export type Quote = {
  estimatedOutput: bigint;
  fee: bigint;
  estimatedTimeSeconds: number;
  expiresAt: number; // unix ms — quote must be refreshed after this
};

// ─── State ────────────────────────────────────────────────────────────────────

export type BridgeFormState = {
  status: FlowStatus;
  /** Step 1: user selects source chain first. */
  from: ChainId | null;
  /** Step 2: filtered by from. */
  to: ChainId | null;
  /** Step 3: filtered by from+to route AND wallet balance on source chain. */
  token: TokenSymbol | null;
  /** Amount in the token's smallest unit (wei / USDC atoms). */
  amount: bigint | null;
  amountError: string | null;
  /** Live wallet balances. Used to filter token options and validate amounts. */
  balances: WalletBalances;
  quote: Quote | null;
  txHash: `0x${string}` | null;
  error: string | null;
};

export const INITIAL_STATE: BridgeFormState = {
  status: "idle",
  from: null,
  to: null,
  token: null,
  amount: null,
  amountError: null,
  balances: {},
  quote: null,
  txHash: null,
  error: null,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export type BridgeAction =
  // Form selection — valid from any non-terminal state
  | { type: "SELECT_TOKEN"; token: TokenSymbol }
  | { type: "SELECT_FROM"; chain: ChainId }
  | { type: "SELECT_TO"; chain: ChainId }
  | { type: "SET_AMOUNT"; amount: bigint | null }
  // Submitted for validation (editing → validating)
  | { type: "SUBMIT_AMOUNT" }
  // Dispatched by the validation effect (validating → editing | loading-quote)
  | { type: "VALIDATION_FAILED"; error: string }
  | { type: "VALIDATION_PASSED" }
  // Dispatched by the quote-fetch effect (loading-quote → quote-ready | error)
  | { type: "QUOTE_RECEIVED"; quote: Quote }
  | { type: "QUOTE_FAILED"; error: string }
  // User confirms intent (quote-ready → confirming → pending)
  | { type: "CONFIRM" }
  | { type: "CANCEL_CONFIRM" }
  | { type: "SUBMIT" }
  // Dispatched by the tx-watch effect (pending → success | error)
  | { type: "TX_SUCCESS"; txHash: `0x${string}` }
  | { type: "TX_ERROR"; error: string }
  // Recovery
  | { type: "RETRY" }
  | { type: "RESET" }
  // Wallet
  | { type: "SET_BALANCES"; balances: WalletBalances };

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function bridgeReducer(
  state: BridgeFormState,
  action: BridgeAction,
): BridgeFormState {
  switch (action.type) {
    // ── Form selection ────────────────────────────────────────────────────────

    case "SELECT_FROM": {
      // Selecting a new source chain always resets the full downstream cascade:
      // to → token → amount. The user must re-pick each in order.
      return {
        ...state,
        status: "editing",
        from: action.chain,
        to: null,
        token: null,
        amount: null,
        quote: null,
        amountError: null,
        error: null,
      };
    }

    case "SELECT_TO": {
      // If the user changes destination after picking a token, invalidate
      // the token when the new from→to pair doesn't support it.
      const tokenStillValid =
        state.token !== null &&
        ALLOWED_ROUTES.some(
          (r) => r.from === state.from && r.to === action.chain && r.token === state.token,
        );
      return {
        ...state,
        status: "editing",
        to: action.chain,
        token: tokenStillValid ? state.token : null,
        amount: tokenStillValid ? state.amount : null,
        quote: null,
        amountError: null,
        error: null,
      };
    }

    case "SELECT_TOKEN": {
      // Guard: a valid route (from + to) must exist before token can be set.
      if (!state.from || !state.to) return state;
      if (!ALLOWED_ROUTES.some(
        (r) => r.from === state.from && r.to === state.to && r.token === action.token,
      )) return state;
      return {
        ...state,
        status: "editing",
        token: action.token,
        amount: null,
        quote: null,
        amountError: null,
        error: null,
      };
    }

    case "SET_AMOUNT": {
      // Changing the amount invalidates a quote the user hasn't acted on yet.
      const quoteInvalidated =
        state.status === "quote-ready" || state.status === "confirming";
      return {
        ...state,
        status: state.status === "idle" ? "editing" : quoteInvalidated ? "editing" : state.status,
        amount: action.amount,
        amountError: null,
        quote: quoteInvalidated ? null : state.quote,
      };
    }

    // ── Validation ────────────────────────────────────────────────────────────

    case "SUBMIT_AMOUNT": {
      if (state.status !== "editing") return state;
      // Route must be fully specified before validation can proceed.
      if (!state.from || !state.to || !state.token) return state;

      // Synchronous balance validation — all data is in state, no async needed.
      // (getBalance from bridge-machine can't be imported here: circular dep)
      const balance = state.balances[state.from]?.[state.token] ?? BigInt(0);

      if (state.amount === null || state.amount <= BigInt(0)) {
        return { ...state, amountError: "Enter an amount greater than 0" };
      }
      if (state.amount > balance) {
        return { ...state, amountError: "Insufficient balance" };
      }

      return { ...state, status: "validating", amountError: null };
    }

    case "VALIDATION_FAILED": {
      if (state.status !== "validating") return state;
      return { ...state, status: "editing", amountError: action.error };
    }

    case "VALIDATION_PASSED": {
      if (state.status !== "validating") return state;
      return { ...state, status: "loading-quote" };
    }

    // ── Quote ─────────────────────────────────────────────────────────────────

    case "QUOTE_RECEIVED": {
      if (state.status !== "loading-quote") return state;
      return { ...state, status: "quote-ready", quote: action.quote };
    }

    case "QUOTE_FAILED": {
      if (state.status !== "loading-quote") return state;
      return { ...state, status: "error", error: action.error };
    }

    // ── Confirmation ──────────────────────────────────────────────────────────

    case "CONFIRM": {
      if (state.status !== "quote-ready") return state;
      return { ...state, status: "confirming" };
    }

    case "CANCEL_CONFIRM": {
      if (state.status !== "confirming") return state;
      return { ...state, status: "quote-ready" };
    }

    case "SUBMIT": {
      if (state.status !== "confirming") return state;
      return { ...state, status: "pending" };
    }

    // ── Settlement ────────────────────────────────────────────────────────────

    case "TX_SUCCESS": {
      if (state.status !== "pending") return state;
      return { ...state, status: "success", txHash: action.txHash };
    }

    case "TX_ERROR": {
      if (state.status !== "pending") return state;
      return { ...state, status: "error", error: action.error };
    }

    // ── Recovery ──────────────────────────────────────────────────────────────

    case "RETRY": {
      if (state.status !== "error") return state;
      return { ...state, status: "editing", error: null, quote: null };
    }

    case "SET_BALANCES":
      return { ...state, balances: action.balances };

    case "RESET":
      return INITIAL_STATE;

    default:
      return state;
  }
}
