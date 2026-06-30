"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import { cn } from "@/lib/utils";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth-validation";

type Field = "name" | "email" | "password" | "confirm";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false,
    email: false,
    password: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(
    () => ({
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: !confirm
        ? "Please confirm your password."
        : confirm !== password
          ? "Passwords do not match."
          : null,
    }),
    [name, email, password, confirm],
  );

  const isValid =
    !errors.name && !errors.email && !errors.password && !errors.confirm;

  function markTouched(field: Field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function showError(field: Field) {
    return touched[field] ? errors[field] : null;
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!isValid) {
      toast.error("Please fix the highlighted fields before continuing.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      callbackURL: "/dashboard",
    });
    if (error) {
      toast.error(error.message ?? "Could not create your account");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Start free. Bring your own key. Ship reviewed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Primary path: social sign-up */}
        <SocialAuthButtons disabled={isSubmitting} />

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">
            or sign up with email
          </span>
          <Separator className="flex-1" />
        </div>

        {/* Fallback path: custom email/password credential */}
        <form
          onSubmit={handleEmailSignUp}
          className="flex flex-col gap-3"
          noValidate
        >
          <Field
            id="name"
            label="Name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={setName}
            onBlur={() => markTouched("name")}
            disabled={isSubmitting}
            error={showError("name")}
          />
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            onBlur={() => markTouched("email")}
            disabled={isSubmitting}
            error={showError("email")}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => markTouched("password")}
              disabled={isSubmitting}
              aria-invalid={!!showError("password")}
            />
            <PasswordStrengthMeter password={password} />
          </div>
          <Field
            id="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            onBlur={() => markTouched("confirm")}
            disabled={isSubmitting}
            error={showError("confirm")}
          />
          <Button type="submit" disabled={isSubmitting} className="h-11">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  onBlur,
  disabled,
  error,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  disabled: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={!!error}
      />
      {error && <p className={cn("text-xs text-destructive")}>{error}</p>}
    </div>
  );
}
