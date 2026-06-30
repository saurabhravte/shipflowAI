"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { validateEmail } from "@/lib/auth-validation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(
    () => ({
      email: validateEmail(email),
      password: password ? null : "Password is required.",
    }),
    [email, password],
  );

  const isValid = !errors.email && !errors.password;

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) {
      toast.error("Enter a valid email and password.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn.email({
      email: email.trim(),
      password,
      callbackURL: "/dashboard",
    });
    if (error) {
      toast.error(error.message ?? "Invalid email or password");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to keep shipping — reviewed.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Primary path: social sign-in */}
        <SocialAuthButtons disabled={isSubmitting} />

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">
            or sign in with email
          </span>
          <Separator className="flex-1" />
        </div>

        {/* Fallback path: custom email/password credential */}
        <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              disabled={isSubmitting}
              aria-invalid={touched.email && !!errors.email}
            />
            {touched.email && errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              disabled={isSubmitting}
              aria-invalid={touched.password && !!errors.password}
            />
            {touched.password && errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting} className="h-11">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-foreground underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
