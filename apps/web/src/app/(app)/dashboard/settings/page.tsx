"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function WorkspaceSettingsPage() {
  const trpc = useTRPC();
  const { data: workspaces } = useQuery(trpc.workspace.list.queryOptions());

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Workspace and account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>Workspaces you belong to.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {workspaces?.map((ws) => (
            <div key={ws.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm font-medium">{ws.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{ws.role}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
