import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

function safeNext(path: string | undefined): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/dashboard";
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const session = await getSessionUser();
  if (session) {
    redirect(safeNext(next));
  }

  return (
    <div className="w-full sm:max-w-sm bg-white sm:rounded-2xl sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 sm:p-8 min-h-[100dvh] sm:min-h-0 flex flex-col justify-center">
      <div className="mb-8 flex flex-col items-center">
        <Logo href="" withWordmark={false} className="scale-125" />
        <h1 className="mt-4 text-xl font-bold text-[#1a1916]">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-[#6b6a66]">
          Sign in to continue learning.
        </p>
      </div>

      <LoginForm next={next ?? "/dashboard"} />

      <p className="mt-6 text-center text-sm text-[#6b6a66]">
        New here?{" "}
        <Link
          href="/register"
          className="text-[#01696f] font-medium hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
