"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type GlobalLoadingContextValue = {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(null);

const AUTO_STOP_MS = 15000;

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearAutoStop = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopLoading = useCallback(() => {
    clearAutoStop();
    setIsLoading(false);
  }, [clearAutoStop]);

  const startLoading = useCallback(() => {
    clearAutoStop();
    setIsLoading(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      timeoutRef.current = null;
    }, AUTO_STOP_MS);
  }, [clearAutoStop]);

  useEffect(() => {
    stopLoading();
  }, [pathname, searchParams, stopLoading]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchor) {
        return;
      }

      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("href")?.startsWith("#") ||
        anchor.dataset.skipGlobalLoader === "true"
      ) {
        return;
      }

      startLoading();
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;

      if (!form || form.dataset.skipGlobalLoader === "true") {
        return;
      }

      startLoading();
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [startLoading]);

  const value = useMemo(
    () => ({
      isLoading,
      startLoading,
      stopLoading,
    }),
    [isLoading, startLoading, stopLoading],
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingOverlay visible={isLoading} />
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);

  if (!context) {
    throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
  }

  return context;
}

function GlobalLoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"
        }`}
      aria-hidden={!visible}
    >
      <div className="absolute inset-0 bg-warm-50/88 backdrop-blur-md" />

      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="aakruti-loader-shell relative flex h-36 w-36 items-center justify-center rounded-full sm:h-40 sm:w-40">
          <div className="aakruti-loader-ring absolute inset-0 rounded-full border border-brass-300/60" />
          <div className="aakruti-loader-ring-delayed absolute inset-3 rounded-full border border-warm-300/70" />
          <div className="aakruti-loader-glow absolute inset-6 rounded-full" />
          <Image
            src="/logo.png"
            alt="Aakruti loading"
            width={140}
            height={140}
            priority
            className="aakruti-loader-logo relative h-24 w-auto object-contain sm:h-28"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="aakruti-tagline-line h-px w-10 bg-brass-400" />
          <p className="aakruti-tagline font-[family-name:var(--font-great-vibes)] text-3xl sm:text-4xl">
            Shaping your Abode
          </p>
          <div className="aakruti-tagline-line h-px w-10 bg-brass-400" />
        </div>
      </div>
    </div>
  );
}

