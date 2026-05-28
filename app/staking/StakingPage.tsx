"use client";

import { useState, useRef, useLayoutEffect, useEffect } from "react";
import Lottie from "lottie-react";
import { Liveline, type LivelinePoint } from "liveline";
import loaderAnimation from "../../public/loader-staking.json";
import styles from "./StakingPage.module.css";

const ACCENT_500_RGB = [0.956863, 0.839216, 0.639216] as const;

function replaceLoaderAccent(node: unknown): unknown {
  if (Array.isArray(node)) {
    if (
      node.length === 3 &&
      typeof node[0] === "number" &&
      typeof node[1] === "number" &&
      typeof node[2] === "number" &&
      Math.abs(node[0] - 0.561) < 0.0001 &&
      Math.abs(node[1] - 0.98) < 0.0001 &&
      Math.abs(node[2] - 1) < 0.0001
    ) {
      return [...ACCENT_500_RGB];
    }
    return node.map(replaceLoaderAccent);
  }

  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, replaceLoaderAccent(value)])
    );
  }

  return node;
}

const loaderAnimationAccent = replaceLoaderAccent(loaderAnimation);

const ASSETS = {
  headerLogo:     "/staking/logo-gemra-white.svg",
  stakeDefault:   "/staking/nav-stake-default.svg",
  stakeActive:    "/staking/nav-stake-active.svg",
  portfolioDefault: "/staking/nav-portfolio-default.svg",
  portfolioActive: "/staking/nav-portfolio-active.svg",
  phantomBase:    "/staking/phantom-base.svg",
  phantomVector:  "/staking/phantom-vector.svg",
  infoIcon:       "/staking/info-icon.svg",
  tokenImg:       "/staking/input-gem.svg",
  wmCloseIcon:      "https://www.figma.com/api/mcp/asset/6e19fdbc-d1fc-4bcb-b07f-bacea733c31f",
  wmCloseIconHover: "https://www.figma.com/api/mcp/asset/3687283e-c07c-4dc9-a6b3-323fc800912c",
  wmCopyIcon:       "/wallet/copy-icon.svg",
  wmExplorerIcon:   "/wallet/link-icon.svg",
  wmDisconnectIcon: "/wallet/power-icon.svg",
  wmBadgeIcon:      "/wallet/phantom-wallet-white-icon.svg",
  toastIconVector: "/staking/toast-success-check-v2.svg",
  s4EllipseIcon:   "/staking/success-ellipse.svg",
  s4CheckIcon:     "/staking/success-check.svg",
  unstakeBlankStatus: "/staking/unstake_blank.png",
};

// ---------------------------------------------------------------------------
// Icon primitives — each rendered with explicit pixel sizing
// ---------------------------------------------------------------------------

/** 16×16 stake/portfolio icon */
function StakeIcon({ active }: { active?: boolean }) {
  return (
    <img
      src={active ? ASSETS.stakeActive : ASSETS.stakeDefault}
      alt=""
      width={16}
      height={16}
      // position:relative + z-index:1 ensures the img paints above the
      // ::before gradient overlay on .navItemActive (which is position:absolute,
      // z-index:auto and would otherwise cover non-positioned children).
      style={{ display: "block", flexShrink: 0, position: "relative", zIndex: 1 }}
    />
  );
}

/** 16×16 wallet icon */
function WalletIcon() {
  return (
    <img
      src="/staking/form-wallet-icon.svg"
      alt=""
      width={16}
      height={16}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}

/** 16×16 Phantom wallet icon — two layered images */
function PhantomIcon() {
  return (
    <span className={styles.iconWrap}>
      <img src={ASSETS.phantomBase} alt="" width={16} height={16} loading="eager" decoding="sync" fetchPriority="high" style={{ display: "block", position: "absolute", inset: 0 }} />
      <img src={ASSETS.phantomVector} alt="" width={16} height={13} loading="eager" decoding="sync" fetchPriority="high" style={{ display: "block", position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }} />
    </span>
  );
}

function SuccessStateIcon() {
  return (
    <div className={styles.s4Icon}>
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "100%" }}>
        <circle cx="44" cy="44" r="44" fill="#F4D6A3" />
        <path d="M23.4993 0.677918C24.2293 -0.150844 25.4937 -0.230811 26.3225 0.499207C27.1513 1.22929 27.2312 2.4936 26.5012 3.32245L9.76684 22.3224C9.38716 22.7534 8.84025 23.0002 8.26587 23.0002C7.69148 23.0002 7.14456 22.7534 6.76489 22.3224L0.499264 15.2082C-0.230781 14.3793 -0.150922 13.115 0.677975 12.3849C1.50688 11.6549 2.77115 11.7357 3.50122 12.5646L8.26489 17.9728L23.4993 0.677918Z" fill="#0D0D0D" transform="translate(30 32)" />
      </svg>
    </div>
  );
}

function BatchStepSuccessIcon() {
  return (
    <span className={styles.umBatchStatusCheck} aria-hidden="true">
      <img
        src={ASSETS.toastIconVector}
        alt=""
        width={12}
        height={9}
        style={{ display: "block", filter: "brightness(0) invert(1)" }}
      />
    </span>
  );
}

/** Info icon with a hover tooltip */
function InfoTooltip({ text, width, lineHeight }: { text: string; width: number; lineHeight?: string | number }) {
  const [visible, setVisible] = useState(false);
  const [below, setBelow] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  function handleMouseEnter() {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      // Flip to below if there isn't enough room above (tooltip ~80px + 8px gap)
      setBelow(rect.top < 96);
    }
    setVisible(true);
  }

  return (
    <span
      ref={anchorRef}
      className={styles.tooltipAnchor}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      <img
        src={ASSETS.infoIcon}
        alt="Info"
        width={12}
        height={12}
        style={{ display: "block", margin: "2px" }}
      />
      <div
        className={`${styles.tooltip} ${below ? styles.tooltipBelow : styles.tooltipAbove} ${visible ? styles.tooltipVisible : ""}`}
        style={{ width, ...(lineHeight !== undefined ? { lineHeight } : {}) }}
      >
        {text}
      </div>
    </span>
  );
}

