"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RepositoriesPanel } from "@/components/dashboard/repositories-panel";

export default function RepositoriesPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast.success("GitHub connected successfully");
    }
  }, [searchParams]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Repositories
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect GitHub, sync repositories, and link them to your projects.
        </p>
      </div>
      <RepositoriesPanel />
    </div>
  );
}
