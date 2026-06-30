"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, (used / limit) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{unlimited ? `${used} used` : `${used} / ${limit}`}</span>
      </div>
      {!unlimited && <Progress value={pct} />}
    </div>
  );
}

export default function BillingSettingsPage() {
  const trpc = useTRPC();
  const { data: billing, isLoading } = useQuery(trpc.billing.current.queryOptions());

  const createSub = useMutation(
    trpc.billing.createSubscription.mutationOptions({
      onSuccess: () => {
        toast.info("Subscription created — Razorpay Checkout integration finishes this client-side (see README).");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  if (isLoading || !billing) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="capitalize">{billing.plan} plan</CardTitle>
            <Badge variant={billing.status === "active" ? "success" : "warning"}>{billing.status}</Badge>
          </div>
          <CardDescription>Usage resets monthly.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <UsageBar label="AI reviews" used={billing.usage.aiReviewsUsed} limit={billing.limits.aiReviewsPerMonth} />
          <UsageBar
            label="PRD generations"
            used={billing.usage.prdGenerationsUsed}
            limit={billing.limits.prdGenerationsPerMonth}
          />
        </CardContent>
      </Card>

      {billing.plan === "free" && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade</CardTitle>
            <CardDescription>More AI review credits, more repositories, priority support.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button disabled={createSub.isPending} onClick={() => createSub.mutate({ plan: "pro" })}>
              Upgrade to Pro
            </Button>
            <Button
              variant="outline"
              disabled={createSub.isPending}
              onClick={() => createSub.mutate({ plan: "enterprise" })}
            >
              Upgrade to Enterprise
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
