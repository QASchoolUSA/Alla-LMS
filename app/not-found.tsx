import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] grid place-items-center px-6 bg-[#f7f6f2]">
      <div className="text-center max-w-md">
        <p className="text-xs uppercase tracking-wide text-[#6b6a66]">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#1a1916]">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[#6b6a66]">
          The page you&apos;re looking for doesn&apos;t exist or you may not
          have access.
        </p>
        <Link href="/dashboard" className="inline-block mt-6">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
