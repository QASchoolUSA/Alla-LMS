import * as React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#f7f6f2] sm:p-6">
      {children}
    </main>
  );
}
