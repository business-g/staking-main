"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHAINS, TOKENS } from "@/lib/bridge/constants";
import type { FlowStatus } from "@/lib/bridge/reducer";
import type { ChainId, TokenSymbol } from "@/lib/bridge/types";
import { useBridgeFlow } from "@/lib/use-bridge-flow";

// ─── Presentation maps ────────────────────────────────────────────────────────

const ACTION_LABEL: Record<FlowStatus, string> = {
  idle:            "Select a route to start",
  editing:         "Get quote",
  validating:      "Validating…",
  "loading-quote": "Getting quote…",
  "quote-ready":   "Review",
  confirming:      "Bridge now",
  pending:         "Bridging…",
  success:         "Bridge again",
  error:           "Try again",
};

// Statuses where the form fields should be locked.
// quote-ready is intentionally excluded — changing the form returns to editing.
const FORM_LOCKED = new Set<FlowStatus>([
  "validating",
  "loading-quote",
  "confirming",
  "pending",
  "success",
]);

// Statuses where the primary action is in-progress (button disabled).
const ACTION_IN_PROGRESS = new Set<FlowStatus>([
  "validating",
  "loading-quote",
  "pending",
]);

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Page() {
  const bridge = useBridgeFlow();
  const { state } = bridge;

  const formLocked = FORM_LOCKED.has(state.status);

  const isButtonDisabled =
    state.status === "idle" ||
    ACTION_IN_PROGRESS.has(state.status) ||
    (state.status === "editing" && !bridge.canFetchQuote);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-5 p-6">

        <h1 className="text-lg font-semibold tracking-tight">Bridge</h1>

        {/* Step 1 — From */}
        <div className="space-y-1.5">
          <Label htmlFor="from">From</Label>
          <Select
            value={state.from ?? undefined}
            onValueChange={(v) => bridge.setFrom(v as ChainId)}
            disabled={formLocked}
          >
            <SelectTrigger id="from" className="w-full">
              <SelectValue placeholder="Source chain" />
            </SelectTrigger>
            <SelectContent>
              {bridge.availableSources.map((id) => (
                <SelectItem key={id} value={id}>
                  {CHAINS[id].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2 — To: disabled until From is chosen */}
        <div className="space-y-1.5">
          <Label htmlFor="to">To</Label>
          <Select
            value={state.to ?? undefined}
            onValueChange={(v) => bridge.setTo(v as ChainId)}
            disabled={!state.from || bridge.availableDestinations.length === 0 || formLocked}
          >
            <SelectTrigger id="to" className="w-full">
              <SelectValue placeholder="Destination chain" />
            </SelectTrigger>
            <SelectContent>
              {bridge.availableDestinations.map((id) => (
                <SelectItem key={id} value={id}>
                  {CHAINS[id].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 3 — Token: disabled until a valid route with balance exists */}
        <div className="space-y-1.5">
          <Label htmlFor="token">Token</Label>
          <Select
            value={state.token ?? undefined}
            onValueChange={(v) => bridge.setToken(v as TokenSymbol)}
            disabled={!bridge.canSelectToken || formLocked}
          >
            <SelectTrigger id="token" className="w-full">
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              {bridge.availableTokens.map((symbol) => (
                <SelectItem key={symbol} value={symbol}>
                  {TOKENS[symbol].name} ({symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 4 — Amount: disabled until token is chosen */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">Amount</Label>
            {bridge.balanceDisplay && (
              <span className="text-muted-foreground text-xs">
                Balance: {bridge.balanceDisplay}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={bridge.inputValue}
              disabled={!state.token || formLocked}
              onChange={(e) => bridge.setAmountFromString(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!state.token || formLocked}
              onClick={bridge.setMaxAmount}
            >
              Max
            </Button>
          </div>
          {state.amountError && (
            <p className="text-destructive text-xs">{state.amountError}</p>
          )}
        </div>

        {/* Quote summary */}
        {state.quote && (
          <div className="text-muted-foreground space-y-1 rounded-md border p-3 text-sm">
            <div className="flex justify-between">
              <span>You receive</span>
              <span className="text-foreground font-medium">
                {state.quote.estimatedOutput.toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Bridge fee</span>
              <span className="text-foreground">{state.quote.fee.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. time</span>
              <span className="text-foreground">{state.quote.estimatedTimeSeconds}s</span>
            </div>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && state.error && (
          <p className="text-destructive text-sm">{state.error}</p>
        )}

        {/* Success */}
        {state.status === "success" && state.txHash && (
          <p className="text-sm text-green-600">
            Bridged — <span className="font-mono text-xs">{state.txHash}</span>
          </p>
        )}

        {/* Dynamic CTA */}
        <Button
          className="w-full"
          disabled={isButtonDisabled}
          onClick={bridge.executePrimaryAction}
        >
          {ACTION_LABEL[state.status]}
        </Button>

        {/* Status indicator */}
        <p className="text-muted-foreground text-center text-xs">
          status: <span className="font-mono">{state.status}</span>
        </p>

      </div>
    </main>
  );
}
