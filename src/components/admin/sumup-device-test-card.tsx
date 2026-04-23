"use client";

import { useState, useTransition } from "react";

import { testSumUpSoloConnection } from "@/lib/actions/pos-actions";
import type { PosDeviceTestResult } from "@/types";

type Props = {
  isConfigured: boolean;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SumUpDeviceTestCard({ isConfigured }: Props) {
  const [result, setResult] = useState<PosDeviceTestResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function runTest() {
    startTransition(async () => {
      const nextResult = await testSumUpSoloConnection();
      setResult(nextResult);
    });
  }

  return (
    <section className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-warm-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brass-600">Solo Device</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-warm-900">Connection Test</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warm-600">
            Run this before the first card sale of the day to confirm the SumUp Solo reader is linked, authenticated, and online.
          </p>
        </div>
        <button
          type="button"
          onClick={runTest}
          disabled={isPending || !isConfigured}
          className="rounded-xl bg-warm-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-warm-800 disabled:cursor-not-allowed disabled:bg-warm-300"
        >
          {isPending ? "Testing..." : "Test Solo Connection"}
        </button>
      </div>

      {!isConfigured && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          SumUp is not fully configured. Add `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`, and `SUMUP_SOLO_READER_ID` before running the device test.
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          <div
            className={`rounded-2xl px-4 py-4 text-sm ${
              result.ok
                ? result.deviceStatus === "ONLINE"
                  ? "bg-brass-50 text-brass-800"
                  : "bg-amber-50 text-amber-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {result.message}
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-2xl border border-warm-100 bg-warm-50 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-warm-500">Device Status</dt>
              <dd className="mt-2 flex items-center gap-2 text-sm font-semibold text-warm-900">
                {result.deviceStatus === "ONLINE" && <span className="h-2.5 w-2.5 rounded-full bg-green-500" />}
                {result.deviceStatus === "OFFLINE" && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
                {result.deviceStatus ?? "UNKNOWN"}
              </dd>
            </div>
            <div className="rounded-2xl border border-warm-100 bg-warm-50 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-warm-500">Reader State</dt>
              <dd className="mt-2 text-sm font-semibold text-warm-900">{result.readerState ?? "—"}</dd>
            </div>
            <div className="rounded-2xl border border-warm-100 bg-warm-50 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-warm-500">Firmware</dt>
              <dd className="mt-2 text-sm font-semibold text-warm-900">{result.firmwareVersion ?? "—"}</dd>
            </div>
            <div className="rounded-2xl border border-warm-100 bg-warm-50 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-warm-500">Last Activity</dt>
              <dd className="mt-2 text-sm font-semibold text-warm-900">{formatDateTime(result.lastActivity)}</dd>
            </div>
            <div className="rounded-2xl border border-warm-100 bg-warm-50 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-warm-500">Battery</dt>
              <dd className="mt-2 text-sm font-semibold text-warm-900">
                {result.batteryLevel != null ? `${Math.round(result.batteryLevel)}%` : "—"}
              </dd>
            </div>
          </dl>

          <p className="text-xs text-warm-500">
            Last tested: {formatDateTime(result.testedAt)}
          </p>
        </div>
      )}
    </section>
  );
}