function StakeBackgroundLoop() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const leftCanvas = leftCanvasRef.current;
    const rightCanvas = rightCanvasRef.current;
    if (!video || !leftCanvas || !rightCanvas) return;

    const leftCtx = leftCanvas.getContext("2d");
    const rightCtx = rightCanvas.getContext("2d");
    if (!leftCtx || !rightCtx) return;

    const cssWidth = 309;
    const cssHeight = 174;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const canvases = [
      [leftCanvas, leftCtx],
      [rightCanvas, rightCtx],
    ] as const;

    for (const [canvas, ctx] of canvases) {
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }

    const draw = () => {
      if (video.readyState >= 2) {
        for (const [, ctx] of canvases) {
          ctx.clearRect(0, 0, cssWidth, cssHeight);
          ctx.drawImage(video, 0, 0, cssWidth, cssHeight);
        }
      }
      rafRef.current = window.requestAnimationFrame(draw);
    };

    const start = async () => {
      try {
        video.currentTime = 0;
        await video.play();
      } catch {
        // Ignore autoplay failures for decorative media.
      }
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(draw);
      }
    };

    const handleLoaded = () => {
      void start();
    };

    video.addEventListener("loadeddata", handleLoaded);
    void start();

    return () => {
      video.removeEventListener("loadeddata", handleLoaded);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      video.pause();
    };
  }, []);

  return (
    <div className={styles.stakeBackgroundVideoViewport} aria-hidden="true">
      <div className={styles.stakeBackgroundVideo}>
        <canvas ref={leftCanvasRef} className={styles.stakeBackgroundCanvas} />
      </div>
      <div className={`${styles.stakeBackgroundVideo} ${styles.stakeBackgroundVideoRight}`}>
        <canvas ref={rightCanvasRef} className={styles.stakeBackgroundCanvas} />
        <video
          ref={videoRef}
          className={styles.stakeBackgroundVideoSource}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/staking/brill-edited.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

function DiscordIcon() {
  return (
    <span className={styles.iconWrap}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block", position: "absolute", inset: 0 }}>
        <path d="M13.5447 2.7704C12.5249 2.30248 11.4313 1.95774 10.2879 1.76029C10.2671 1.75648 10.2463 1.766 10.2356 1.78505C10.0949 2.03519 9.93915 2.36152 9.83006 2.61802C8.60027 2.43391 7.37679 2.43391 6.17221 2.61802C6.0631 2.35582 5.90166 2.03519 5.76038 1.78505C5.74966 1.76664 5.72886 1.75711 5.70803 1.76029C4.56527 1.95711 3.47171 2.30185 2.45129 2.7704C2.44246 2.77421 2.43488 2.78057 2.42986 2.78881C0.355594 5.88772 -0.212633 8.91046 0.0661201 11.8957C0.0673814 11.9103 0.0755799 11.9243 0.086932 11.9332C1.45547 12.9382 2.78114 13.5483 4.08219 13.9528C4.10301 13.9591 4.12507 13.9515 4.13832 13.9343C4.44608 13.5141 4.72043 13.0709 4.95565 12.6049C4.96953 12.5776 4.95628 12.5452 4.92791 12.5344C4.49275 12.3693 4.0784 12.1681 3.67982 11.9395C3.64829 11.9211 3.64577 11.876 3.67477 11.8544C3.75865 11.7916 3.84255 11.7262 3.92264 11.6602C3.93713 11.6481 3.95732 11.6456 3.97435 11.6532C6.59286 12.8487 9.4277 12.8487 12.0153 11.6532C12.0323 11.6449 12.0525 11.6475 12.0677 11.6595C12.1478 11.7256 12.2316 11.7916 12.3161 11.8544C12.3451 11.876 12.3433 11.9211 12.3117 11.9395C11.9131 12.1725 11.4988 12.3693 11.063 12.5338C11.0346 12.5446 11.022 12.5776 11.0359 12.6049C11.2762 13.0703 11.5505 13.5134 11.8526 13.9337C11.8652 13.9515 11.8879 13.9591 11.9087 13.9528C13.2161 13.5483 14.5417 12.9382 15.9103 11.9332C15.9223 11.9243 15.9298 11.911 15.9311 11.8964C16.2647 8.44506 15.3723 5.44711 13.5655 2.78944C13.5611 2.78057 13.5535 2.77421 13.5447 2.7704ZM5.34668 10.078C4.55833 10.078 3.90876 9.35425 3.90876 8.46539C3.90876 7.57653 4.54574 6.85277 5.34668 6.85277C6.15392 6.85277 6.79721 7.58289 6.78459 8.46539C6.78459 9.35425 6.14761 10.078 5.34668 10.078ZM10.6632 10.078C9.87484 10.078 9.22526 9.35425 9.22526 8.46539C9.22526 7.57653 9.86222 6.85277 10.6632 6.85277C11.4704 6.85277 12.1137 7.58289 12.1011 8.46539C12.1011 9.35425 11.4704 10.078 10.6632 10.078Z" fill="currentColor"/>
      </svg>
    </span>
  );
}

function TwitterIcon() {
  return (
    <span className={styles.iconWrap}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block", position: "absolute", inset: 0 }}>
        <path d="M9.52052 6.77871L13.9811 1.66699H12.9244L9.05115 6.10325L5.95814 1.66699H2.39062L7.06839 8.37371L2.39062 13.7344H3.44736L7.53731 9.04916L10.8034 13.7344H14.3709L9.52026 6.77871H9.52052ZM8.07293 8.43642L7.59907 7.77341L3.82816 2.49505H5.45172L8.49517 6.7566L8.96903 7.41961L12.925 12.9579H11.3014L8.07293 8.43668V8.43642Z" fill="currentColor"/>
      </svg>
    </span>
  );
}

function TelegramIcon() {
  return (
    <span className={styles.iconWrap}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block", position: "absolute", inset: 0 }}>
        <path fillRule="evenodd" clipRule="evenodd" d="M1.02135 7.45157C5.00953 5.75809 7.66894 4.64165 8.9996 4.10223C12.7988 2.56211 13.5882 2.29458 14.1028 2.28574C14.216 2.28379 14.469 2.31113 14.633 2.44076C14.7714 2.55021 14.8094 2.69807 14.8277 2.80184C14.8459 2.90562 14.8686 3.14202 14.8506 3.32673C14.6446 5.43505 13.7538 10.5514 13.3006 12.9127C13.1088 13.9119 12.7312 14.2469 12.3657 14.2797C11.5712 14.351 10.9679 13.768 10.1985 13.2764C8.9944 12.5071 8.31416 12.0283 7.14538 11.2777C5.79468 10.4102 6.67029 9.93336 7.44005 9.15416C7.6415 8.95024 11.1419 5.84715 11.2097 5.56566C11.2182 5.53045 11.226 5.39922 11.146 5.32992C11.066 5.26063 10.9479 5.28433 10.8627 5.30317C10.742 5.32988 8.81848 6.56899 5.09218 9.02048C4.5462 9.38584 4.05166 9.56392 3.60858 9.55456C3.12011 9.54432 2.18049 9.28544 1.48198 9.06408C0.625233 8.79272 -0.0556942 8.6492 0.00359929 8.18824C0.034483 7.94811 0.373734 7.70257 1.02135 7.45157Z" fill="currentColor"/>
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUnlockDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type PeriodOption = { duration: string; days: number; apy: number };

const PERIODS: PeriodOption[] = [
  { duration: "3 months",  days:  91, apy: 0.08 },
  { duration: "6 months",  days: 182, apy: 0.20 },
  { duration: "9 months",  days: 273, apy: 0.32 },
  { duration: "12 months", days: 365, apy: 0.48 },
];

function calcRewards(amount: string, period: PeriodOption, compound: boolean): string {
  const n = parseFloat(amount);
  if (!n || isNaN(n)) return "0";
  const reward = compound
    ? n * (Math.pow(1 + period.apy / 365, period.days) - 1)
    : n * period.apy * (period.days / 365);
  return parseFloat(reward.toFixed(6)).toString();
}

function floorToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.floor(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// Staking history
// ---------------------------------------------------------------------------

type StakeRecord = {
  id: number;
  amount: number;
  apy: number;
  lockPeriod: string;
  unlockDate: string;
  autoCompound: boolean;
  autoCompoundDisabledAt?: string; // ISO — when AC was turned off; also set to stakedAt when staked with AC off
  harvestedAt?: string;            // ISO — timestamp of last harvest; used as reward accumulation start time
  rewardsStartTime?: string;       // ISO — set when AC is disabled; marks reward accumulation start, takes max-priority over harvestedAt
  stakedAt: string;
  compoundedTotal?: number; // cumulative rewards baked into amount when AC was re-enabled
};

const STAKES_KEY = "gra_staking_history_v2";
const BALANCE_KEY = "gra_wallet_balance";

function loadStakes(): StakeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STAKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistStake(record: StakeRecord) {
  const all = loadStakes();
  localStorage.setItem(STAKES_KEY, JSON.stringify([record, ...all]));
}

function removeStake(id: number) {
  const all = loadStakes().filter((s) => s.id !== id);
  localStorage.setItem(STAKES_KEY, JSON.stringify(all));
}

function updateStake(id: number, updates: Partial<StakeRecord>) {
  const all = loadStakes().map((s) => s.id === id ? { ...s, ...updates } : s);
  localStorage.setItem(STAKES_KEY, JSON.stringify(all));
}

// ---------------------------------------------------------------------------
// Unstaked history (for Portfolio page)
// ---------------------------------------------------------------------------

type UnstakedRecord = StakeRecord & {
  unstakedAt: string;      // ISO — when unstaked
  unstakedRewards: number; // rewards collected at unstake time (AC-off stakes)
};

const UNSTAKED_HISTORY_KEY = "gra_unstaked_history_v1";

function loadUnstakedHistory(): UnstakedRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(UNSTAKED_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveUnstakedRecord(record: UnstakedRecord) {
  const all = loadUnstakedHistory();
  localStorage.setItem(UNSTAKED_HISTORY_KEY, JSON.stringify([record, ...all]));
}

// ---------------------------------------------------------------------------
// Portfolio helpers
// ---------------------------------------------------------------------------

/** Format a number with non-breaking-space thousands separator: 15320.12 → "15 320.12" */
function fmtGra(n: number, decimals = 2): string {
  const [intPart, decPart] = n.toFixed(decimals).split(".");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
}

function fmtRewardGra(n: number): string {
  if (n === 0) return "0.00";
  if (Math.abs(n) >= 0.01) return fmtGra(n, 2);
  return fmtGra(n, 6);
}

function fmtAccumulatedRewardGra(n: number): string {
  if (Math.abs(n) >= 10) return fmtGra(n, 4);
  return fmtGra(n, 6);
}

/** Format ISO date as DD.MM.YYYY */
function formatTableDate(isoDate: string): string {
  const d = new Date(isoDate);
  const day   = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

function formatTxHash(id: number): string {
  const hex = id.toString(16).padStart(12, "0");
  return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`;
}

function formatUnlockDisplay(isoDate: string): string {
  const date = new Date(isoDate);
  if (date <= new Date()) return "Unlocked";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getUnlockInfo(unlockDate: string, now: Date = new Date()): { isUnlocked: boolean; label: string; sublabel: string } {
  const unlock = new Date(unlockDate);
  if (unlock <= now) return { isUnlocked: true, label: "Unlocked", sublabel: "" };
  const diff = unlock.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateStr = `${unlock.getDate()} ${months[unlock.getMonth()]} ${unlock.getFullYear()}`;
  return { isUnlocked: false, label: `${days}d ${hours}h ${mins}m`, sublabel: `(${dateStr})` };
}

function computeAccumulatedValue(stake: StakeRecord, now: Date = new Date()): number {
  // Rewards stop accumulating once the unlock date is reached
  const unlockDate = new Date(stake.unlockDate);
  const effectiveNow = now < unlockDate ? now : unlockDate;

  if (stake.autoCompound) {
    const base = stake.rewardsStartTime ?? stake.stakedAt;
    const days = (effectiveNow.getTime() - new Date(base).getTime()) / 86400000;
    return Math.max(0, stake.amount * (Math.pow(1 + stake.apy / 365, days) - 1));
  }
  // Use the most recent reset timestamp to prevent double-counting across toggling
  const base = [stake.stakedAt, stake.harvestedAt, stake.rewardsStartTime]
    .filter((s): s is string => !!s)
    .sort()
    .at(-1)!;
  const days = (effectiveNow.getTime() - new Date(base).getTime()) / 86400000;
  return Math.max(0, stake.amount * stake.apy * (days / 365));
}

function buildAccumulatedRewardsChartData(stakes: StakeRecord[], valueNow: Date, axisNow: Date, windowSecs = 90): LivelinePoint[] {
  const harvestableStakes = stakes.filter((stake) => !stake.autoCompound);
  const axisNowTs = Math.floor(axisNow.getTime() / 1000);

  if (harvestableStakes.length === 0) {
    return Array.from({ length: windowSecs + 1 }, (_, index) => ({
      time: axisNowTs - windowSecs + index,
      value: 0.0001,
    }));
  }

  const points = Array.from({ length: windowSecs + 1 }, (_, index) => {
    const time = axisNowTs - windowSecs + index;
    const pointDate = new Date(valueNow.getTime() - (windowSecs - index) * 1000);
    const value = harvestableStakes.reduce((sum, stake) => sum + computeAccumulatedValue(stake, pointDate), 0);
    return { time, value };
  });

  const hasMovement = points.some((point) => point.value > 0);
  if (hasMovement) return points;

  return points.map((point) => ({ ...point, value: 0.0001 }));
}

const ACCUMULATED_REWARDS_CHART_PRESETS = {
  current: {
    grid: true,
    badge: true,
    badgeTail: true,
    fill: true,
    pulse: true,
    momentum: true,
    lineWidth: 2,
    padding: { top: 12, right: 88, bottom: 26, left: 12 },
  },
  justLine: {
    grid: false,
    badge: false,
    badgeTail: false,
    fill: false,
    pulse: false,
    momentum: false,
    lineWidth: 2,
    padding: { top: 12, right: 12, bottom: 20, left: 12 },
  },
} as const;

const ACTIVE_ACCUMULATED_REWARDS_CHART_PRESET: keyof typeof ACCUMULATED_REWARDS_CHART_PRESETS = "justLine";
const MAX_STAKE_INPUT = 99_999_999;

function AccumulatedRewardsLiveline({ data, value, timeOffsetSecs = 0, windowSecs = 90 }: {
  data: LivelinePoint[];
  value: number;
  timeOffsetSecs?: number;
  windowSecs?: number;
}) {
  const chartData = data.length >= 2 ? data : [
    { time: Math.floor(Date.now() / 1000) - windowSecs, value: 0.0001 },
    { time: Math.floor(Date.now() / 1000), value: 0.0001 },
  ];
  const chartValue = Math.max(value, 0.0001);
  const preset = ACCUMULATED_REWARDS_CHART_PRESETS[ACTIVE_ACCUMULATED_REWARDS_CHART_PRESET];

  return (
    <Liveline
      data={chartData}
      value={chartValue}
      theme="dark"
      color="#F4D6A3"
      window={windowSecs}
      grid={preset.grid}
      badge={preset.badge}
      badgeTail={preset.badgeTail}
      fill={preset.fill}
      scrub={false}
      pulse={preset.pulse}
      momentum={preset.momentum}
      emptyText="No rewards yet"
      formatValue={(v) => `${fmtAccumulatedRewardGra(v)} GRA`}
      formatTime={(t) => {
        const date = new Date((t + timeOffsetSecs) * 1000);
        const mins = `${date.getMinutes()}`.padStart(2, "0");
        const secs = `${date.getSeconds()}`.padStart(2, "0");
        return `${mins}:${secs}`;
      }}
      lerpSpeed={0.12}
      lineWidth={preset.lineWidth}
      padding={preset.padding}
    />
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

// Fresh icon URLs (fetched 2026-03-28).
// Figma renders both tabs with the same "vuesax/bold/buy-crypto" icon
// in its default and active states respectively.
const NAV_TABS = [
  {
    id:          "stake"     as const,
    label:       "Stake",
    iconDefault: ASSETS.stakeDefault,
    iconActive:  ASSETS.stakeActive,
  },
  {
    id:          "portfolio" as const,
    label:       "Portfolio",
    iconDefault: ASSETS.portfolioDefault,
    iconActive:  ASSETS.portfolioActive,
  },
];

function Nav({ activeNav, onNavChange }: {
  activeNav: "stake" | "portfolio";
  onNavChange: (v: "stake" | "portfolio") => void;
}) {
  const listRef       = useRef<HTMLUListElement>(null);
  const overlayRef    = useRef<HTMLUListElement>(null);
  const highlightRef  = useRef<HTMLDivElement>(null);
  const tabRefs       = useRef<(HTMLLIElement | null)[]>([]);
  const isFirstRender = useRef(true);
  const [overlayReady, setOverlayReady] = useState(false);

  useLayoutEffect(() => {
    const idx         = NAV_TABS.findIndex((t) => t.id === activeNav);
    const tabEl       = tabRefs.current[idx];
    const listEl      = listRef.current;
    const overlayEl   = overlayRef.current;
    const highlightEl = highlightRef.current;
    if (!tabEl || !listEl || !overlayEl) return;

    // offsetLeft / offsetWidth are relative to the nearest positioned ancestor.
    // .navList has position:relative, so <li> offsets are relative to the list.
    const containerW = listEl.offsetWidth;
    const leftPx     = tabEl.offsetLeft;
    const tabW       = tabEl.offsetWidth;
    const rightPx    = containerW - leftPx - tabW;

    const leftPct  = ((leftPx  / containerW) * 100).toFixed(3);
    const rightPct = ((rightPx / containerW) * 100).toFixed(3);
    const clip     = `inset(0 ${rightPct}% 0 ${leftPct}% round 9999px)`;

    if (isFirstRender.current) {
      overlayEl.style.transition = "none";
      overlayEl.style.clipPath   = clip;
      overlayEl.style.setProperty("-webkit-clip-path", clip);
      if (highlightEl) {
        highlightEl.style.transition = "none";
        highlightEl.style.left  = `${leftPx}px`;
        highlightEl.style.width = `${tabW}px`;
      }
      requestAnimationFrame(() => {
        overlayEl.style.transition = "";
        if (highlightEl) highlightEl.style.transition = "";
        setOverlayReady(true);
      });
      isFirstRender.current = false;
    } else {
      overlayEl.style.clipPath = clip;
      overlayEl.style.setProperty("-webkit-clip-path", clip);
      if (highlightEl) {
        highlightEl.style.left  = `${leftPx}px`;
        highlightEl.style.width = `${tabW}px`;
      }
    }
  }, [activeNav]);

  return (
    <nav className={styles.nav}>
      <div className={styles.navWrapper}>
        {/* Bottom list — default style, position:relative so <li> offsetLeft is correct */}
        <ul ref={listRef} className={styles.navList}>
          {NAV_TABS.map((tab, i) => (
            <li key={tab.id} ref={(el) => { tabRefs.current[i] = el; }}>
              <button className={`${styles.navItem} ${activeNav === tab.id ? styles.navItemActive : ""} ${activeNav === tab.id && !overlayReady ? styles.navItemActiveFallback : ""}`} onClick={() => onNavChange(tab.id)}>
                <span className={styles.navIcon} style={{ maskImage: `url(${tab.iconDefault})`, WebkitMaskImage: `url(${tab.iconDefault})` }} />
                <span className={styles.navLabel}>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Top list — pill background + white text, clipped via direct DOM ref */}
        <ul
          ref={overlayRef}
          className={`${styles.navOverlay} ${overlayReady ? styles.overlayReady : styles.overlayPending}`}
          aria-hidden="true"
        >
          {NAV_TABS.map((tab) => (
            <li key={tab.id}>
              <button className={styles.navItemOverlay} tabIndex={-1}>
                <span className={styles.navIcon} style={{ maskImage: `url(${tab.iconActive})`, WebkitMaskImage: `url(${tab.iconActive})` }} />
                <span className={styles.navLabel}>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Highlight — sibling of navOverlay, not affected by its clip-path */}
        <div ref={highlightRef} className={styles.navHighlight} aria-hidden="true" />
      </div>
    </nav>
  );
}

function Header({ activeNav, onNavChange, onWalletClick, isConnected }: {
  activeNav: "stake" | "portfolio";
  onNavChange: (v: "stake" | "portfolio") => void;
  onWalletClick: () => void;
  isConnected: boolean;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* Logo */}
        <a href="/" className={styles.logo}>
          <img src={ASSETS.headerLogo} alt="Gemra" width={107} height={40} style={{ display: "block" }} />
        </a>

        {/* Navigation */}
        <Nav activeNav={activeNav} onNavChange={onNavChange} />

        {/* Wallet */}
        <button className={styles.walletButton} aria-label={isConnected ? "Connected wallet" : "Connect wallet"} onClick={onWalletClick}>
          <span className={styles.walletBtnSlot}>
            <span className={`${styles.walletBtnLayer} ${isConnected ? styles.walletBtnLayerVisible : styles.walletBtnLayerHidden}`} aria-hidden={!isConnected}>
              <PhantomIcon />
              <span className={styles.walletAddress}>{WALLET_ADDRESS_DISPLAY}</span>
            </span>
            <span className={`${styles.walletBtnLayer} ${!isConnected ? styles.walletBtnLayerVisible : styles.walletBtnLayerHidden}`} aria-hidden={isConnected}>
              <span className={styles.walletAddress}>Connect wallet</span>
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Top bar (Stake/Unstake switch)
// ---------------------------------------------------------------------------

const MODE_TABS = [
  { id: "stake"   as const, label: "Stake"   },
  { id: "unstake" as const, label: "Unstake" },
];

// ---------------------------------------------------------------------------
// Generic tab switcher — reused for ModeSwitch and WalletModal fee control
// Uses the exact same CSS classes and clip-path animation as the original.
// fillWidth: stretches tabs to fill the container (for fixed-width contexts).
// ---------------------------------------------------------------------------
type TabItem = { id: string; label: React.ReactNode };

function TabSwitcher({ tabs, value, onChange, fillWidth = false }: {
  tabs: TabItem[];
  value: string;
  onChange: (v: string) => void;
  fillWidth?: boolean;
}) {
  const listRef       = useRef<HTMLUListElement>(null);
  const overlayRef    = useRef<HTMLUListElement>(null);
  const highlightRef  = useRef<HTMLDivElement>(null);
  const tabRefs       = useRef<(HTMLLIElement | null)[]>([]);
  const isFirstRender = useRef(true);
  const [overlayReady, setOverlayReady] = useState(false);

  useLayoutEffect(() => {
    const idx         = tabs.findIndex((t) => t.id === value);
    const tabEl       = tabRefs.current[idx];
    const listEl      = listRef.current;
    const overlayEl   = overlayRef.current;
    const highlightEl = highlightRef.current;
    if (!tabEl || !listEl || !overlayEl) return;

    const containerW = listEl.offsetWidth;
    const leftPx     = tabEl.offsetLeft;
    const tabW       = tabEl.offsetWidth;
    const rightPx    = containerW - leftPx - tabW;

    const leftPct  = ((leftPx  / containerW) * 100).toFixed(3);
    const rightPct = ((rightPx / containerW) * 100).toFixed(3);
    const clip     = `inset(0 ${rightPct}% 0 ${leftPct}% round 9999px)`;

    if (isFirstRender.current) {
      overlayEl.style.transition = "none";
      overlayEl.style.clipPath   = clip;
      overlayEl.style.setProperty("-webkit-clip-path", clip);
      if (highlightEl) {
        highlightEl.style.transition = "none";
        highlightEl.style.left  = `${leftPx}px`;
        highlightEl.style.width = `${tabW}px`;
      }
      requestAnimationFrame(() => {
        overlayEl.style.transition = "";
        if (highlightEl) highlightEl.style.transition = "";
        setOverlayReady(true);
      });
      isFirstRender.current = false;
    } else {
      overlayEl.style.clipPath = clip;
      overlayEl.style.setProperty("-webkit-clip-path", clip);
      if (highlightEl) {
        highlightEl.style.left  = `${leftPx}px`;
        highlightEl.style.width = `${tabW}px`;
      }
    }
  }, [value, tabs]);

  const liStyle  = fillWidth ? { flex: 1 } : undefined;
  const btnStyle = fillWidth ? { width: "100%" } : undefined;

  return (
    <div className={styles.modeSwitchWrapper} style={fillWidth ? { width: "100%" } : undefined}>
      <ul ref={listRef} className={styles.modeSwitchList} style={fillWidth ? { width: "100%" } : undefined}>
        {tabs.map((tab, i) => (
          <li key={tab.id} ref={(el) => { tabRefs.current[i] = el; }} style={liStyle}>
            <button
              className={`${styles.modeSwitchItem} ${value === tab.id ? styles.modeSwitchItemActive : ""} ${value === tab.id && !overlayReady ? styles.modeSwitchItemActiveFallback : ""}`}
              onClick={() => onChange(tab.id)}
              style={btnStyle}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <ul
          ref={overlayRef}
          className={`${styles.modeSwitchOverlay} ${overlayReady ? styles.overlayReady : styles.overlayPending}`}
          aria-hidden="true"
          style={fillWidth ? { width: "100%" } : undefined}>
        {tabs.map((tab) => (
          <li key={tab.id} style={liStyle}>
            <button className={styles.modeSwitchItemOverlay} tabIndex={-1} style={btnStyle}>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div ref={highlightRef} className={styles.modeSwitchHighlight} aria-hidden="true" />
    </div>
  );
}

function ModeSwitch({ mode, onModeChange }: {
  mode: "stake" | "unstake";
  onModeChange: (v: "stake" | "unstake") => void;
}) {
  return (
    <div className={styles.modeSwitch}>
      <TabSwitcher tabs={MODE_TABS} value={mode} onChange={(v) => onModeChange(v as "stake" | "unstake")} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Amount input
// ---------------------------------------------------------------------------

function AmountInput({ value, onChange, onHalf, onMax, activeChip, errorMessage }: {
  value: string;
  onChange: (v: string) => void;
  onHalf: () => void;
  onMax: () => void;
  activeChip: "half" | "max" | null;
  errorMessage: string | null;
}) {
  const isError = !!errorMessage;

  return (
    <div className={styles.amountInputWrapper}>
    <div className={`${styles.amountInput} ${isError ? styles.amountInputError : ""}`}>
      <span className={styles.amountTokenIcon} style={{ maskImage: `url(${ASSETS.tokenImg})`, WebkitMaskImage: `url(${ASSETS.tokenImg})` }} />
      <div className={styles.amountDivider} />
      <input
        className={styles.amountValue}
        type="text"
        inputMode="decimal"
        value={value}
        placeholder="0.00"
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, "");
          if ((raw.match(/\./g) || []).length <= 1) onChange(raw);
        }}
      />
      <div className={styles.amountSelectors}>
        <button
          className={`${styles.amountChip} ${activeChip === "half" ? styles.amountChipActive : ""}`}
          onClick={onHalf}
        >
          <span className={styles.amountChipText}>50%</span>
        </button>
        <button
          className={`${styles.amountChip} ${activeChip === "max" ? styles.amountChipActive : ""}`}
          onClick={onMax}
        >
          <span className={styles.amountChipText}>MAX</span>
        </button>
      </div>
      <div className={styles.amountInputInset} />
    </div>
    {errorMessage && (
      <span className={styles.amountErrorText}>{errorMessage}</span>
    )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Period selector grid
// ---------------------------------------------------------------------------

function PeriodGrid({ selected, onSelect }: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className={styles.stakeSectionCard}>
      <div className={styles.sectionLabel}>
        <span className={styles.sectionLabelText}>Lock period</span>
        <InfoTooltip
          width={284}
          text="Longer periods earn higher APY. Tokens are locked until the end date — early withdrawal is not available."
        />
      </div>
      <div className={styles.periodGrid}>
        {PERIODS.map((p, i) => (
          <button
            key={p.duration}
            className={`${styles.periodCard} ${i === selected ? styles.periodCardActive : styles.periodCardDefault}`}
            onClick={() => onSelect(i)}
          >
            <span className={styles.periodApy}>APY {Math.round(p.apy * 100)}%</span>
            <span className={`${styles.periodLabel} ${i === selected ? styles.periodLabelActive : styles.periodLabelDefault}`}>
              {p.duration}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto-compound toggle
// ---------------------------------------------------------------------------

function AutoCompoundRow({ on, onToggle, amount, periodIndex }: { on: boolean; onToggle: () => void; amount: string; periodIndex: number }) {
  const helperText = on
    ? "Earnings are re-staked every 24h"
    : "Rewards stay separate and remain claimable";
  const period = PERIODS[periodIndex];
  const simpleReward = parseFloat(calcRewards(amount || "100", period, false));
  const compoundReward = parseFloat(calcRewards(amount || "100", period, true));
  const upliftPercent = simpleReward > 0
    ? Math.round(((compoundReward - simpleReward) / simpleReward) * 100)
    : 0;

  return (
    <div className={`${styles.stakeSectionCard} ${styles.autoCompoundSection}`}>
      <div className={`${styles.sectionLabel} ${styles.autoCompoundSectionLabel}`}>
        <span className={styles.sectionLabelText}>AUTO-COMPOUND</span>
        <InfoTooltip
          width={284}
          text="Rewards are restaked every 24h, growing your position automatically. Disable to claim them manually."
        />
      </div>
      <div className={styles.autoCompoundRow} onClick={onToggle}>
        <span className={styles.autoCompoundHint}>{helperText}</span>
        <div className={styles.autoCompoundToggleGroup}>
          <span className={`${styles.autoCompoundUplift} ${on ? styles.autoCompoundUpliftOn : styles.autoCompoundUpliftOff}`}>
            +{upliftPercent}%
          </span>
          <button
            role="switch"
            aria-checked={on}
            className={`${styles.toggle} ${on ? styles.toggleOn : styles.toggleOff}`}
            tabIndex={-1}
          >
            <span className={`${styles.toggleThumb} ${on ? styles.toggleThumbOn : styles.toggleThumbOff}`}>
              <span className={styles.toggleThumbInner} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

const STAKE_FAQ_ITEMS = [
  {
    id: "what-is-staking",
    question: "What is staking?",
    answer:
      "Staking lets you lock your GRA to earn native protocol rewards over time. Your rewards depend on the selected lock period and whether auto-compound is enabled for that position.",
  },
  {
    id: "lock-period",
    question: "What does the lock period mean?",
    answer:
      "Your tokens stay locked until the unlock date you choose. Longer lock periods usually offer a higher APY, but you won’t be able to unstake or move that position before it unlocks.",
  },
  {
    id: "auto-compound",
    question: "What does auto-compound do?",
    answer:
      "When enabled, rewards are added back to your staked balance every 24 hours, so future rewards are earned on a larger base. This usually results in higher total rewards than keeping rewards separate over time.",
  },
  {
    id: "how-to-stake",
    question: "How does staking work here?",
    answer:
      "Choose the amount, select a lock period, review the details, and confirm the transaction in your wallet. Once the stake is active, rewards start accumulating based on your selected APY and reward settings automatically.",
  },
  {
    id: "support",
    question: "How can I contact support?",
    answer: (
      <>
        If you need help with staking, rewards, or wallet issues, contact support via{" "}
        <a
          href="https://t.me/"
          target="_blank"
          rel="noreferrer"
          className={styles.stakeFaqLink}
        >
          Telegram
        </a>
        . We recommend including your wallet address and a short description of the issue so the team can help faster.
      </>
    ),
  },
] as const;

function StakeFaq() {
  const [openItem, setOpenItem] = useState<string | null>(STAKE_FAQ_ITEMS[0].id);

  function toggleItem(id: string) {
    setOpenItem((current) => (current === id ? null : id));
  }

  return (
    <div className={styles.stakeFaqSection}>
      <h2 className={styles.stakeFaqTitle}>FAQ</h2>
      <div className={styles.stakeFaqStack}>
        {STAKE_FAQ_ITEMS.map((item) => (
          <StakeFaqItem
            key={item.id}
            item={item}
            isOpen={openItem === item.id}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StakeFaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof STAKE_FAQ_ITEMS)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.stakeFaqItem}>
      <button
        type="button"
        className={`${styles.stakeFaqTrigger} ${isOpen ? styles.stakeFaqTriggerOpen : ""}`}
        onClick={onToggle}
        onMouseDown={(e) => e.preventDefault()}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${item.id}`}
      >
        <span className={styles.stakeFaqQuestion}>{item.question}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${styles.stakeFaqChevron} ${isOpen ? styles.stakeFaqChevronOpen : ""}`}
          aria-hidden="true"
        >
          <path d="M17.92 8.18H12.31H6.08c-1.3 0-1.96 1.57-1.04 2.49l5.08 5.08c.83.83 2.19.83 3.02 0l1.99-1.99 3.09-3.09c.91-.92.25-2.49-1.05-2.49Z" fill="#A5A3AC"/>
        </svg>
      </button>

      <div
        id={`faq-panel-${item.id}`}
        className={`${styles.stakeFaqPanel} ${isOpen ? styles.stakeFaqPanelOpen : styles.stakeFaqPanelClosed}`}
      >
        <div
          className={`${styles.stakeFaqPanelInner} ${isOpen ? styles.stakeFaqPanelInnerOpen : ""}`}
        >
          <p className={styles.stakeFaqAnswer}>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

function FaqModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [openItem, setOpenItem] = useState<string | null>(STAKE_FAQ_ITEMS[0].id);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function toggleItem(id: string) {
    setOpenItem((current) => (current === id ? null : id));
  }

  return (
    <>
      <div
        className={`${styles.wmBackdrop} ${open ? styles.wmBackdropOpen : ""}`}
        onClick={open ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className={`${styles.faqModalPanel} ${open ? styles.faqModalPanelOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="FAQ"
      >
        <div className={styles.faqModalHeader}>
          <span className={styles.faqModalTitle}>FAQ</span>
          <button className={`${styles.wmCloseBtn} ${styles.faqModalCloseBtn}`} onClick={onClose} aria-label="Close">
            <span className={styles.wmEscHint}>ESC</span>
            {UM_CLOSE_SVG}
          </button>
        </div>

        <div className={styles.faqModalContent}>
          <div className={styles.faqModalFaqShell}>
            <div className={styles.stakeFaqStack}>
              {STAKE_FAQ_ITEMS.map((item) => (
                <StakeFaqItem
                  key={item.id}
                  item={item}
                  isOpen={openItem === item.id}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// RollingNumber — slot-machine digit animation
// ---------------------------------------------------------------------------

function RollingTrack({ digit, delay }: { digit: number; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Always keep a ref in sync with the latest digit so the RAF closure
  // reads the correct value even if the prop updates before the frame fires.
  const digitRef = useRef(digit);
  digitRef.current = digit;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Start at position 0 (digit "0") with no transition so the browser
    // paints this initial state before animating to the real digit.
    el.style.transition = "none";
    el.style.transform = "translateY(0%)";
    requestAnimationFrame(() => {
      el.style.transition = "";
      el.style.transform = `translateY(-${digitRef.current * 10}%)`;
    });
  }, []); // mount only — subsequent digit changes are handled by inline style

  return (
    <span
      ref={ref}
      className={styles.rollingTrack}
      style={{
        transform: `translateY(-${digit * 10}%)`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <span key={n} className={styles.rollingDigit}>{n}</span>
      ))}
    </span>
  );
}

function RollingNumber({ value }: { value: string }) {
  const chars = value.split("");
  const totalDigits = chars.filter((c) => /[0-9]/.test(c)).length;
  let digitIndex = 0;

  return (
    <span className={styles.rollingNumber}>
      {chars.map((char, i) => {
        if (/[0-9]/.test(char)) {
          const d = parseInt(char);
          const idx = digitIndex++;
          return (
            <span key={i} className={styles.rollingSlot}>
              <RollingTrack digit={d} delay={(totalDigits - idx) * 40} />
            </span>
          );
        }
        return <span key={i} className={styles.rollingStatic}>{char}</span>;
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Estimated rewards
// ---------------------------------------------------------------------------

function EstimatedRewards({ amount, periodIndex, autoCompound }: {
  amount: string;
  periodIndex: number;
  autoCompound: boolean;
}) {
  const period = PERIODS[periodIndex];
  const reward = parseFloat(calcRewards(amount, period, autoCompound)).toFixed(2);
  const apyPct = Math.round(period.apy * 100);
  const compoundLabel = autoCompound ? "with compound" : "simple interest";

  return (
    <div className={`${styles.stakeSectionCard} ${styles.stakeRewardsSection}`}>
      <div className={styles.estimatedRewards}>
      <span className={styles.rewardsAmount}>
        <RollingNumber value={reward} />
        {"\u00a0GRA"}
      </span>
      <span className={styles.rewardsCaption}>
        Estimated rewards at {apyPct}% APY {compoundLabel}
      </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Review screen
// ---------------------------------------------------------------------------

function ReviewStep2({ selectedPeriod, amount, onStake }: {
  selectedPeriod: number;
  amount: string;
  onStake: () => void;
}) {
  const period = PERIODS[selectedPeriod];
  const stakeAmount = parseFloat(amount) || 0;

  const s2TimerSvg = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <path d="M17.3899 15.67L13.3499 12H10.6399L6.59988 15.67C5.46988 16.69 5.09988 18.26 5.64988 19.68C6.19988 21.09 7.53988 22 9.04988 22H14.9399C16.4599 22 17.7899 21.09 18.3399 19.68C18.8899 18.26 18.5199 16.69 17.3899 15.67ZM13.8199 18.14H10.1799C9.79988 18.14 9.49988 17.83 9.49988 17.46C9.49988 17.09 9.80988 16.78 10.1799 16.78H13.8199C14.1999 16.78 14.4999 17.09 14.4999 17.46C14.4999 17.83 14.1899 18.14 13.8199 18.14Z" fill="#A5A3AC"/>
      <path d="M18.3503 4.3198C17.8003 2.9098 16.4603 1.9998 14.9503 1.9998H9.05026C7.54026 1.9998 6.20026 2.9098 5.65026 4.3198C5.11026 5.7398 5.48026 7.3098 6.61026 8.3298L10.6503 11.9998H13.3603L17.4003 8.3298C18.5203 7.3098 18.8903 5.7398 18.3503 4.3198ZM13.8203 7.2298H10.1803C9.80026 7.2298 9.50026 6.9198 9.50026 6.5498C9.50026 6.1798 9.81026 5.8698 10.1803 5.8698H13.8203C14.2003 5.8698 14.5003 6.1798 14.5003 6.5498C14.5003 6.9198 14.1903 7.2298 13.8203 7.2298Z" fill="#A5A3AC"/>
    </svg>
  );
  const s2UnlockSvg = (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <g filter="url(#filter0_i_s2_unlock)">
        <path d="M13.125 6.875C15.311 6.875 17.0828 8.64703 17.083 10.833V14.167C17.0828 16.353 15.311 18.125 13.125 18.125H6.45801C4.27214 18.1248 2.50018 16.3529 2.5 14.167V10.833C2.50018 8.64714 4.27214 6.87518 6.45801 6.875H13.125ZM9.79199 11.042C9.44681 11.042 9.16699 11.3218 9.16699 11.667V13.334C9.16734 13.6789 9.44703 13.959 9.79199 13.959C10.1368 13.9588 10.4166 13.6788 10.417 13.334V11.667C10.417 11.3219 10.137 11.0422 9.79199 11.042Z" fill="#A5A3AC"/>
        <path d="M6.04167 5.83301C6.04175 4.79944 6.43779 3.85826 7.08659 3.15332C7.09875 3.1401 7.11137 3.1273 7.1237 3.11426C7.17954 3.05521 7.2372 2.99791 7.29655 2.94238C7.30647 2.93311 7.31584 2.92323 7.32585 2.91406C7.38983 2.85541 7.45634 2.7995 7.52409 2.74512C7.54055 2.73192 7.55722 2.71899 7.57389 2.70605C7.96633 2.40116 8.41757 2.16879 8.90788 2.02832C8.91227 2.02706 8.91715 2.02664 8.92155 2.02539C9.1038 1.97388 9.29116 1.9352 9.48307 1.91016C9.50033 1.90788 9.51755 1.90537 9.53483 1.90332C9.62545 1.89271 9.71687 1.88427 9.80924 1.87988C9.82096 1.87932 9.83269 1.87937 9.8444 1.87891C9.89592 1.87691 9.94766 1.875 9.99967 1.875V1.87793C10.4487 1.87789 10.8976 1.95135 11.3258 2.10352C12.1037 2.38004 12.7757 2.89295 13.2477 3.57031C13.445 3.85346 13.3755 4.24307 13.0924 4.44043C12.8092 4.63773 12.4196 4.56839 12.2223 4.28516C11.8993 3.82151 11.4393 3.47046 10.9069 3.28125C10.544 3.15228 10.1598 3.10476 9.77995 3.13574C9.75121 3.13805 9.72249 3.13938 9.69401 3.14258C9.58774 3.15466 9.48232 3.17447 9.3776 3.19922C9.29538 3.21857 9.21456 3.24092 9.13542 3.26758C9.087 3.28389 9.03912 3.30136 8.99186 3.32031C8.96364 3.33164 8.93562 3.34322 8.90788 3.35547C8.85583 3.37841 8.80494 3.40358 8.75456 3.42969C8.73412 3.4403 8.71316 3.44983 8.69303 3.46094C8.62475 3.49855 8.55854 3.53969 8.49381 3.58301C8.48819 3.58678 8.48281 3.59091 8.47721 3.59473C8.41734 3.63545 8.35888 3.6782 8.30241 3.72363C8.27613 3.7448 8.25072 3.76694 8.22526 3.78906C8.19082 3.81896 8.15665 3.8492 8.1237 3.88086C8.10162 3.90208 8.0806 3.92433 8.05924 3.94629C8.02187 3.98472 7.98501 4.02372 7.94987 4.06445C7.54008 4.53898 7.29175 5.15685 7.29167 5.83301V7.5H6.04167V5.83301Z" fill="#A5A3AC"/>
      </g>
      <defs>
        <filter id="filter0_i_s2_unlock" x="0" y="0" width="20" height="20.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="0.2"/>
          <feGaussianBlur stdDeviation="0.1"/>
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"/>
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_s2_unlock"/>
        </filter>
      </defs>
    </svg>
  );
  const s2TrendSvg = (
    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <g filter="url(#filter0_i_s2_trend)">
        <path d="M10.6347 1.59345C11.1164 1.12775 11.9704 1.45513 11.9706 2.16962V8.05927H15.0029C15.8593 8.05927 16.3499 9.03517 15.8388 9.72235L9.455 18.3024C8.99993 18.914 8.02824 18.5921 8.02824 17.8298V11.9411H4.99504C4.13866 11.9409 3.64882 10.9642 4.16008 10.277L10.5439 1.69696L10.6347 1.59345Z" fill="#A5A3AC"/>
      </g>
      <defs>
        <filter id="filter0_i_s2_trend" x="0" y="0" width="20" height="20.1667" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="0.166667"/>
          <feGaussianBlur stdDeviation="0.0833333"/>
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"/>
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_s2_trend"/>
        </filter>
      </defs>
    </svg>
  );
  const s2AmountSvg = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <path d="M21.9991 8.50098C21.9991 11.761 19.5991 14.451 16.4791 14.921V14.861C16.1691 10.981 13.0191 7.83098 9.1091 7.52098H9.0791C9.5491 4.40098 12.2391 2.00098 15.4991 2.00098C19.0891 2.00098 21.9991 4.91098 21.9991 8.50098Z" fill="#A5A3AC"/>
      <path d="M14.978 14.98C14.728 11.81 12.188 9.27 9.01805 9.02C8.84805 9.01 8.66805 9 8.49805 9C4.90805 9 1.99805 11.91 1.99805 15.5C1.99805 19.09 4.90805 22 8.49805 22C12.088 22 14.998 19.09 14.998 15.5C14.998 15.33 14.988 15.15 14.978 14.98ZM9.37805 16.38L8.49805 18L7.61805 16.38L5.99805 15.5L7.61805 14.62L8.49805 13L9.37805 14.62L10.998 15.5L9.37805 16.38Z" fill="#A5A3AC"/>
    </svg>
  );
  const rows = [
    { icon: s2TimerSvg,  label: "Lock duration", value: period.duration,                         dimIcon: false },
    { icon: s2UnlockSvg, label: "Unlock date",   value: formatUnlockDate(period.days),           dimIcon: false },
    { icon: s2TrendSvg,  label: "APY",           value: `${Math.round(period.apy * 100)}%`,      dimIcon: false },
    { icon: s2AmountSvg, label: "Stake amount",  value: `${stakeAmount.toFixed(2)} GRA`,         dimIcon: false },
  ];

  return (
    <div className={styles.s2Content}>
      {rows.map((row) => (
        <div key={row.label} className={`${styles.stakeSectionCard} ${styles.s2SectionCard}`}>
          <div className={styles.s2Row}>
            <div className={styles.s2RowIcon} style={row.dimIcon ? { opacity: 0.7 } : undefined}>
              {row.icon}
            </div>
            <div className={styles.s2RowTexts}>
              <span className={styles.s2RowLabel}>{row.label}</span>
              <span className={styles.s2RowValue}>{row.value}</span>
            </div>
          </div>
        </div>
      ))}
      <button className={styles.continueButton} onClick={onStake}>
        <span className={styles.continueButtonInner}>
          <span className={styles.continueButtonText}>Stake {stakeAmount.toFixed(2)} GRA</span>
        </span>
      </button>
      <p className={styles.s2Footnote}>
        Tokens will be locked until the unlock date and cannot be withdrawn. Please ensure you won&apos;t need these funds before then.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Transaction confirming
// ---------------------------------------------------------------------------

function ConfirmingStep3() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.s3Container}>
      <Lottie animationData={loaderAnimationAccent} loop={true} style={{ width: 88, height: 88 }} />
      <div className={styles.s3TextBlock}>
        <p className={styles.s3Title}>Confirming{".".repeat(dots)}</p>
        <p className={styles.s3Subtitle}>Awaiting wallet signature and blockchain confirmation.</p>
        <a
          href="https://solscan.io/account/9C91mKpL3QnBtWsJvCXgT4rR8uHwXiQoMaSpVt35Ya1"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.s3ExplorerLink}
        >
          View in explorer
        </a>
      </div>
    </div>
  );
}

function AnimatedDots() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);

  return <>{ ".".repeat(dots) }</>;
}

// ---------------------------------------------------------------------------
// Step 4 — Success
// ---------------------------------------------------------------------------

function SuccessStep4({ amount, onStakeMore, onViewPortfolio }: {
  amount: string;
  onStakeMore: () => void;
  onViewPortfolio: () => void;
}) {
  const stakeAmount = parseFloat(amount) || 0;
  return (
    <div className={styles.s4Step}>
      <div className={styles.s4Container}>
        <div className={styles.s4Content}>
          <SuccessStateIcon />
          <div className={styles.s4TextBlock}>
            <p className={styles.s4Title}>Stake successful!</p>
            <p className={styles.s4Subtitle}>{stakeAmount.toFixed(2)} GRA is locked and working for you.</p>
            <a
              href="https://solscan.io/account/9C91mKpL3QnBtWsJvCXgT4rR8uHwXiQoMaSpVt35Ya1"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.s3ExplorerLink}
            >
              View in explorer
            </a>
          </div>
        </div>
      </div>
      <div className={styles.s4Buttons}>
        <button className={styles.continueButton} onClick={onViewPortfolio}>
          <span className={styles.continueButtonInner}>
            <span className={styles.continueButtonText}>Open my portfolio</span>
          </span>
        </button>
        <button className={`${styles.continueButton} ${styles.continueButtonSecondary}`} onClick={onStakeMore}>
          <span className={styles.continueButtonInner}>
            <span className={styles.continueButtonText}>Stake more</span>
          </span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stake form card
// ---------------------------------------------------------------------------

const WALLET_BALANCE = 2400.64;

function StakeForm({ walletBalance, resetKey, formStep, onStepChange, onViewPortfolio, onStakeComplete, isConnected, onConnect }: {
  walletBalance: number;
  resetKey: number;
  formStep: number;
  onStepChange: (s: number) => void;
  onViewPortfolio: () => void;
  onStakeComplete: (amount: number, periodIndex: number, autoCompound: boolean) => void;
  isConnected: boolean;
  onConnect: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(1); // 6 months default
  const [autoCompound, setAutoCompound] = useState(true);
  const [activeChip, setActiveChip] = useState<"half" | "max" | null>(null);

  // Fade transition state machine:
  // "idle" → "exiting" (200ms) → swap displayStep → "entering" (180ms delay + 280ms) → "idle"
  const [displayStep, setDisplayStep] = useState(formStep);
  const [phase, setPhase] = useState<"idle" | "exiting" | "entering">("idle");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  useEffect(() => {
    if (formStep === displayStep) return;
    setDirection(formStep > displayStep ? "forward" : "back");
    setPhase("exiting");
    const exitTimer = setTimeout(() => {
      setDisplayStep(formStep);
      setPhase("entering");
      const enterTimer = setTimeout(() => setPhase("idle"), 260);
      return () => clearTimeout(enterTimer);
    }, 150);
    return () => clearTimeout(exitTimer);
  }, [formStep]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setAmount("");
    setActiveChip(null);
  }, [resetKey]);

  // Auto-advance Step 3 → Step 4 after 5 seconds; save stake on success
  useEffect(() => {
    if (formStep !== 3) return;
    const timer = setTimeout(() => {
      onStakeComplete(parseFloat(amount) || 0, selectedPeriod, autoCompound);
      onStepChange(4);
    }, 4000);
    return () => clearTimeout(timer);
  }, [formStep]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStakeMore() {
    setAmount("");
    setActiveChip(null);
    setSelectedPeriod(1);
    setAutoCompound(true);
    onStepChange(1);
  }

  function handleAmountChange(v: string) {
    if (v === "") {
      setAmount("");
      setActiveChip(null);
      return;
    }

    const numeric = Number(v);
    if (!Number.isNaN(numeric) && numeric > MAX_STAKE_INPUT) {
      setAmount(MAX_STAKE_INPUT.toString());
      setActiveChip(null);
      return;
    }

    setAmount(v);
    setActiveChip(null);
  }
  function handleHalf() {
    setAmount(floorToDecimals(walletBalance / 2, 2).toFixed(2));
    setActiveChip("half");
  }
  function handleMax() {
    setAmount(floorToDecimals(walletBalance, 2).toFixed(2));
    setActiveChip("max");
  }

  const phaseClass =
    phase === "exiting" ? (direction === "back" ? styles.stepFadeExitBack : styles.stepFadeExit) :
    phase === "entering" ? (direction === "back" ? styles.stepFadeEnterBack : styles.stepFadeEnter) :
    "";
  const amountNumber = parseFloat(amount) || 0;
  const hasAmount = amount.trim() !== "";
  const hasInsufficientBalanceError = hasAmount && amountNumber - walletBalance > 0.01;
  const amountErrorMessage = hasInsufficientBalanceError ? "Insufficient balance" : null;

  return (
    <div className={styles.stakeFormStack}>
      <div className={`${styles.card} ${displayStep === 1 ? styles.cardStepOne : ""} ${displayStep === 2 ? styles.cardStepReview : ""} ${displayStep === 3 ? styles.cardStepLoading : ""} ${displayStep === 4 ? styles.cardStepSuccess : ""}`}>
        <div className={phaseClass}>
          <div style={{ display: displayStep === 1 ? "block" : "none" }}>
            <div className={styles.stakeStepOne}>
              <div className={styles.stakeSectionCard}>
                <div className={styles.stakeAvailableRow}>
                  <span className={styles.stakeAvailableLabel}>Available to stake</span>
                  <div className={styles.walletBalance}>
                    <WalletIcon />
                    <span className={styles.walletBalanceText}>{walletBalance.toLocaleString("en", { minimumFractionDigits: 2 })} GRA</span>
                  </div>
                </div>

                <AmountInput
                  value={amount}
                  onChange={handleAmountChange}
                  onHalf={handleHalf}
                  onMax={handleMax}
                  activeChip={activeChip}
                  errorMessage={amountErrorMessage}
                />
              </div>

              <PeriodGrid selected={selectedPeriod} onSelect={setSelectedPeriod} />

              <AutoCompoundRow on={autoCompound} onToggle={() => setAutoCompound((v) => !v)} amount={amount} periodIndex={selectedPeriod} />

              <EstimatedRewards
                amount={amount}
                periodIndex={selectedPeriod}
                autoCompound={autoCompound}
              />

              {isConnected ? (
                <button className={styles.continueButton} onClick={() => onStepChange(2)} disabled={!amount || amountNumber <= 0 || amountNumber > walletBalance}>
                  <span className={styles.continueButtonInner}>
                    <span className={styles.continueButtonText}>Continue</span>
                  </span>
                </button>
              ) : (
                <button className={`${styles.continueButton} ${styles.continueButtonSecondary}`} onClick={onConnect}>
                  <span className={styles.continueButtonInner}>
                    <span className={styles.continueButtonText}>Connect wallet</span>
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className={styles.stakeStep} style={{ display: displayStep === 2 ? "flex" : "none" }}>
            <ReviewStep2
              selectedPeriod={selectedPeriod}
              amount={amount}
              onStake={() => onStepChange(3)}
            />
          </div>

          <div className={styles.stakeStep} style={{ display: displayStep === 3 ? "flex" : "none" }}>
            <ConfirmingStep3 />
          </div>

          <div className={styles.stakeStep} style={{ display: displayStep === 4 ? "flex" : "none" }}>
            <SuccessStep4
              amount={amount}
              onStakeMore={handleStakeMore}
              onViewPortfolio={onViewPortfolio}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer socials
// ---------------------------------------------------------------------------

function Footer() {
  const socials = [
    { label: "Discord",     Icon: DiscordIcon  },
    { label: "Twitter (X)", Icon: TwitterIcon  },
    { label: "Telegram",    Icon: TelegramIcon },
  ];

  return (
    <footer className={styles.footer}>
      {socials.map(({ label, Icon }) => (
        <button key={label} className={styles.socialLink}>
          <Icon />
          <span className={styles.socialLabel}>{label}</span>
        </button>
      ))}
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ visible, message = "Address copied" }: { visible: boolean; message?: string }) {
  return (
    <div
      className={`${styles.toast} ${visible ? styles.toastVisible : ""}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={styles.toastIcon}>
        <img src={ASSETS.toastIconVector} alt="" style={{ display: "block", width: 16, height: 16 }} />
      </span>
      <span className={styles.toastText}>{message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unstake screen — empty state
// ---------------------------------------------------------------------------

function EmptyUnstakeView({ onStartStaking }: { onStartStaking: () => void }) {
  return (
    <div className={styles.emptyUnstakeStep}>
      <div className={styles.emptyUnstakeCard}>
        <div className={styles.unstakeContainer}>
          <div className={styles.unstakeTokensImg}>
            <img src={ASSETS.unstakeBlankStatus} alt="" width={272} height={252} style={{ display: "block", width: "100%", height: "100%" }} />
          </div>
          <div className={styles.unstakeContentBlock}>
            <div className={styles.unstakeTextBlock}>
              <p className={styles.unstakeTitle}>No active stakes</p>
              <p className={styles.unstakeSubtitle}>Start staking to earn rewards.</p>
            </div>
          </div>
        </div>
      </div>
      <button
        className={`${styles.continueButton} ${styles.continueButtonSecondary} ${styles.emptyUnstakeCta}`}
        onClick={onStartStaking}
      >
        <span className={styles.continueButtonInner}>
          <span className={styles.continueButtonText}>Start staking</span>
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unstake screen — active stakes
// ---------------------------------------------------------------------------


function PositionCard({ stake, now, onUnstake, onToggleAutoCompound, onHarvest, onShowToast }: {
  stake: StakeRecord;
  now: Date;
  onUnstake: (id: number) => void;
  onToggleAutoCompound: (id: number, enabled: boolean, rewardsAmount?: number) => void;
  onHarvest: (id: number, amount: number) => void;
  onShowToast: (msg: string) => void;
}) {
  const { isUnlocked, label: unlockLabel, sublabel: unlockSublabel } = getUnlockInfo(stake.unlockDate, now);
  const accValue = computeAccumulatedValue(stake, now);
  const rewardsLabel = stake.autoCompound ? "Compounded rewards" : "Rewards earned";
  const rewardsValue = stake.autoCompound ? (stake.compoundedTotal ?? 0) + accValue : accValue;
  const unlockValue = isUnlocked ? formatUnlockDisplay(stake.unlockDate) : `${unlockLabel} ${unlockSublabel}`.trim();
  const unlockValueMatch = !isUnlocked ? unlockValue.match(/^(.*?)(\s*\([^)]+\))$/) : null;

  function handleToggle() {
    const next = !stake.autoCompound;
    onToggleAutoCompound(stake.id, next, next ? accValue : undefined);
  }

  return (
    <div className={styles.positionCardFrame}>
      <div className={styles.positionCard}>
        <div className={styles.positionCardHeader}>
          <div className={styles.positionCardHeaderMain}>
            <span className={styles.positionAmountLabel}>Amount staked</span>
            <span className={styles.positionAmount}>{fmtGra(stake.amount)} GRA</span>
          </div>
          <div className={styles.positionApyBadge}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: "block" }}>
              <path d="M7.44428 1.11544C7.78148 0.789451 8.37923 1.01862 8.37941 1.51876V5.64152H10.501C11.1005 5.64152 11.4439 6.32466 11.0862 6.80568L6.61755 12.8117C6.299 13.2398 5.61882 13.0145 5.61882 12.4809V8.35875H3.4956C2.89613 8.35863 2.55324 7.67489 2.91112 7.1939L7.37976 1.18787L7.44428 1.11544Z" fill="#CAF29F"/>
            </svg>
            <span className={styles.positionApyBadgeText}>APY: {Math.round(stake.apy * 100)}%</span>
          </div>
        </div>

        <div className={styles.positionDetailsPanel}>
          <div className={styles.positionRow}>
            <div className={styles.positionRowLeft}>
              <div className={styles.positionIconBox}>
                <img src="/staking/compounded-icon-card.svg" alt="" width={20} height={20} style={{ display: "block" }} />
              </div>
              <div className={styles.positionRowText}>
                <span className={styles.positionSectionLabel}>Auto-compound</span>
                <span className={styles.positionSectionValue}>{stake.autoCompound ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
            <div className={styles.positionRowAction}>
              <button
                role="switch"
                aria-checked={stake.autoCompound}
                className={`${styles.toggle} ${stake.autoCompound ? styles.toggleOn : styles.toggleOff}`}
                onClick={handleToggle}
              >
                <span className={`${styles.toggleThumb} ${stake.autoCompound ? styles.toggleThumbOn : styles.toggleThumbOff}`}>
                  <span className={styles.toggleThumbInner} />
                </span>
              </button>
            </div>
          </div>

          <div className={styles.positionDivider1} />

          <div className={styles.positionRow}>
            <div className={styles.positionRowLeft}>
              <div className={styles.positionIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                  <g transform="translate(4 3.58)">
                    <path d="M14.736 8.416V13.469C14.736 15.33 13.229 16.837 11.368 16.837H4.631C2.77 16.837 1.263 15.33 1.263 13.469V8.416C1.263 7.953 1.642 7.574 2.105 7.574H3.764C4.227 7.574 4.606 7.953 4.606 8.416V11.06C4.606 11.683 4.951 12.256 5.499 12.551C5.743 12.686 6.012 12.753 6.29 12.753C6.61 12.753 6.93 12.66 7.208 12.475L8.008 11.953L8.749 12.45C9.263 12.795 9.92 12.837 10.467 12.542C11.023 12.248 11.368 11.683 11.368 11.052V8.416C11.368 7.953 11.747 7.574 12.21 7.574H13.894C14.357 7.574 14.736 7.953 14.736 8.416Z" fill="#A5A3AC"/>
                    <path d="M15.999 4.206V5.048C15.999 5.974 15.553 6.732 14.315 6.732H1.684C0.396 6.732 0 5.974 0 5.048V4.206C0 3.279 0.396 2.521 1.684 2.521H14.315C15.553 2.521 15.999 3.279 15.999 4.206Z" fill="#A5A3AC"/>
                    <path d="M7.696 2.524H3.048C2.761 2.213 2.77 1.733 3.073 1.429L4.269 0.234C4.58 -0.078 5.094 -0.078 5.405 0.234L7.696 2.524Z" fill="#A5A3AC"/>
                    <path d="M12.942 2.524H8.294L10.584 0.234C10.896 -0.078 11.41 -0.078 11.721 0.234L12.917 1.429C13.22 1.733 13.228 2.213 12.942 2.524Z" fill="#A5A3AC"/>
                    <path d="M9.658 7.574C10.121 7.574 10.5 7.953 10.5 8.416V11.052C10.5 11.726 9.751 12.13 9.195 11.751L8.437 11.246C8.159 11.06 7.797 11.06 7.511 11.246L6.719 11.768C6.163 12.138 5.422 11.734 5.422 11.069V8.416C5.422 7.953 5.801 7.574 6.264 7.574H9.658Z" fill="#A5A3AC"/>
                  </g>
                </svg>
              </div>
              <div className={styles.positionRowText}>
                <span className={styles.positionSectionLabel}>{rewardsLabel}</span>
                <span className={styles.positionSectionValue}>{fmtRewardGra(rewardsValue)} GRA</span>
              </div>
            </div>
            {!stake.autoCompound && (
              <div className={styles.positionRowAction}>
                <button
                  className={styles.positionHarvestBtn}
                  onClick={() => onHarvest(stake.id, accValue)}
                  disabled={accValue.toFixed(6) === "0.000000"}
                  aria-label="Harvest"
                >
                  <span className={styles.positionUnstakeBtnInner}>
                    <span className={styles.positionHarvestBtnText}>Harvest</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className={styles.positionDivider2} />

          <div className={`${styles.positionRow} ${styles.positionRowLast}`}>
            <div className={styles.positionRowLeft}>
              <div className={styles.positionIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                  <path d="M12 4C7.592 4 4 7.592 4 12C4 16.408 7.592 20 12 20C16.408 20 20 16.408 20 12C20 7.592 16.408 4 12 4ZM15.48 14.856C15.368 15.048 15.168 15.152 14.96 15.152C14.856 15.152 14.752 15.128 14.656 15.064L12.176 13.584C11.56 13.216 11.104 12.408 11.104 11.696V8.416C11.104 8.088 11.376 7.816 11.704 7.816C12.032 7.816 12.304 8.088 12.304 8.416V11.696C12.304 11.984 12.544 12.408 12.792 12.552L15.272 14.032C15.56 14.2 15.656 14.568 15.48 14.856Z" fill="#A5A3AC"/>
                </svg>
              </div>
              <div className={styles.positionRowText}>
                <span className={`${styles.positionSectionLabel} ${isUnlocked ? styles.positionUnlockedLabel : ""}`}>
                  {isUnlocked ? "Unlocked" : "Unlock in"}
                </span>
                <span className={styles.positionSectionValue}>
                  {unlockValueMatch ? (
                    <>
                      {unlockValueMatch[1]}
                      <span className={styles.positionDateMuted}>{unlockValueMatch[2]}</span>
                    </>
                  ) : (
                    unlockValue
                  )}
                </span>
              </div>
            </div>
            <div className={styles.positionRowAction}>
              <button
                className={`${styles.positionUnstakeBtn} ${isUnlocked ? styles.positionUnstakeBtnActive : styles.positionUnstakeBtnLocked}`}
                onClick={() => { if (isUnlocked) onUnstake(stake.id); }}
                disabled={!isUnlocked}
                aria-label="Unstake"
              >
                <span className={styles.positionUnstakeBtnInner}>
                  <span className={styles.positionUnstakeBtnText}>Unstake</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveStakesView({ stakes, now, onUnstake, onToggleAutoCompound, onHarvest, onShowToast }: {
  stakes: StakeRecord[];
  now: Date;
  onUnstake: (id: number) => void;
  onToggleAutoCompound: (id: number, enabled: boolean, rewardsAmount?: number) => void;
  onHarvest: (id: number, amount: number) => void;
  onShowToast: (msg: string) => void;
}) {
  return (
    <div className={styles.positionsView}>
      <div className={styles.positionsListWrap}>
        <div className={styles.positionsList}>
          {stakes.map((stake) => (
            <PositionCard
              key={stake.id}
              stake={stake}
              now={now}
              onUnstake={onUnstake}
              onToggleAutoCompound={onToggleAutoCompound}
              onHarvest={onHarvest}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function UnstakeForm({ stakes, now, onStartStaking, onUnstake, onToggleAutoCompound, onHarvest, onShowToast }: {
  stakes: StakeRecord[];
  now: Date;
  onStartStaking: () => void;
  onUnstake: (id: number) => void;
  onToggleAutoCompound: (id: number, enabled: boolean, rewardsAmount?: number) => void;
  onHarvest: (id: number, amount: number) => void;
  onShowToast: (msg: string) => void;
}) {
  if (stakes.length === 0) {
    return <EmptyUnstakeView onStartStaking={onStartStaking} />;
  }
  return <ActiveStakesView stakes={stakes} now={now} onUnstake={onUnstake} onToggleAutoCompound={onToggleAutoCompound} onHarvest={onHarvest} onShowToast={onShowToast} />;
}

// ---------------------------------------------------------------------------
// Time Simulator
// ---------------------------------------------------------------------------

function TimeSimulator({ simDate, onSimDateChange, mode, expanded, onExpandedChange }: {
  simDate: Date | null;
  onSimDateChange: (d: Date | null) => void;
  mode: "stake" | "unstake";
  expanded: boolean;
  onExpandedChange: (next: boolean) => void;
}) {
  const base = simDate ?? new Date();

  function skip(months: number) {
    const next = new Date(base);
    next.setMonth(next.getMonth() + months);
    onSimDateChange(next);
  }

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const d = simDate ?? new Date();
  const dateStr = `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  return (
    <div
      className={`${styles.timeSim} ${expanded ? styles.timeSimExpanded : styles.timeSimCollapsed}`}
      onClick={() => onExpandedChange(!expanded)}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpandedChange(!expanded);
        }
      }}
    >
      <div className={styles.timeSimHeaderRow}>
        {expanded ? <span className={styles.timeSimTitle}>Time machine</span> : null}
        <span className={styles.timeSimHeaderIcons}>
          {!expanded ? (
            <img
              src="/staking/time-machine.svg"
              alt=""
              aria-hidden="true"
              className={styles.timeSimMachineIcon}
            />
          ) : null}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${styles.timeSimArrow} ${expanded ? styles.timeSimArrowExpanded : ""}`}
            aria-hidden="true"
          >
            <path d="M17.92 8.18H12.31H6.08c-1.3 0-1.96 1.57-1.04 2.49l5.08 5.08c.83.83 2.19.83 3.02 0l1.99-1.99 3.09-3.09c.91-.92.25-2.49-1.05-2.49Z" fill="#A5A3AC"/>
          </svg>
        </span>
      </div>

      {expanded ? (
        <div className={styles.timeSimContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.timeSimDateBlock}>
            <div className={styles.timeSimDivider} />
            <div className={styles.timeSimDateRow}>
              <div className={styles.timeSimDateRowInner}>
                <span className={styles.timeSimDateLabel}>Simulated date</span>
                <span className={styles.timeSimDateValue}>{dateStr}</span>
              </div>
            </div>
            <div className={styles.timeSimDivider} />
          </div>

          <div className={styles.timeSimSkipGrid}>
            {([3, 6, 9, 12] as const).map((mo) => (
              <button
                key={mo}
                className={`${styles.continueButton} ${styles.continueButtonSecondary} ${styles.timeSimActionButton}`}
                onClick={() => skip(mo)}
              >
                <span className={styles.continueButtonInner}>
                  <span className={`${styles.continueButtonText} ${styles.timeSimButtonText}`}>+{mo} m</span>
                </span>
              </button>
            ))}
          </div>

          <button
            className={`${styles.continueButton} ${styles.continueButtonSecondary} ${styles.timeSimResetButton}`}
            onClick={() => onSimDateChange(null)}
          >
            <span className={styles.continueButtonInner} style={{ gap: 4 }}>
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.timeSimResetIcon}
                style={{ display: "block", flexShrink: 0, position: "relative", zIndex: 1 }}
                aria-hidden="true"
              >
                <path d="M11.3656 12.4744C10.4304 13.18 9.26 13.6 8 13.6C4.9088 13.6 3.0216 10.4864 3.0216 10.4864M3.0216 10.4864H5.5528M3.0216 10.4864V13.2864M13.6 8C13.6 9.0192 13.3256 9.9768 12.8496 10.8M4.6568 3.5032C5.5864 2.8088 6.74 2.4 8 2.4C11.7352 2.4 13.6 5.5136 13.6 5.5136M13.6 5.5136V2.7136M13.6 5.5136H11.1136M2.4 8C2.4 6.9808 2.6688 6.0232 3.1448 5.2" stroke="#A5A3AC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={`${styles.continueButtonText} ${styles.timeSimButtonText}`}>Reset to real-time</span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Harvest modals
// ---------------------------------------------------------------------------

function HarvestModal({ open, stake, now, priorityFee, onClose, onConfirm }: {
  open: boolean;
  stake: StakeRecord | null;
  now: Date;
  priorityFee: "low" | "medium" | "high";
  onClose: () => void;
  onConfirm: (id: number) => void;
}) {
  const [phase, setPhase] = useState<"confirm" | "loading" | "success">("confirm");
  const [dots, setDots] = useState(0);
  const [successAmount, setSuccessAmount] = useState(0);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase("confirm");
      setSuccessAmount(0);
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      if (successTimer.current) clearTimeout(successTimer.current);
    }
  }, [open]);

  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!open || phase === "loading") return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, phase, onClose]);

  useEffect(() => () => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    if (successTimer.current) clearTimeout(successTimer.current);
  }, []);

  const harvestAmount = stake && !stake.autoCompound ? computeAccumulatedValue(stake, now) : 0;

  function handleConfirmClick() {
    if (!stake) return;
    setSuccessAmount(harvestAmount);
    setPhase("loading");
    loadingTimer.current = setTimeout(() => {
      onConfirm(stake.id);
      setPhase("success");
    }, 3500);
  }

  return (
    <>
      <div
        className={`${styles.wmBackdrop} ${open ? styles.wmBackdropOpen : ""}`}
        onClick={phase !== "loading" ? onClose : undefined}
        aria-hidden="true"
      />
      <div className={`${styles.umPanel} ${open ? styles.umPanelOpen : ""}`} role="dialog" aria-modal="true" aria-label="Harvest rewards">
        <div className={styles.umPanelInset} aria-hidden="true" />

        {phase === "confirm" && stake && (
          <div key="confirm" className={styles.umScreen}>
            <div className={styles.wmHeader}>
              <span className={styles.wmTitle}>Harvest rewards</span>
              <button className={styles.wmCloseBtn} onClick={onClose} aria-label="Close">
                <span className={styles.wmEscHint}>ESC</span>
                {UM_CLOSE_SVG}
              </button>
            </div>
            <div className={styles.umContent}>
              <div className={styles.umReceiveSection}>
                <span className={styles.umSubLabel}>You will receive</span>
                <span className={styles.umAmount}>{fmtRewardGra(harvestAmount)} GRA</span>
              </div>
              <div className={styles.umDivider} />
              <div className={styles.umRow}>
                <span className={styles.umRowLabel}>Network</span>
                <span className={styles.umRowValue}>Solana</span>
              </div>
              <div className={styles.umDivider} />
              <div className={styles.umRow}>
                <span className={styles.umRowLabel}>Network fee</span>
                <span className={styles.umRowValue}>{PRIORITY_FEE_LABELS[priorityFee]}</span>
              </div>
              <div className={styles.umDivider} />
              <button className={styles.continueButton} onClick={handleConfirmClick}>
                <span className={styles.continueButtonInner}>
                  <span className={styles.continueButtonText}>Harvest</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div key="loading" className={styles.umScreen}>
            <div className={styles.umCenteredContent}>
              <Lottie animationData={loaderAnimationAccent} loop={true} style={{ width: 88, height: 88 }} />
              <div className={styles.umTextBlock}>
                <p className={styles.s3Title}>Harvesting{".".repeat(dots)}</p>
                <p className={styles.umSubtitle}>Submitting transaction to Solana network.</p>
              </div>
            </div>
          </div>
        )}

        {phase === "success" && (
          <div key="success" className={styles.umScreen}>
            <button className={`${styles.wmCloseBtn} ${styles.umSuccessCloseBtn}`} onClick={onClose} aria-label="Close">
              <span className={styles.wmEscHint}>ESC</span>
              {UM_CLOSE_SVG}
            </button>
            <div className={styles.umCenteredContent}>
              <SuccessStateIcon />
              <div className={styles.umTextBlock}>
                <p className={styles.s3Title}>Harvest successful!</p>
                <p className={styles.umSubtitle}>{fmtRewardGra(successAmount)} GRA has been added to your wallet.</p>
                <a
                  href="https://solscan.io/account/9C91mKpL3QnBtWsJvCXgT4rR8uHwXiQoMaSpVt35Ya1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.s3ExplorerLink}
                >
                  View in explorer
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function HarvestAllModal({ open, stakes, now, priorityFee, onClose, onConfirm }: {
  open: boolean;
  stakes: StakeRecord[];
  now: Date;
  priorityFee: "low" | "medium" | "high";
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [phase, setPhase] = useState<"confirm" | "progress">("confirm");
  const [activeTxIndex, setActiveTxIndex] = useState(0);
  const [activeTxStage, setActiveTxStage] = useState<"wallet" | "submitting">("wallet");
  const [progressComplete, setProgressComplete] = useState(false);
  const [batchHarvestEntries, setBatchHarvestEntries] = useState<Array<{ stake: StakeRecord; amount: number }>>([]);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConfirmRef = useRef(onConfirm);

  const harvestable = stakes
    .filter((s) => !s.autoCompound)
    .map((s) => ({ stake: s, amount: computeAccumulatedValue(s, now) }))
    .filter((entry) => entry.amount > 0);
  const totalHarvest = batchHarvestEntries.reduce((sum, entry) => sum + entry.amount, 0);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    if (!open) {
      setPhase("confirm");
      setActiveTxIndex(0);
      setActiveTxStage("wallet");
      setProgressComplete(false);
      setBatchHarvestEntries([]);
      if (progressTimer.current) clearTimeout(progressTimer.current);
    }
  }, [open]);

  useEffect(() => {
    if (open && phase === "confirm" && batchHarvestEntries.length === 0) {
      setBatchHarvestEntries(harvestable);
    }
  }, [open, phase, batchHarvestEntries.length, harvestable]);

  useEffect(() => {
    if (!open || (phase === "progress" && !progressComplete)) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, phase, progressComplete, onClose]);

  useEffect(() => () => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
  }, []);

  useEffect(() => {
    if (!open || phase !== "progress" || progressComplete) return;

    if (batchHarvestEntries.length === 0) {
      onConfirmRef.current();
      setProgressComplete(true);
      return;
    }

    progressTimer.current = setTimeout(() => {
      if (activeTxStage === "wallet") {
        setActiveTxStage("submitting");
        return;
      }

      if (activeTxIndex >= batchHarvestEntries.length - 1) {
        onConfirmRef.current();
        setActiveTxIndex(batchHarvestEntries.length);
        setProgressComplete(true);
        return;
      }

      setActiveTxIndex((i) => i + 1);
      setActiveTxStage("wallet");
    }, 2250);

    return () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
    };
  }, [open, phase, progressComplete, activeTxIndex, activeTxStage, batchHarvestEntries.length]);

  function handleConfirmClick() {
    setActiveTxIndex(0);
    setActiveTxStage("wallet");
    setPhase("progress");
  }

  function lockPeriodShort(lp: string): string {
    const m = lp.match(/(\d+)/);
    return m ? `${m[1]}mo lock` : lp;
  }

  const completedTransactions =
    phase === "progress"
      ? (progressComplete ? batchHarvestEntries.length : activeTxIndex)
      : 0;

  return (
    <>
      <div
        className={`${styles.wmBackdrop} ${open ? styles.wmBackdropOpen : ""}`}
        onClick={phase === "confirm" || progressComplete ? onClose : undefined}
        aria-hidden="true"
      />
      <div className={`${styles.umPanel} ${open ? styles.umPanelOpen : ""}`} style={{ height: "auto", maxHeight: "80vh" }} role="dialog" aria-modal="true" aria-label="Harvest all rewards">
        <div className={styles.umPanelInset} aria-hidden="true" />

        {phase === "confirm" && (
          <div key="confirm" className={styles.umScreen} style={{ display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
            <div className={styles.wmHeader}>
              <span className={styles.wmTitle}>Harvest all</span>
              <button className={styles.wmCloseBtn} onClick={onClose} aria-label="Close">
                <span className={styles.wmEscHint}>ESC</span>
                {UM_CLOSE_SVG}
              </button>
            </div>
            <div className={styles.umContent} style={{ flex: 1, minHeight: 0 }}>
              <div className={styles.umReceiveSection}>
                <span className={styles.umSubLabel}>You will receive</span>
                <span className={styles.umAmount}>{fmtRewardGra(totalHarvest)} GRA</span>
              </div>
              <div className={styles.umStakesList}>
                {harvestable.map(({ stake, amount }) => (
                  <div key={stake.id}>
                    <div className={styles.umDivider} />
                    <div className={styles.umRow} style={{ marginTop: 16 }}>
                      <span className={styles.umRowLabel}>{lockPeriodShort(stake.lockPeriod)} · {formatMonthDayYear(stake.unlockDate)}</span>
                      <span className={styles.umRowValue}>{fmtRewardGra(amount)} GRA</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.umDivider} />
              <div className={styles.umRow}>
                <span className={styles.umRowLabel}>Network</span>
                <span className={styles.umRowValue}>Solana</span>
              </div>
              <div className={styles.umDivider} />
              <div className={styles.umRow}>
                <span className={styles.umRowLabel}>Network fee</span>
                <span className={styles.umRowValue}>{formatBatchPriorityFee(priorityFee, harvestable.length)}</span>
              </div>
              <div className={styles.umDivider} />
              <button className={styles.continueButton} style={{ marginTop: 8, flexShrink: 0 }} onClick={handleConfirmClick}>
                <span className={styles.continueButtonInner}>
                  <span className={styles.continueButtonText}>Harvest all</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {phase === "progress" && (
          <div key="progress" className={styles.umScreen}>
            <div className={styles.umBatchProgressScreen}>
              <div className={styles.umBatchProgressTextBlock}>
                <p className={styles.s3Title}>
                  {progressComplete ? "Harvest complete" : <>Harvesting<AnimatedDots /></>}
                </p>
                <p className={styles.umSubtitle}>Completed {completedTransactions} of {batchHarvestEntries.length} transactions.</p>
              </div>

              <div className={styles.umBatchProgressBlock}>
                <div className={styles.umBatchProgressInner}>
                  {batchHarvestEntries.map(({ stake, amount }, index) => {
                    let status: "success" | "wallet" | "submitting" | "waiting" = "waiting";
                    if (progressComplete || index < activeTxIndex) status = "success";
                    else if (index === activeTxIndex) status = activeTxStage;

                    const statusLabel =
                      status === "success" ? "Success" :
                      status === "wallet" ? "Confirm in wallet" :
                      status === "submitting" ? "Submitting" :
                      "Waiting";

                    return (
                      <div key={stake.id} className={styles.umBatchStep}>
                        <div className={styles.umBatchStepRail} aria-hidden="true">
                          <span
                            className={`${styles.umBatchStatusIcon} ${
                              status === "success"
                                ? styles.umBatchStatusIconSuccess
                                : status === "wallet" || status === "submitting"
                                  ? styles.umBatchStatusIconActive
                                  : styles.umBatchStatusIconWaiting
                            }`}
                          >
                            <BatchStepSuccessIcon />
                          </span>
                          {index < batchHarvestEntries.length - 1 && (
                            <span
                              className={`${styles.umBatchStepConnector} ${
                                progressComplete || index < activeTxIndex ? styles.umBatchStepConnectorDone : styles.umBatchStepConnectorWaiting
                              }`}
                            />
                          )}
                        </div>

                        <div className={styles.umBatchStepContent}>
                          <div className={styles.umBatchStepHeader}>
                            <span className={styles.umBatchStepMeta}>{lockPeriodShort(stake.lockPeriod)} · {formatMonthDayYear(stake.unlockDate)}</span>
                            <span
                              className={`${styles.umBatchStepStatus} ${
                                status === "success"
                                  ? styles.umBatchStepStatusSuccess
                                  : status === "waiting"
                                    ? styles.umBatchStepStatusWaiting
                                    : styles.umBatchStepStatusActive
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <span className={styles.umBatchStepAmount}>{fmtRewardGra(amount)} GRA</span>
                          {index < batchHarvestEntries.length - 1 && <div className={styles.umBatchStepDivider} aria-hidden="true" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {progressComplete && (
                <button className={`${styles.continueButton} ${styles.continueButtonSecondary} ${styles.umBatchStakeMoreBtn}`} onClick={onClose}>
                  <span className={styles.continueButtonInner}>
                    <span className={styles.continueButtonText}>Done</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Wallet modal
// ---------------------------------------------------------------------------

const WALLET_ADDRESS         = "9C91mKpL3QnBtWsJvCXgT4rR8uHwXiQoMaSpVt35Ya1";
const WALLET_ADDRESS_DISPLAY = "9C91mK...t35Ya1";

// ---------------------------------------------------------------------------
// Unstake modal
// ---------------------------------------------------------------------------

const PRIORITY_FEE_LABELS: Record<"low" | "medium" | "high", string> = {
  low:    "~0.000005 SOL",
  medium: "~0.00005 SOL",
  high:   "~0.0005 SOL",
};

const PRIORITY_FEE_VALUES: Record<"low" | "medium" | "high", number> = {
  low: 0.000005,
  medium: 0.00005,
  high: 0.0005,
};

function formatBatchPriorityFee(priorityFee: "low" | "medium" | "high", txCount: number): string {
  const total = PRIORITY_FEE_VALUES[priorityFee] * txCount;
  const decimals = priorityFee === "high" ? 4 : priorityFee === "medium" ? 5 : 6;
  return `~${total.toFixed(decimals)} SOL`;
}

const PRELOAD_MODAL_ASSETS = [
  ASSETS.infoIcon,
  ASSETS.phantomBase,
  ASSETS.phantomVector,
  ASSETS.toastIconVector,
  ASSETS.s4EllipseIcon,
  ASSETS.s4CheckIcon,
];

const UM_CLOSE_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
    <path d="M12.696 11.2117C13.1013 11.6168 13.1013 12.2875 12.696 12.6926C12.4864 12.9022 12.2208 13 11.9553 13C11.6897 13 11.4242 12.9022 11.2145 12.6926L8 9.47922L4.78546 12.6926C4.57582 12.9022 4.31027 13 4.04472 13C3.77918 13 3.51363 12.9022 3.30398 12.6926C2.89867 12.2875 2.89867 11.6168 3.30398 11.2117L6.51852 7.99825L3.30398 4.78484C2.89867 4.37967 2.89867 3.70905 3.30398 3.30388C3.70929 2.89871 4.38015 2.89871 4.78546 3.30388L8 6.51729L11.2145 3.30388C11.6198 2.89871 12.2907 2.89871 12.696 3.30388C13.1013 3.70905 13.1013 4.37967 12.696 4.78484L9.48148 7.99825L12.696 11.2117Z" fill="currentColor"/>
  </svg>
);

function UnstakeModal({ open, stake, now, priorityFee, onClose, onConfirm }: {
  open: boolean;
  stake: StakeRecord | null;
  now: Date;
  priorityFee: "low" | "medium" | "high";
  onClose: () => void;
  onConfirm: (id: number) => void;
}) {
  const [phase, setPhase] = useState<"confirm" | "loading" | "success">("confirm");
  const [dots, setDots] = useState(0);
  const [successTotalReceive, setSuccessTotalReceive] = useState(0);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset phase and clear timers when modal closes
  useEffect(() => {
    if (!open) {
      setPhase("confirm");
      setSuccessTotalReceive(0);
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      if (successTimer.current) clearTimeout(successTimer.current);
    }
  }, [open]);

  // Animated dots during loading
  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, [phase]);

  // ESC — disabled during loading to prevent interruption
  useEffect(() => {
    if (!open || phase === "loading") return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, phase, onClose]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    if (successTimer.current) clearTimeout(successTimer.current);
  }, []);

  const rewards = stake ? computeAccumulatedValue(stake, now) : 0;
  const showRewards = stake ? (!stake.autoCompound && rewards.toFixed(6) !== "0.000000") : false;
  const totalReceive = stake ? (stake.amount + (showRewards ? rewards : 0)) : 0;
  const buttonLabel = showRewards ? "Unstake & Claim" : "Unstake";

  function handleConfirmClick() {
    if (!stake) return;
    setSuccessTotalReceive(totalReceive);
    setPhase("loading");
    loadingTimer.current = setTimeout(() => {
      onConfirm(stake.id);
      setPhase("success");
    }, 3500);
  }

  return (
    <>
      <div
        className={`${styles.wmBackdrop} ${open ? styles.wmBackdropOpen : ""}`}
        onClick={phase !== "loading" ? onClose : undefined}
        aria-hidden="true"
      />
      <div className={`${styles.umPanel} ${open ? styles.umPanelOpen : ""}`} role="dialog" aria-modal="true" aria-label="Unstake">
        <div className={styles.umPanelInset} aria-hidden="true" />

        {/* ── Confirm screen ── */}
        {phase === "confirm" && stake && (
          <div key="confirm" className={styles.umScreen}>
            <div className={styles.wmHeader}>
              <span className={styles.wmTitle}>Unstake</span>
              <button className={styles.wmCloseBtn} onClick={onClose} aria-label="Close">
                <span className={styles.wmEscHint}>ESC</span>
                {UM_CLOSE_SVG}
              </button>
            </div>
            <div className={styles.umContent}>
              <div className={styles.umReceiveSection}>
                <span className={styles.umSubLabel}>You will receive</span>
                <span className={styles.umAmount}>{totalReceive.toFixed(2)} GRA</span>
              </div>
              <div className={styles.umDivider} />
              <div className={styles.umRow}>
                <span className={styles.umRowLabel}>Network</span>
                <span className={styles.umRowValue}>Solana</span>
              </div>
              <div className={styles.umDivider} />
              <div className={styles.umRow}>
                <span className={styles.umRowLabel}>Network fee</span>
                <span className={styles.umRowValue}>{PRIORITY_FEE_LABELS[priorityFee]}</span>
              </div>
              <div className={styles.umDivider} />
              {showRewards && (
                <div className={styles.umInfoBlock}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block", flexShrink: 0, position: "relative", zIndex: 1 }}>
                    <path d="M13.3333 8V12C13.3333 13.4733 12.14 14.6667 10.6667 14.6667H5.33333C3.86 14.6667 2.66667 13.4733 2.66667 12V8C2.66667 7.63333 2.96667 7.33333 3.33333 7.33333H4.64667C5.01333 7.33333 5.31333 7.63333 5.31333 8V10.0933C5.31333 10.5867 5.58667 11.04 6.02 11.2733C6.21333 11.38 6.42667 11.4333 6.64667 11.4333C6.9 11.4333 7.15333 11.36 7.37333 11.2133L8.00667 10.8L8.59333 11.1933C9 11.4667 9.52 11.5 9.95333 11.2667C10.3933 11.0333 10.6667 10.5867 10.6667 10.0867V8C10.6667 7.63333 10.9667 7.33333 11.3333 7.33333H12.6667C13.0333 7.33333 13.3333 7.63333 13.3333 8Z" fill="#AB9FF2"/>
                    <path d="M14.3333 4.66667V5.33333C14.3333 6.06667 13.98 6.66667 13 6.66667H3C1.98 6.66667 1.66667 6.06667 1.66667 5.33333V4.66667C1.66667 3.93333 1.98 3.33333 3 3.33333H13C13.98 3.33333 14.3333 3.93333 14.3333 4.66667Z" fill="#AB9FF2"/>
                    <path d="M7.76 3.33333H4.08C3.85333 3.08667 3.86 2.70667 4.1 2.46667L5.04667 1.52C5.29333 1.27333 5.7 1.27333 5.94667 1.52L7.76 3.33333Z" fill="#AB9FF2"/>
                    <path d="M11.9133 3.33333H8.23333L10.0467 1.52C10.2933 1.27333 10.7 1.27333 10.9467 1.52L11.8933 2.46667C12.1333 2.70667 12.14 3.08667 11.9133 3.33333Z" fill="#AB9FF2"/>
                    <path d="M9.31333 7.33333C9.68 7.33333 9.98 7.63333 9.98 8V10.0867C9.98 10.62 9.38667 10.94 8.94667 10.64L8.34667 10.24C8.12667 10.0933 7.84 10.0933 7.61333 10.24L6.98667 10.6533C6.54667 10.9467 5.96 10.6267 5.96 10.1V8C5.96 7.63333 6.26 7.33333 6.62667 7.33333H9.31333Z" fill="#AB9FF2"/>
                  </svg>
                  <span className={styles.umInfoText}>
                    Unclaimed rewards: {rewards.toFixed(6)} GRA. They will be added to your wallet when you unstake.
                  </span>
                </div>
              )}
              <button className={styles.continueButton} onClick={handleConfirmClick}>
                <span className={styles.continueButtonInner}>
                  <span className={styles.continueButtonText}>{buttonLabel}</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── Loading screen ── */}
        {phase === "loading" && (
          <div key="loading" className={styles.umScreen}>
            <div className={styles.umCenteredContent}>
              <Lottie animationData={loaderAnimationAccent} loop={true} style={{ width: 88, height: 88 }} />
              <div className={styles.umTextBlock}>
                <p className={styles.s3Title}>Unstaking{".".repeat(dots)}</p>
                <p className={styles.umSubtitle}>Submitting transaction to Solana network.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Success screen ── */}
        {phase === "success" && (
          <div key="success" className={styles.umScreen}>
            <button className={`${styles.wmCloseBtn} ${styles.umSuccessCloseBtn}`} onClick={onClose} aria-label="Close">
              <span className={styles.wmEscHint}>ESC</span>
              {UM_CLOSE_SVG}
            </button>
            <div className={styles.umCenteredContent}>
              <SuccessStateIcon />
              <div className={styles.umTextBlock}>
                <p className={styles.s3Title}>Unstake successful!</p>
                <p className={styles.umSubtitle}>{successTotalReceive.toFixed(2)} GRA has been returned to your wallet.</p>
                <a
                  href="https://solscan.io/account/9C91mKpL3QnBtWsJvCXgT4rR8uHwXiQoMaSpVt35Ya1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.s3ExplorerLink}
                >
                  View in explorer
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Unstake batch modal (Portfolio → Unstake available)
// ---------------------------------------------------------------------------

function formatMonthDayYear(isoDate: string): string {
  const d = new Date(isoDate);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2, "0")}, ${d.getFullYear()}`;
}

function UnstakeBatchModal({ open, stakes, now, priorityFee, onClose, onConfirm, onStakeMore }: {
  open: boolean;
  stakes: StakeRecord[];
  now: Date;
  priorityFee: "low" | "medium" | "high";
  onClose: () => void;
  onConfirm: () => void;
  onStakeMore: () => void;
}) {
  const [phase, setPhase] = useState<"confirm" | "progress">("confirm");
  const [successTotalReceive, setSuccessTotalReceive] = useState(0);
  const [activeTxIndex, setActiveTxIndex] = useState(0);
  const [activeTxStage, setActiveTxStage] = useState<"wallet" | "submitting">("wallet");
  const [progressComplete, setProgressComplete] = useState(false);
  const [batchStakes, setBatchStakes] = useState<StakeRecord[]>([]);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConfirmRef = useRef(onConfirm);

  const unlocked = stakes.filter((s) => new Date(s.unlockDate) <= now);
  const renderedBatchStakes = batchStakes.length > 0 ? batchStakes : unlocked;
  const totalAmount = renderedBatchStakes.reduce((sum, s) => sum + s.amount, 0);
  const totalRewards = renderedBatchStakes
    .filter((s) => !s.autoCompound)
    .reduce((sum, s) => sum + computeAccumulatedValue(s, now), 0);
  const showRewardsInfo = totalRewards.toFixed(6) !== "0.000000";
  const totalReceive = totalAmount + totalRewards;

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    if (!open) {
      setPhase("confirm");
      setSuccessTotalReceive(0);
      setActiveTxIndex(0);
      setActiveTxStage("wallet");
      setProgressComplete(false);
      setBatchStakes([]);
      if (progressTimer.current) clearTimeout(progressTimer.current);
    }
  }, [open]);

  useEffect(() => {
    if (open && phase === "confirm" && batchStakes.length === 0) {
      setBatchStakes(unlocked);
    }
  }, [open, phase, batchStakes.length, unlocked]);

  useEffect(() => {
    if (!open || (phase === "progress" && !progressComplete)) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, phase, progressComplete, onClose]);

  useEffect(() => () => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
  }, []);

  useEffect(() => {
    if (!open || phase !== "progress" || progressComplete) return;

    if (batchStakes.length === 0) {
      onConfirmRef.current();
      setProgressComplete(true);
      return;
    }

    progressTimer.current = setTimeout(() => {
      if (activeTxStage === "wallet") {
        setActiveTxStage("submitting");
        return;
      }

      if (activeTxIndex >= batchStakes.length - 1) {
        onConfirmRef.current();
        setActiveTxIndex(batchStakes.length);
        setProgressComplete(true);
        return;
      }

      setActiveTxIndex((i) => i + 1);
      setActiveTxStage("wallet");
    }, 2250);

    return () => {
      if (progressTimer.current) clearTimeout(progressTimer.current);
    };
  }, [open, phase, progressComplete, activeTxIndex, activeTxStage, batchStakes.length]);

  function handleConfirmClick() {
    setSuccessTotalReceive(totalReceive);
    setActiveTxIndex(0);
    setActiveTxStage("wallet");
    setPhase("progress");
  }

  function lockPeriodShort(lp: string): string {
    const m = lp.match(/(\d+)/);
    return m ? `${m[1]}mo lock` : lp;
  }

  const completedTransactions =
    phase === "progress"
      ? (progressComplete ? renderedBatchStakes.length : activeTxIndex)
      : 0;

  return (
    <>
      <div
        className={`${styles.wmBackdrop} ${open ? styles.wmBackdropOpen : ""}`}
        onClick={phase === "confirm" || progressComplete ? onClose : undefined}
        aria-hidden="true"
      />
      <div className={`${styles.umPanel} ${open ? styles.umPanelOpen : ""}`} style={{ height: "auto", maxHeight: "80vh" }} role="dialog" aria-modal="true" aria-label="Unstake available">
        <div className={styles.umPanelInset} aria-hidden="true" />

        {phase === "confirm" && (
          <div key="confirm" className={styles.umScreen} style={{ display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
            <div className={styles.wmHeader}>
              <span className={styles.wmTitle}>Unstake available</span>
              <button className={styles.wmCloseBtn} onClick={onClose} aria-label="Close">
                <span className={styles.wmEscHint}>ESC</span>
                {UM_CLOSE_SVG}
              </button>
            </div>
            <div className={styles.umContent} style={{ flex: 1, minHeight: 0 }}>
              <div className={styles.umReceiveSection}>
                <span className={styles.umSubLabel}>You will receive</span>
                <span className={styles.umAmount}>{fmtGra(totalReceive)} GRA</span>
              </div>
              {/* Scrollable stakes list */}
                <div className={styles.umStakesList}>
                {renderedBatchStakes.map((stake) => (
                  <div key={stake.id}>
                    <div className={styles.umDivider} />
                    <div className={styles.umRow} style={{ marginTop: 16 }}>
                      <span className={styles.umRowLabel}>{lockPeriodShort(stake.lockPeriod)} · {formatMonthDayYear(stake.unlockDate)}</span>
                      <span className={styles.umRowValue}>{fmtGra(stake.amount)} GRA</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.umDivider} />
              <div className={styles.umRow}>
                <span className={styles.umRowLabel}>Network</span>
                <span className={styles.umRowValue}>Solana</span>
              </div>
              <div className={styles.umDivider} />
              <div className={styles.umRow}>
                <span className={styles.umRowLabel}>Network fee</span>
                <span className={styles.umRowValue}>{PRIORITY_FEE_LABELS[priorityFee]}</span>
              </div>
              <div className={styles.umDivider} />
              {showRewardsInfo && (
                <div className={styles.umInfoBlock} style={{ marginTop: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block", flexShrink: 0, position: "relative", zIndex: 1 }}>
                    <path d="M13.3333 8V12C13.3333 13.4733 12.14 14.6667 10.6667 14.6667H5.33333C3.86 14.6667 2.66667 13.4733 2.66667 12V8C2.66667 7.63333 2.96667 7.33333 3.33333 7.33333H4.64667C5.01333 7.33333 5.31333 7.63333 5.31333 8V10.0933C5.31333 10.5867 5.58667 11.04 6.02 11.2733C6.21333 11.38 6.42667 11.4333 6.64667 11.4333C6.9 11.4333 7.15333 11.36 7.37333 11.2133L8.00667 10.8L8.59333 11.1933C9 11.4667 9.52 11.5 9.95333 11.2667C10.3933 11.0333 10.6667 10.5867 10.6667 10.0867V8C10.6667 7.63333 10.9667 7.33333 11.3333 7.33333H12.6667C13.0333 7.33333 13.3333 7.63333 13.3333 8Z" fill="#AB9FF2"/>
                    <path d="M14.3333 4.66667V5.33333C14.3333 6.06667 13.98 6.66667 13 6.66667H3C1.98 6.66667 1.66667 6.06667 1.66667 5.33333V4.66667C1.66667 3.93333 1.98 3.33333 3 3.33333H13C13.98 3.33333 14.3333 3.93333 14.3333 4.66667Z" fill="#AB9FF2"/>
                    <path d="M7.76 3.33333H4.08C3.85333 3.08667 3.86 2.70667 4.1 2.46667L5.04667 1.52C5.29333 1.27333 5.7 1.27333 5.94667 1.52L7.76 3.33333Z" fill="#AB9FF2"/>
                    <path d="M11.9133 3.33333H8.23333L10.0467 1.52C10.2933 1.27333 10.7 1.27333 10.9467 1.52L11.8933 2.46667C12.1333 2.70667 12.14 3.08667 11.9133 3.33333Z" fill="#AB9FF2"/>
                    <path d="M9.31333 7.33333C9.68 7.33333 9.98 7.63333 9.98 8V10.0867C9.98 10.62 9.38667 10.94 8.94667 10.64L8.34667 10.24C8.12667 10.0933 7.84 10.0933 7.61333 10.24L6.98667 10.6533C6.54667 10.9467 5.96 10.6267 5.96 10.1V8C5.96 7.63333 6.26 7.33333 6.62667 7.33333H9.31333Z" fill="#AB9FF2"/>
                  </svg>
                  <span className={styles.umInfoText}>
                    Unclaimed rewards: {totalRewards.toFixed(2)} GRA. They will be added to your wallet when you unstake.
                  </span>
                </div>
              )}
              <button className={styles.continueButton} style={{ marginTop: 8, flexShrink: 0 }} onClick={handleConfirmClick}>
                <span className={styles.continueButtonInner}>
                  <span className={styles.continueButtonText}>Unstake</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {phase === "progress" && (
          <div key="progress" className={styles.umScreen}>
            <div className={styles.umBatchProgressScreen}>
              <div className={styles.umBatchProgressTextBlock}>
                <p className={styles.s3Title}>
                  {progressComplete ? "Unstake complete" : <>Unstaking<AnimatedDots /></>}
                </p>
                <p className={styles.umSubtitle}>Completed {completedTransactions} of {renderedBatchStakes.length} transactions.</p>
              </div>

              <div className={styles.umBatchProgressBlock}>
                <div className={styles.umBatchProgressInner}>
                  {renderedBatchStakes.map((stake, index) => {
                    let status: "success" | "wallet" | "submitting" | "waiting" = "waiting";
                    if (progressComplete || index < activeTxIndex) status = "success";
                    else if (index === activeTxIndex) status = activeTxStage;

                    const statusLabel =
                      status === "success" ? "Success" :
                      status === "wallet" ? "Confirm in wallet" :
                      status === "submitting" ? "Submitting" :
                      "Waiting";

                    return (
                      <div key={stake.id} className={styles.umBatchStep}>
                        <div className={styles.umBatchStepRail} aria-hidden="true">
                          <span
                            className={`${styles.umBatchStatusIcon} ${
                              status === "success"
                                ? styles.umBatchStatusIconSuccess
                                : status === "wallet" || status === "submitting"
                                  ? styles.umBatchStatusIconActive
                                  : styles.umBatchStatusIconWaiting
                              }`}
                            >
                              <BatchStepSuccessIcon />
                          </span>
                          {index < batchStakes.length - 1 && (
                            <span
                              className={`${styles.umBatchStepConnector} ${
                                progressComplete || index < activeTxIndex ? styles.umBatchStepConnectorDone : styles.umBatchStepConnectorWaiting
                              }`}
                            />
                          )}
                        </div>

                        <div className={styles.umBatchStepContent}>
                          <div className={styles.umBatchStepHeader}>
                            <span className={styles.umBatchStepMeta}>{lockPeriodShort(stake.lockPeriod)} · {formatMonthDayYear(stake.unlockDate)}</span>
                            <span
                              className={`${styles.umBatchStepStatus} ${
                                status === "success"
                                  ? styles.umBatchStepStatusSuccess
                                  : status === "waiting"
                                    ? styles.umBatchStepStatusWaiting
                                    : styles.umBatchStepStatusActive
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <span className={styles.umBatchStepAmount}>{fmtGra(stake.amount)} GRA</span>
                          {index < renderedBatchStakes.length - 1 && <div className={styles.umBatchStepDivider} aria-hidden="true" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {progressComplete && (
                <>
                  <button className={`${styles.continueButton} ${styles.continueButtonSecondary} ${styles.umBatchStakeMoreBtn}`} onClick={onStakeMore}>
                    <span className={styles.continueButtonInner}>
                      <span className={styles.continueButtonText}>Stake more</span>
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Wallet modal
// ---------------------------------------------------------------------------

function WalletModal({ open, onClose, onCopyAddress, onDisconnect, walletBalance, priorityFee, onPriorityFeeChange }: { open: boolean; onClose: () => void; onCopyAddress: () => void; onDisconnect: () => void; walletBalance: number; priorityFee: "low" | "medium" | "high"; onPriorityFeeChange: (v: "low" | "medium" | "high") => void }) {

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.wmBackdrop} ${open ? styles.wmBackdropOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`${styles.wmPanel} ${open ? styles.wmPanelOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Wallet"
      >
        {/* Header */}
        <div className={styles.wmHeader}>
          <span className={styles.wmTitle}>Wallet</span>
          <button className={styles.wmCloseBtn} onClick={onClose} aria-label="Close">
            <span className={styles.wmEscHint}>ESC</span>
            <span className={styles.wmCloseIcon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.wmContent}>

          {/* Wallet info section */}
          <div className={styles.wmInfoSection}>
              {/* Wallet info row */}
              <div className={styles.wmInfoRow}>
              <div className={styles.wmBadge}>
                <img src={ASSETS.wmBadgeIcon} alt="" width={16} height={16} style={{ display: "block", flexShrink: 0 }} />
              </div>
              <div className={styles.wmAddrCol}>
                <span className={styles.wmAddrName}>Phantom</span>
                <span className={styles.wmAddrLine}>{WALLET_ADDRESS_DISPLAY}</span>
              </div>
              <div className={styles.wmActionsRow}>
                <button
                  className={styles.wmActionBtn}
                  aria-label="Copy address"
                  onClick={() => {
                    navigator.clipboard.writeText(WALLET_ADDRESS).catch(() => {});
                    onCopyAddress();
                  }}
                >
                  <img src={ASSETS.wmCopyIcon} alt="" width={16} height={16} style={{ display: "block", flexShrink: 0 }} />
                </button>
                <button className={styles.wmActionBtn} aria-label="View on explorer" onClick={() => window.open(`https://solscan.io/account/${WALLET_ADDRESS}`, "_blank", "noopener,noreferrer")}>
                  <img src={ASSETS.wmExplorerIcon} alt="" width={16} height={16} style={{ display: "block", flexShrink: 0 }} />
                </button>
                <button className={styles.wmActionBtn} aria-label="Disconnect" onClick={() => { onDisconnect(); onClose(); }}>
                  <img src={ASSETS.wmDisconnectIcon} alt="" width={16} height={16} style={{ display: "block", flexShrink: 0 }} />
                </button>
              </div>
            </div>

            {/* Balance — uses same WALLET_BALANCE constant as the staking form */}
            <div className={styles.wmBalance}>
              <div className={styles.wmBalanceAmt}>
                <span>{walletBalance.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                <span>{"\u00a0GRA"}</span>
              </div>
              <span className={styles.wmBalanceUsd}>≈ ${(walletBalance * 1.04).toFixed(2)}</span>
            </div>

            {/* Divider */}
            <div className={styles.wmDivider} />
          </div>

          {/* Priority fee — Low | Medium | High, same TabSwitcher as Stake/Unstake */}
          <div className={styles.wmFeeSection}>
            <div className={styles.sectionLabel} style={{ marginBottom: 0 }}>
              <span className={styles.wmSectionLabel}>Priority fee</span>
              <InfoTooltip
                width={260}
                lineHeight="20px"
                text={"Low: ~30 sec (0.000005 SOL)\nMedium: ~10 sec (0.00005 SOL)\nHigh: ~3 sec (0.0005 SOL)"}
              />
            </div>
            <div className={styles.wmFeeCtrl}>
              <TabSwitcher
                tabs={[{ id: "low", label: "Low" }, { id: "medium", label: "Medium" }, { id: "high", label: "High" }]}
                value={priorityFee}
                onChange={(v) => onPriorityFeeChange(v as "low" | "medium" | "high")}
                fillWidth
              />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Portfolio page
// ---------------------------------------------------------------------------

function PortfolioPage({ stakes, unstakedHistory, now, chartAxisNow, onUnstake, onToggleAutoCompound, onHarvest, onHarvestAll, onUnstakeAvailable, onStartStaking }: {
  stakes: StakeRecord[];
  unstakedHistory: UnstakedRecord[];
  now: Date;
  chartAxisNow: Date;
  onUnstake: (id: number) => void;
  onToggleAutoCompound: (id: number, enabled: boolean, rewardsAmount?: number) => void;
  onHarvest: (id: number, amount: number) => void;
  onHarvestAll: () => void;
  onUnstakeAvailable: () => void;
  onStartStaking: () => void;
}) {
  const [filter, setFilter] = useState<"active" | "unstaked">("active");

  // Computed stats
  const totalStaked       = stakes.reduce((sum, s) => sum + s.amount, 0);
  const weightedApyNum    = stakes.reduce((sum, s) => sum + s.amount * s.apy, 0);
  const avgApy            = totalStaked > 0 ? (weightedApyNum / totalStaked) * 100 : 0;
  const unlockedStakes    = stakes.filter((s) => new Date(s.unlockDate) <= now);
  const availableToUnstake = unlockedStakes.reduce((sum, s) => sum + s.amount, 0);

  const autoCompounded     = stakes.reduce(
    (sum, s) => sum + (s.compoundedTotal ?? 0) + (s.autoCompound ? computeAccumulatedValue(s, now) : 0),
    0
  );
  const availableToHarvest = stakes.filter((s) => !s.autoCompound).reduce((sum, s) => sum + computeAccumulatedValue(s, now), 0);
  const accumulatedRewardsChartData = buildAccumulatedRewardsChartData(stakes, now, chartAxisNow);
  const chartTimeOffsetSecs = Math.floor((now.getTime() - chartAxisNow.getTime()) / 1000);

  const countStyle = { color: "var(--color-mid-400)" };
  const filterTabs: TabItem[] = [
    { id: "active",   label: <>{"Active\u00a0"}<span style={countStyle}>({stakes.length})</span></> },
    { id: "unstaked", label: <>{"Unstaked\u00a0"}<span style={countStyle}>({unstakedHistory.length})</span></> },
  ];

  return (
    <div className={styles.portfolioContent}>

      {/* ── Stats row ── */}
      <div className={styles.portfolioStatsRow}>

        {/* Left card — Total staked */}
        <div className={`${styles.portfolioStatCard} ${styles.portfolioOverviewCard}`}>
          <div className={styles.positionCard}>
            <div className={`${styles.positionCardHeader} ${styles.portfolioOverviewHeader}`}>
              <div className={styles.positionCardHeaderMain}>
                <span className={styles.positionAmountLabel}>Total staked</span>
                <span className={styles.positionAmount}>{fmtGra(totalStaked)} GRA</span>
              </div>
              <button
                className={`${styles.positionUnstakeBtn} ${availableToUnstake > 0 ? styles.positionUnstakeBtnActive : styles.positionUnstakeBtnLocked} ${styles.portfolioOverviewTopBtn}`}
                onClick={onUnstakeAvailable}
                disabled={availableToUnstake === 0}
              >
                <span className={styles.positionUnstakeBtnInner}>
                  <span className={styles.positionUnstakeBtnText}>Unstake available</span>
                </span>
              </button>
            </div>

            <div className={`${styles.positionDetailsPanel} ${styles.portfolioOverviewDetailsPanel}`}>
              <div className={styles.positionRow}>
                <div className={styles.positionRowLeft}>
                  <div className={styles.positionIconBox}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                      <g filter="url(#filter0_i_7337_2004)">
                        <path d="M10.6347 1.59345C11.1164 1.12775 11.9704 1.45513 11.9706 2.16962V8.05927H15.0029C15.8593 8.05927 16.3499 9.03517 15.8388 9.72235L9.455 18.3024C8.99993 18.914 8.02824 18.5921 8.02824 17.8298V11.9411H4.99504C4.13866 11.9409 3.64882 10.9642 4.16008 10.277L10.5439 1.69696L10.6347 1.59345Z" fill="#A5A3AC"/>
                      </g>
                      <defs>
                        <filter id="filter0_i_7337_2004" x="0" y="0" width="20" height="20.1667" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                          <feOffset dy="0.166667"/>
                          <feGaussianBlur stdDeviation="0.0833333"/>
                          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"/>
                          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_7337_2004"/>
                        </filter>
                      </defs>
                    </svg>
                  </div>
                  <div className={styles.positionRowText}>
                    <span className={styles.positionSectionLabel}>Average APY</span>
                    <span className={styles.positionSectionValue}>{avgApy.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className={styles.positionDivider1} />

              <div className={styles.positionRow}>
                <div className={styles.positionRowLeft}>
                  <div className={styles.positionIconBox}>
                    <img
                      src="/staking/compounded-icon.svg"
                      alt=""
                      width={20}
                      height={20}
                      style={{ display: "block" }}
                    />
                  </div>
                  <div className={styles.positionRowText}>
                    <span className={styles.positionSectionLabel}>Compounded rewards</span>
                    <span className={styles.positionSectionValue}>{fmtGra(autoCompounded)} GRA</span>
                  </div>
                </div>
              </div>

              <div className={styles.positionDivider1} />

              <div className={`${styles.positionRow} ${styles.positionRowLast}`}>
                <div className={styles.positionRowLeft}>
                  <div className={styles.positionIconBox}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                      <g filter="url(#filter0_i_7337_2003)">
                        <path d="M13.125 6.875C15.311 6.875 17.0828 8.64703 17.083 10.833V14.167C17.0828 16.353 15.311 18.125 13.125 18.125H6.45801C4.27214 18.1248 2.50018 16.3529 2.5 14.167V10.833C2.50018 8.64714 4.27214 6.87518 6.45801 6.875H13.125ZM9.79199 11.042C9.44681 11.042 9.16699 11.3218 9.16699 11.667V13.334C9.16734 13.6789 9.44703 13.959 9.79199 13.959C10.1368 13.9588 10.4166 13.6788 10.417 13.334V11.667C10.417 11.3219 10.137 11.0422 9.79199 11.042Z" fill="#A5A3AC"/>
                        <path d="M6.04167 5.83301C6.04175 4.79944 6.43779 3.85826 7.08659 3.15332C7.09875 3.1401 7.11137 3.1273 7.1237 3.11426C7.17954 3.05521 7.2372 2.99791 7.29655 2.94238C7.30647 2.93311 7.31584 2.92323 7.32585 2.91406C7.38983 2.85541 7.45634 2.7995 7.52409 2.74512C7.54055 2.73192 7.55722 2.71899 7.57389 2.70605C7.96633 2.40116 8.41757 2.16879 8.90788 2.02832C8.91227 2.02706 8.91715 2.02664 8.92155 2.02539C9.1038 1.97388 9.29116 1.9352 9.48307 1.91016C9.50033 1.90788 9.51755 1.90537 9.53483 1.90332C9.62545 1.89271 9.71687 1.88427 9.80924 1.87988C9.82096 1.87932 9.83269 1.87937 9.8444 1.87891C9.89592 1.87691 9.94766 1.875 9.99967 1.875V1.87793C10.4487 1.87789 10.8976 1.95135 11.3258 2.10352C12.1037 2.38004 12.7757 2.89295 13.2477 3.57031C13.445 3.85346 13.3755 4.24307 13.0924 4.44043C12.8092 4.63773 12.4196 4.56839 12.2223 4.28516C11.8993 3.82151 11.4393 3.47046 10.9069 3.28125C10.544 3.15228 10.1598 3.10476 9.77995 3.13574C9.75121 3.13805 9.72249 3.13938 9.69401 3.14258C9.58774 3.15466 9.48232 3.17447 9.3776 3.19922C9.29538 3.21857 9.21456 3.24092 9.13542 3.26758C9.087 3.28389 9.03912 3.30136 8.99186 3.32031C8.96364 3.33164 8.93562 3.34322 8.90788 3.35547C8.85583 3.37841 8.80494 3.40358 8.75456 3.42969C8.73412 3.4403 8.71316 3.44983 8.69303 3.46094C8.62475 3.49855 8.55854 3.53969 8.49381 3.58301C8.48819 3.58678 8.48281 3.59091 8.47721 3.59473C8.41734 3.63545 8.35888 3.6782 8.30241 3.72363C8.27613 3.7448 8.25072 3.76694 8.22526 3.78906C8.19082 3.81896 8.15665 3.8492 8.1237 3.88086C8.10162 3.90208 8.0806 3.92433 8.05924 3.94629C8.02187 3.98472 7.98501 4.02372 7.94987 4.06445C7.54008 4.53898 7.29175 5.15685 7.29167 5.83301V7.5H6.04167V5.83301Z" fill="#A5A3AC"/>
                      </g>
                      <defs>
                        <filter id="filter0_i_7337_2003" x="0" y="0" width="20" height="20.2" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                          <feOffset dy="0.2"/>
                          <feGaussianBlur stdDeviation="0.1"/>
                          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"/>
                          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_7337_2003"/>
                        </filter>
                      </defs>
                    </svg>
                  </div>
                  <div className={styles.positionRowText}>
                    <span className={styles.positionSectionLabel}>Available to unstake</span>
                    <span className={styles.positionSectionValue}>{fmtGra(availableToUnstake)} GRA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right card — Accumulated rewards */}
        <div className={`${styles.portfolioStatCard} ${styles.portfolioRewardsCard}`}>
          <div className={styles.positionCard}>
            <div className={`${styles.positionCardHeader} ${styles.portfolioRewardsHeader}`}>
              <div className={styles.positionCardHeaderMain}>
                <span className={styles.positionAmountLabel}>Accumulated rewards</span>
                <span className={styles.positionAmount}>{fmtAccumulatedRewardGra(availableToHarvest)} GRA</span>
              </div>
              <button
                className={`${styles.positionUnstakeBtn} ${availableToHarvest > 0 ? styles.positionUnstakeBtnActive : styles.positionUnstakeBtnLocked} ${styles.portfolioRewardsTopBtn}`}
                onClick={onHarvestAll}
                disabled={availableToHarvest === 0}
              >
                <span className={styles.positionUnstakeBtnInner}>
                  <span className={styles.positionUnstakeBtnText}>Harvest all</span>
                </span>
              </button>
            </div>

            <div className={`${styles.positionDetailsPanel} ${styles.portfolioRewardsDetailsPanel}`}>
              <div className={styles.portfolioRewardsChartBox}>
                <div className={styles.portfolioRewardChart}>
                  <AccumulatedRewardsLiveline
                    data={accumulatedRewardsChartData}
                    value={availableToHarvest}
                    timeOffsetSecs={chartTimeOffsetSecs}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className={`${styles.portfolioFilterRow} ${styles.portfolioFilterTabs}`}>
        <TabSwitcher tabs={filterTabs} value={filter} onChange={(v) => setFilter(v as "active" | "unstaked")} />
      </div>

      {/* ── Table ── */}
      {filter === "active" ? (
        <div className={styles.portfolioTable}>
          {/* Header */}
          <div className={styles.portfolioTHead}>
            <div className={styles.ptColPosition}><span className={styles.portfolioTh}>Position</span></div>
            <div className={styles.ptColStaked}><span className={styles.portfolioTh}>Staked amount</span></div>
            <div className={styles.ptColApy}><span className={styles.portfolioTh}>APY</span></div>
            <div className={styles.ptColCompound}><span className={styles.portfolioTh}>Compound</span></div>
            <div className={styles.ptColEarned}><span className={styles.portfolioTh}>Earned</span></div>
            <div className={styles.ptColActions}><span className={styles.portfolioTh}>Actions</span></div>
          </div>
          {stakes.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center" }}>
              <span className={styles.ptCellSecondary}>No active positions</span>
            </div>
          ) : (
            stakes.map((stake) => {
              const isUnlocked     = new Date(stake.unlockDate) <= now;
              const accValue       = computeAccumulatedValue(stake, now);
              const earnedTotal    = (stake.compoundedTotal ?? 0) + accValue;
              const availHarvest   = stake.autoCompound ? 0 : accValue;
              const showHarvest    = !stake.autoCompound && availHarvest > 0;
              return (
                <div key={stake.id} className={styles.portfolioTRow}>
                  {/* Position */}
                  <div className={styles.ptColPosition}>
                    <div>
                      <div className={styles.ptCellPrimary}>{stake.lockPeriod}</div>
                      <div className={`${styles.ptCellSecondary} ${isUnlocked ? styles.ptUnlocked : ""}`} style={{ marginTop: 4 }}>
                        {isUnlocked ? "Unlocked" : `Ends: ${formatTableDate(stake.unlockDate)}`}
                      </div>
                    </div>
                  </div>
                  {/* Staked amount */}
                  <div className={styles.ptColStaked}>
                    <span className={styles.ptCellPrimary}>{fmtGra(stake.amount)} GRA</span>
                  </div>
                  {/* APY */}
                  <div className={styles.ptColApy}>
                    <span className={styles.ptCellPrimary}>{Math.round(stake.apy * 100)}%</span>
                  </div>
                  {/* Compound toggle */}
                  <div className={styles.ptColCompound}>
                    <button
                      role="switch"
                      aria-checked={stake.autoCompound}
                      className={`${styles.toggle} ${stake.autoCompound ? styles.toggleOn : styles.toggleOff}`}
                      onClick={() => {
                        const next = !stake.autoCompound;
                        onToggleAutoCompound(stake.id, next, next ? accValue : undefined);
                      }}
                    >
                      <span className={`${styles.toggleThumb} ${stake.autoCompound ? styles.toggleThumbOn : styles.toggleThumbOff}`}>
                        <span className={styles.toggleThumbInner} />
                      </span>
                    </button>
                  </div>
                  {/* Earned */}
                  <div className={styles.ptColEarned}>
                    <div>
                      <div className={styles.ptCellPrimary}>{fmtGra(earnedTotal, 2)} GRA</div>
                      <div className={styles.ptCellSecondary} style={{ marginTop: 4 }}>
                        Available: {fmtRewardGra(availHarvest)} GRA
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className={styles.ptColActions}>
                    {showHarvest && (
                      <button
                        className={`${styles.ptBtn} ${styles.ptHarvestBtn}`}
                        onClick={() => onHarvest(stake.id, availHarvest)}
                      >
                        <span className={styles.ptBtnInner}>
                          <span className={styles.ptBtnText}>Harvest</span>
                        </span>
                      </button>
                    )}
                    <button
                      className={`${styles.ptBtn} ${isUnlocked ? styles.ptUnstakeActiveBtn : styles.ptUnstakeLockedBtn}`}
                      onClick={() => { if (isUnlocked) onUnstake(stake.id); }}
                      disabled={!isUnlocked}
                    >
                      <span className={styles.ptBtnInner}>
                        <span className={styles.ptBtnText}>Unstake</span>
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Unstaked tab */
        <div className={styles.portfolioTable}>
          <div className={styles.portfolioTHead}>
            <div className={styles.ptColPositionUnstaked}><span className={styles.portfolioTh}>Position</span></div>
            <div className={styles.ptColStakedUnstaked}><span className={styles.portfolioTh}>Staked amount</span></div>
            <div className={styles.ptColApyUnstaked}><span className={styles.portfolioTh}>APY</span></div>
            <div className={styles.ptColEarnedUnstaked}><span className={styles.portfolioTh}>Earned</span></div>
          </div>
          {unstakedHistory.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center" }}>
              <span className={styles.ptCellSecondary}>No unstaked positions yet</span>
            </div>
          ) : (
            unstakedHistory.map((rec, i) => {
              const earnedTotal = (rec.compoundedTotal ?? 0) + rec.unstakedRewards;
              return (
                <div key={`${rec.id}-${i}`} className={styles.portfolioTRow} style={{ opacity: 0.7 }}>
                  <div className={styles.ptColPositionUnstaked}>
                    <div>
                      <div className={styles.ptCellPrimary}>{rec.lockPeriod}</div>
                      <div className={styles.ptCellSecondary} style={{ marginTop: 4 }}>
                        Withdrawn {formatTableDate(rec.unstakedAt)}
                      </div>
                    </div>
                  </div>
                  <div className={styles.ptColStakedUnstaked}>
                    <span className={styles.ptCellPrimary}>{fmtGra(rec.amount)} GRA</span>
                  </div>
                  <div className={styles.ptColApyUnstaked}>
                    <span className={styles.ptCellPrimary}>{Math.round(rec.apy * 100)}%</span>
                  </div>
                  <div className={styles.ptColEarnedUnstaked}>
                    <div>
                      <div className={styles.ptCellPrimary}>{fmtGra(earnedTotal, 2)} GRA</div>
                      <div className={styles.ptCellSecondary} style={{ marginTop: 4 }}>Total earned</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function StakingPage() {
  const [activeNav, setActiveNav] = useState<"stake" | "portfolio">("stake");
  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [isConnected, setIsConnected] = useState(true);
  const [walletOpen, setWalletOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("Address copied");
  const [faqOpen, setFaqOpen] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [formStep, setFormStep] = useState(1);
  const [baseWalletBalance, setBaseWalletBalance] = useState(WALLET_BALANCE);
  const [stakes, setStakes] = useState<StakeRecord[]>([]);
  const [liveNow, setLiveNow] = useState(() => new Date());
  const [simBaseDate, setSimBaseDate] = useState<Date | null>(null);
  const [simBaseRealMs, setSimBaseRealMs] = useState<number | null>(null);
  const [priorityFee, setPriorityFee] = useState<"low" | "medium" | "high">("low");
  const [unstakeStakeId, setUnstakeStakeId] = useState<number | null>(null);
  const [unstakeBatchOpen, setUnstakeBatchOpen] = useState(false);
  const [harvestStakeId, setHarvestStakeId] = useState<number | null>(null);
  const [harvestAllOpen, setHarvestAllOpen] = useState(false);
  const [unstakedHistory, setUnstakedHistory] = useState<UnstakedRecord[]>([]);
  const [timeSimExpanded, setTimeSimExpanded] = useState<boolean | null>(null);
  const [timeSimTouched, setTimeSimTouched] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedBalance = localStorage.getItem(BALANCE_KEY);
    if (savedBalance !== null) setBaseWalletBalance(parseFloat(savedBalance));
    setStakes(loadStakes());
    setUnstakedHistory(loadUnstakedHistory());
  }, []);

  useEffect(() => {
    const preloaded: HTMLImageElement[] = [];
    PRELOAD_MODAL_ASSETS.forEach((src) => {
      const img = new window.Image();
      img.decoding = "sync";
      img.fetchPriority = "high";
      img.src = src;
      preloaded.push(img);
    });
    return () => {
      preloaded.length = 0;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLiveNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeSimTouched) return;
    if (activeNav === "portfolio") {
      setTimeSimExpanded(false);
      return;
    }
    if (mode === "unstake") {
      setTimeSimExpanded(true);
    }
  }, [activeNav, mode, timeSimTouched]);

  function handleSimDateChange(next: Date | null) {
    if (next) {
      setSimBaseDate(next);
      setSimBaseRealMs(Date.now());
      return;
    }
    setSimBaseDate(null);
    setSimBaseRealMs(null);
  }

  const walletBalance = isConnected ? baseWalletBalance : 0;

  function handleStakeComplete(amount: number, periodIndex: number, isAutoCompound: boolean) {
    const period = PERIODS[periodIndex];
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + period.days);
    const now = new Date().toISOString();
    const record: StakeRecord = {
      id: Date.now(),
      amount,
      apy: period.apy,
      lockPeriod: period.duration,
      unlockDate: unlockDate.toISOString(),
      autoCompound: isAutoCompound,
      autoCompoundDisabledAt: isAutoCompound ? undefined : now,
      stakedAt: now,
      compoundedTotal: 0,
    };
    persistStake(record);
    setStakes((prev) => [record, ...prev]);
    setBaseWalletBalance((b) => {
      const newBal = Math.max(0, b - amount);
      localStorage.setItem(BALANCE_KEY, newBal.toString());
      return newBal;
    });
  }

  function handleUnstake(id: number) {
    setUnstakeStakeId(id);
  }

  function handleUnstakeConfirm(id: number) {
    const stake = stakes.find((s) => s.id === id);
    if (!stake) return;
    const nowDate = simBaseDate ? now : new Date();
    const accValue = computeAccumulatedValue(stake, nowDate);
    const rewards = !stake.autoCompound ? accValue : 0;
    const finalCompoundedTotal = stake.autoCompound
      ? (stake.compoundedTotal ?? 0) + accValue
      : (stake.compoundedTotal ?? 0);
    removeStake(id);
    setStakes((prev) => prev.filter((s) => s.id !== id));
    const record: UnstakedRecord = { ...stake, compoundedTotal: finalCompoundedTotal, unstakedAt: new Date().toISOString(), unstakedRewards: rewards };
    saveUnstakedRecord(record);
    setUnstakedHistory((prev) => [record, ...prev]);
    setBaseWalletBalance((b) => {
      const newBal = b + stake.amount + rewards;
      localStorage.setItem(BALANCE_KEY, newBal.toString());
      return newBal;
    });
  }

  function showToast(msg = "Address copied") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }

  function handleToggleAutoCompound(id: number, enabled: boolean, rewardsAmount?: number) {
    const nowIso = (simBaseDate ? now : new Date()).toISOString();
    let updates: Partial<StakeRecord>;
    let toastMsg: string;
    if (enabled) {
      const stake = stakes.find((s) => s.id === id)!;
      const rewards = rewardsAmount ?? 0;
      const newAmount = stake.amount + rewards;
      const newCompoundedTotal = (stake.compoundedTotal ?? 0) + rewards;
      updates = { autoCompound: true, autoCompoundDisabledAt: undefined, amount: newAmount, compoundedTotal: newCompoundedTotal, rewardsStartTime: nowIso };
      toastMsg = `${rewards.toFixed(6)} GRA rewards added to your stake`;
    } else {
      updates = { autoCompound: false, autoCompoundDisabledAt: nowIso, rewardsStartTime: nowIso };
      toastMsg = "Auto-compound disabled. New rewards will be available to harvest.";
    }
    updateStake(id, updates);
    setStakes((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
    showToast(toastMsg);
  }

  function handleHarvest(id: number, harvested: number) {
    if (harvested.toFixed(6) === "0.000000") return;
    setHarvestStakeId(id);
  }

  function handleHarvestConfirm(id: number) {
    const stake = stakes.find((s) => s.id === id);
    if (!stake || stake.autoCompound) return;
    const nowDate = simBaseDate ? now : new Date();
    const harvested = computeAccumulatedValue(stake, nowDate);
    if (harvested.toFixed(6) === "0.000000") return;
    const nowIso = nowDate.toISOString();
    const updates: Partial<StakeRecord> = { harvestedAt: nowIso };
    updateStake(id, updates);
    setStakes((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
    setBaseWalletBalance((b) => {
      const newBal = b + harvested;
      localStorage.setItem(BALANCE_KEY, newBal.toString());
      return newBal;
    });
  }

  function handleHarvestAll() {
    const nowDate = simBaseDate ? now : new Date();
    const total = stakes
      .filter((s) => !s.autoCompound)
      .reduce((sum, s) => sum + computeAccumulatedValue(s, nowDate), 0);
    if (total.toFixed(6) === "0.000000") return;
    setHarvestAllOpen(true);
  }

  function handleHarvestAllConfirm() {
    const nowDate = simBaseDate ? now : new Date();
    const nowIso = nowDate.toISOString();
    let total = 0;
    const updated = stakes.map((s) => {
      if (s.autoCompound) return s;
      const rewards = computeAccumulatedValue(s, nowDate);
      if (rewards.toFixed(6) === "0.000000") return s;
      total += rewards;
      updateStake(s.id, { harvestedAt: nowIso });
      return { ...s, harvestedAt: nowIso };
    });
    setStakes(updated);
    if (total > 0) {
      setBaseWalletBalance((b) => {
        const newBal = b + total;
        localStorage.setItem(BALANCE_KEY, newBal.toString());
        return newBal;
      });
    }
  }

  function handleUnstakeAvailable() {
    const nowDate = simBaseDate ? now : new Date();
    const unlocked = stakes.filter((s) => new Date(s.unlockDate) <= nowDate);
    if (unlocked.length === 0) return;
    setUnstakeBatchOpen(true);
  }

  function handleUnstakeBatchConfirm() {
    const nowDate = simBaseDate ? now : new Date();
    const nowIso = nowDate.toISOString();
    const unlocked = stakes.filter((s) => new Date(s.unlockDate) <= nowDate);
    if (unlocked.length === 0) return;
    let totalReturn = 0;
    const newHistory: UnstakedRecord[] = [];
    unlocked.forEach((stake) => {
      const accValue = computeAccumulatedValue(stake, nowDate);
      const rewards = !stake.autoCompound ? accValue : 0;
      const finalCompoundedTotal = stake.autoCompound
        ? (stake.compoundedTotal ?? 0) + accValue
        : (stake.compoundedTotal ?? 0);
      totalReturn += stake.amount + rewards;
      const record: UnstakedRecord = { ...stake, compoundedTotal: finalCompoundedTotal, unstakedAt: nowIso, unstakedRewards: rewards };
      newHistory.push(record);
      saveUnstakedRecord(record);
      removeStake(stake.id);
    });
    const unlockedIds = new Set(unlocked.map((s) => s.id));
    setStakes((prev) => prev.filter((s) => !unlockedIds.has(s.id)));
    setUnstakedHistory((prev) => [...newHistory, ...prev]);
    setBaseWalletBalance((b) => {
      const newBal = b + totalReturn;
      localStorage.setItem(BALANCE_KEY, newBal.toString());
      return newBal;
    });
  }

  function handleWalletClick() {
    if (isConnected) {
      setWalletOpen(true);
    } else {
      setIsConnected(true);
      setFormResetKey((k) => k + 1);
      setFormStep(1);
    }
  }

  function handleWalletDisconnect() {
    localStorage.removeItem(STAKES_KEY);
    localStorage.removeItem(UNSTAKED_HISTORY_KEY);
    setStakes([]);
    setUnstakedHistory([]);
    setIsConnected(false);
    setFormResetKey((k) => k + 1);
    setFormStep(1);
  }

  const now =
    simBaseDate && simBaseRealMs !== null
      ? new Date(simBaseDate.getTime() + (liveNow.getTime() - simBaseRealMs))
      : liveNow;
  const isOverlayOpen = walletOpen || faqOpen || unstakeStakeId !== null || unstakeBatchOpen || harvestStakeId !== null || harvestAllOpen;
  const showTimeSimulator = !isOverlayOpen && (activeNav === "portfolio" || mode === "unstake");

  function handleTimeSimExpandedChange(next: boolean) {
    setTimeSimTouched(true);
    setTimeSimExpanded(next);
  }

  return (
    <div className={styles.page}>
      {activeNav === "stake" && <StakeBackgroundLoop />}
      <div className={`${styles.appShell} ${isOverlayOpen ? styles.appShellBlurred : ""}`}>
        <Header activeNav={activeNav} onNavChange={setActiveNav} onWalletClick={handleWalletClick} isConnected={isConnected} />

        <main className={styles.content}>
        <div className={styles.stakeStage} style={{ display: activeNav === "stake" ? "flex" : "none" }}>
          <div className={styles.stakeViewport}>
            <div className={styles.stakeScreen}>
              <div className={styles.stakeMainColumn}>
                <div className={styles.topBar}>
                  {mode === "stake" && formStep === 2 ? (
                    <div className={styles.topBarReview}>
                      <button
                        type="button"
                        className={styles.topBarReviewButton}
                        aria-label="Go back"
                        onClick={() => setFormStep(1)}
                      >
                        <img
                          src="/staking/review-back-icon.svg"
                          alt=""
                          width={20}
                          height={20}
                          aria-hidden="true"
                          className={styles.topBarReviewIcon}
                        />
                      </button>
                    </div>
                  ) : (
                    <ModeSwitch mode={mode} onModeChange={setMode} />
                  )}
                  <button type="button" className={styles.topBarHelpButton} aria-label="FAQ" onClick={() => setFaqOpen(true)}>
                    <span className={styles.topBarHelpButtonLabel}>?</span>
                  </button>
                </div>
                <div style={{ display: mode === "stake" ? "block" : "none" }}>
                  <StakeForm walletBalance={walletBalance} resetKey={formResetKey} formStep={formStep} onStepChange={setFormStep} onViewPortfolio={() => setActiveNav("portfolio")} onStakeComplete={handleStakeComplete} isConnected={isConnected} onConnect={() => { setIsConnected(true); setFormResetKey((k) => k + 1); setFormStep(1); }} />
                </div>
                <div style={{ display: mode === "unstake" ? "block" : "none" }}>
                  <UnstakeForm stakes={stakes} now={now} onStartStaking={() => setMode("stake")} onUnstake={handleUnstake} onToggleAutoCompound={handleToggleAutoCompound} onHarvest={handleHarvest} onShowToast={showToast} />
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>

        {activeNav === "portfolio" && (
          <PortfolioPage
            stakes={stakes}
            unstakedHistory={unstakedHistory}
            now={now}
            chartAxisNow={liveNow}
            onUnstake={handleUnstake}
            onToggleAutoCompound={handleToggleAutoCompound}
            onHarvest={handleHarvest}
            onHarvestAll={handleHarvestAll}
            onUnstakeAvailable={handleUnstakeAvailable}
            onStartStaking={() => { setActiveNav("stake"); setMode("stake"); }}
          />
        )}
        </main>
      </div>

      {showTimeSimulator && timeSimExpanded !== null ? (
        <TimeSimulator
          simDate={simBaseDate ? now : null}
          onSimDateChange={handleSimDateChange}
          mode={mode}
          expanded={timeSimExpanded}
          onExpandedChange={handleTimeSimExpandedChange}
        />
      ) : null}

      <FaqModal open={faqOpen} onClose={() => setFaqOpen(false)} />

      <WalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        onCopyAddress={() => showToast("Address copied")}
        onDisconnect={handleWalletDisconnect}
        walletBalance={walletBalance}
        priorityFee={priorityFee}
        onPriorityFeeChange={setPriorityFee}
      />
      <UnstakeModal
        open={unstakeStakeId !== null}
        stake={stakes.find((s) => s.id === unstakeStakeId) ?? null}
        now={now}
        priorityFee={priorityFee}
        onClose={() => setUnstakeStakeId(null)}
        onConfirm={handleUnstakeConfirm}
      />
      <UnstakeBatchModal
        open={unstakeBatchOpen}
        stakes={stakes}
        now={now}
        priorityFee={priorityFee}
        onClose={() => setUnstakeBatchOpen(false)}
        onConfirm={handleUnstakeBatchConfirm}
        onStakeMore={() => {
          setUnstakeBatchOpen(false);
          setActiveNav("stake");
          setMode("stake");
        }}
      />
      <HarvestModal
        open={harvestStakeId !== null}
        stake={stakes.find((s) => s.id === harvestStakeId) ?? null}
        now={now}
        priorityFee={priorityFee}
        onClose={() => setHarvestStakeId(null)}
        onConfirm={handleHarvestConfirm}
      />
      <HarvestAllModal
        open={harvestAllOpen}
        stakes={stakes}
        now={now}
        priorityFee={priorityFee}
        onClose={() => setHarvestAllOpen(false)}
        onConfirm={handleHarvestAllConfirm}
      />
      <Toast visible={toastVisible} message={toastMessage} />
    </div>
  );
}
