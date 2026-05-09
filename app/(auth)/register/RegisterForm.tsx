"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signUpAction, type AuthState } from "../actions";

const initialState: AuthState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <Input
        label="Full name"
        name="fullName"
        autoComplete="name"
        placeholder="Jane Doe"
        required
      />
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        minLength={8}
        required
      />
      {state.error && (
        <p
          className={`text-sm ${
            state.ok ? "text-[#437a22]" : "text-[#c0392b]"
          }`}
          role="alert"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" fullWidth loading={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
