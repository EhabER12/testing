"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Something went wrong!
          </h2>
          <p className="mb-8 text-gray-600">
            We apologize for the inconvenience. Please try refreshing the page.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => reset()} variant="outline">
              Try again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
