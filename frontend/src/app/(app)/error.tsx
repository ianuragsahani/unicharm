"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isBackendDown =
    error.message.includes("fetch failed") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("ENOTFOUND");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-zinc-100 p-4">
        <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {isBackendDown ? "Backend unreachable" : "Something went wrong"}
        </h2>
        <p className="max-w-sm text-sm text-zinc-500">
          {isBackendDown
            ? "The API server is not responding. Make sure the backend is running on port 4000."
            : error.message}
        </p>
      </div>

      <button
        onClick={reset}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
