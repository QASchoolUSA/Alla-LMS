import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getSessionUser } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getSessionUser();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full sm:max-w-sm bg-white sm:rounded-2xl sm:shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-6 sm:p-8 min-h-[100dvh] sm:min-h-0 flex flex-col justify-center">
      <div className="mb-8 flex flex-col items-center">
        <Logo href="" withWordmark={false} className="scale-125" />
        <h1 className="mt-4 text-xl font-bold text-[#1a1916]">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-[#6b6a66]">
          Start learning in under a minute.
        </p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-[#6b6a66]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#01696f] font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
