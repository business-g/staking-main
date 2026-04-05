"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  canFetchQuote as deriveCanFetchQuote,
  canSelectToken as deriveCanSelectToken,
  getAvailableDestinationChains,
  getAvailableSourceChains,
  getAvailableTokens,
  getBalance as deriveGetBalance,
  hasSufficientBalance as deriveHasSufficientBalance,
} from "./bridge/bridge-machine";
import { MOCK_BALANCES, TOKENS } from "./bridge/constants";
import { INITIAL_STATE, bridgeReducer } from "./bridge/reducer";
import type { BridgeFormState } from "./bridge/reducer";
import type { ChainId, TokenSymbol, WalletBalances } from "./bridge/types";

// ─── Amount formatting ────────────────────────────────────────────────────────

/**
 * Converts a raw bigint amount in smallest units to a human-readable decimal
 * string, trimming trailing zeros.
 *
 * formatUnits(2_400_000_000_000_000_000n, 18) → "2.4"
 * formatUnits(1_200_000_000n,              6)  → "1200"
 * formatUnits(300_000_000_000_000_000n,    18) → "0.3"
 */
function formatUnits(amount: bigint, decimals: number): string {
  const s = amount.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  const fraction = s.slice(s.length - decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

// ─── Amount parsing ───────────────────────────────────────────────────────────

function parseDecimalToBigInt(value: string, decimals: number): bigint | null {
  try {
    const trimmed = value.trim();
    if (!trimmed || trimmed === ".") return null;
    const [whole = "0", fraction = ""] = trimmed.split(".");
    const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
    return BigInt(`${whole || "0"}${paddedFraction}`);
  } catch {
    return null;
  }
}

// ─── Public Interface ─────────────────────────────────────────────────────────

export type UseBridgeFlowReturn = {
  /** Full reducer state. Read-only; mutate only through the methods below. */
  readonly state: BridgeFormState;

  // ── Form setters (step order: from → to → token → amount) ──────────────────
  setFrom: (chain: ChainId) => void;
  setTo: (chain: ChainId) => void;
  setToken: (token: TokenSymbol) => void;
  /**
   * Accepts a decimal string (e.g. "0.5") and converts it to the token's
   * smallest unit. Pass an empty string to clear the field.
   */
  setAmountFromString: (value: string) => void;

  // ── Amount helpers ──────────────────────────────────────────────────────────
  /**
   * Controlled value for the amount input. Stays in sync when setMaxAmount
   * is called or when the amount resets due to route changes.
   */
  inputValue: string;
  /** Sets the amount to the full available balance for the selected token. */
  setMaxAmount: () => void;
  /**
   * Formatted balance string for the source chain + token, e.g. "2.4 ETH".
   * Empty string when from or token is not yet selected.
   */
  balanceDisplay: string;

  // ── Action dispatchers ──────────────────────────────────────────────────────
  requestQuote: () => void;
  confirm: () => void;
  submit: () => void;
  retry: () => void;
  reset: () => void;
  executePrimaryAction: () => void;

  // ── Derived values ──────────────────────────────────────────────────────────
  /** All chains that have at least one outbound route. */
  availableSources: ChainId[];
  /** Destination chains reachable from the selected source (token-agnostic). */
  availableDestinations: ChainId[];
  /**
   * Tokens for the selected from→to route that have non-zero wallet balance.
   * Empty when from or to is not yet selected, or when balance is zero.
   */
  availableTokens: TokenSymbol[];
  /**
   * True when from+to are set, a route exists, and the wallet has balance
   * for at least one token on that route.
   */
  canSelectToken: boolean;
  /**
   * Returns the wallet balance for any chain/token pair.
   * Returns BigInt(0) for chains or tokens absent from the balance map.
   */
  getBalance: (chain: ChainId, token: TokenSymbol) => bigint;
  /** True when the entered amount is positive and ≤ the source-chain balance. */
  hasSufficientBalance: boolean;
  /** True when route is valid, amount is positive, and balance is sufficient. */
  canFetchQuote: boolean;
};

// ─── Mock async helpers ───────────────────────────────────────────────────────

/** Builds a plausible quote from the amount in-flight. Uses 1% as mock fee. */
function buildMockQuote(amount: bigint) {
  const fee = amount / BigInt(100);
  return {
    estimatedOutput: amount - fee,
    fee,
    estimatedTimeSeconds: 15,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
}

/** Generates a random 32-byte hex string prefixed with 0x. */
function mockTxHash(): `0x${string}` {
  const hex = Array.from(
    { length: 64 },
    () => Math.floor(Math.random() * 16).toString(16),
  ).join("");
  return `0x${hex}` as `0x${string}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param initialBalances - Wallet balances for the connected account.
 *   Defaults to MOCK_BALANCES for prototype use.
 */
export function useBridgeFlow(
  initialBalances: WalletBalances = MOCK_BALANCES,
): UseBridgeFlowReturn {
  const [state, dispatch] = useReducer(
    bridgeReducer,
    initialBalances,
    (balances) => ({ ...INITIAL_STATE, balances }),
  );

  // Tracks the raw string the user typed (or the formatted max value).
  // Owned here so setMaxAmount can sync both the display and the parsed bigint.
  const [inputValue, setInputValue] = useState("");

  // Reset the displayed string whenever the reducer clears the amount
  // (e.g. after a token or route change).
  useEffect(() => {
    if (state.amount === null) setInputValue("");
  }, [state.amount]);

  // ── Form setters ────────────────────────────────────────────────────────────

  const setFrom = useCallback(
    (chain: ChainId) => dispatch({ type: "SELECT_FROM", chain }),
    [dispatch],
  );

  const setTo = useCallback(
    (chain: ChainId) => dispatch({ type: "SELECT_TO", chain }),
    [dispatch],
  );

  const setToken = useCallback(
    (token: TokenSymbol) => dispatch({ type: "SELECT_TOKEN", token }),
    [dispatch],
  );

  const setAmountFromString = useCallback(
    (value: string) => {
      setInputValue(value);
      if (!value || value.trim() === "") {
        dispatch({ type: "SET_AMOUNT", amount: null });
        return;
      }
      const decimals = state.token ? TOKENS[state.token].decimals : 18;
      dispatch({ type: "SET_AMOUNT", amount: parseDecimalToBigInt(value, decimals) });
    },
    [dispatch, state.token],
  );

  const setMaxAmount = useCallback(() => {
    if (!state.from || !state.token) return;
    const balance = deriveGetBalance(state.balances, state.from, state.token);
    const decimals = TOKENS[state.token].decimals;
    setInputValue(formatUnits(balance, decimals));
    dispatch({ type: "SET_AMOUNT", amount: balance });
  }, [dispatch, state.from, state.token, state.balances]);

  // ── Action dispatchers ──────────────────────────────────────────────────────

  const requestQuote = useCallback(
    () => dispatch({ type: "SUBMIT_AMOUNT" }),
    [dispatch],
  );

  const confirm = useCallback(
    () => dispatch({ type: "CONFIRM" }),
    [dispatch],
  );

  const submit = useCallback(
    () => dispatch({ type: "SUBMIT" }),
    [dispatch],
  );

  const retry = useCallback(
    () => dispatch({ type: "RETRY" }),
    [dispatch],
  );

  const reset = useCallback(
    () => dispatch({ type: "RESET" }),
    [dispatch],
  );

  const executePrimaryAction = useCallback(() => {
    switch (state.status) {
      case "editing":     dispatch({ type: "SUBMIT_AMOUNT" }); break;
      case "quote-ready": dispatch({ type: "CONFIRM" });       break;
      case "confirming":  dispatch({ type: "SUBMIT" });        break;
      case "error":       dispatch({ type: "RETRY" });         break;
      case "success":     dispatch({ type: "RESET" });         break;
    }
  }, [dispatch, state.status]);

  // ── Async mock transitions ────────────────────────────────────────────────
  // Each effect owns exactly one status transition. The cleanup cancels the
  // timer so no dispatch ever fires after a reset, unmount, or status change.

  // validating → loading-quote
  // All synchronous validation already passed inside SUBMIT_AMOUNT.
  // This effect moves us forward with zero artificial delay.
  useEffect(() => {
    if (state.status !== "validating") return;
    const id = setTimeout(() => dispatch({ type: "VALIDATION_PASSED" }), 0);
    return () => clearTimeout(id);
  }, [state.status, dispatch]);

  // loading-quote → quote-ready  (1.2 s mock)
  // Amount is captured at effect-creation time. The state machine prevents
  // SET_AMOUNT from landing while in loading-quote so the value is stable.
  useEffect(() => {
    if (state.status !== "loading-quote") return;
    const amount = state.amount ?? BigInt(0);
    const id = setTimeout(
      () => dispatch({ type: "QUOTE_RECEIVED", quote: buildMockQuote(amount) }),
      1200,
    );
    return () => clearTimeout(id);
  }, [state.status, state.amount, dispatch]);

  // pending → success  (2 s mock)
  useEffect(() => {
    if (state.status !== "pending") return;
    const id = setTimeout(
      () => dispatch({ type: "TX_SUCCESS", txHash: mockTxHash() }),
      2000,
    );
    return () => clearTimeout(id);
  }, [state.status, dispatch]);

  // ── Derived values ────────────────────────────────────────────────────────
  // Memo deps match exactly what each pure function reads via its Pick<> signature.

  // availableSources: no runtime state needed — routes are static.
  const availableSources = useMemo(() => getAvailableSourceChains(), []);

  const availableDestinations = useMemo(
    () => getAvailableDestinationChains(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.from],
  );

  const availableTokens = useMemo(
    () => getAvailableTokens(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.from, state.to, state.balances],
  );

  const canSelectToken = useMemo(
    () => deriveCanSelectToken(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.from, state.to, state.balances],
  );

  const getBalance = useCallback(
    (chain: ChainId, token: TokenSymbol) => deriveGetBalance(state.balances, chain, token),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.balances],
  );

  const hasSufficientBalance = useMemo(
    () => deriveHasSufficientBalance(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.from, state.token, state.amount, state.balances],
  );

  const canFetchQuote = useMemo(
    () => deriveCanFetchQuote(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.token, state.from, state.to, state.amount, state.balances],
  );

  const balanceDisplay = useMemo(() => {
    if (!state.from || !state.token) return "";
    const balance = deriveGetBalance(state.balances, state.from, state.token);
    return `${formatUnits(balance, TOKENS[state.token].decimals)} ${state.token}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.from, state.token, state.balances]);

  return {
    state,
    setFrom,
    setTo,
    setToken,
    setAmountFromString,
    inputValue,
    setMaxAmount,
    balanceDisplay,
    requestQuote,
    confirm,
    submit,
    retry,
    reset,
    executePrimaryAction,
    availableSources,
    availableDestinations,
    availableTokens,
    canSelectToken,
    getBalance,
    hasSufficientBalance,
    canFetchQuote,
  };
}
