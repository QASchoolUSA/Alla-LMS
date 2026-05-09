"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signInAction, type AuthState } from "../actions";

const initialState: AuthState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Input
        label="Email"
        type="email"
        name="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        type="password"
        name="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        minLength={6}
      />
      {state.error && (
        <p className="text-sm text-[#c0392b]" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" fullWidth loading={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
