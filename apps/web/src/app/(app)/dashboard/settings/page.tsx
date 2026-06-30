"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { useSession, updateUser } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function ProfileSettingsPage() {
  const trpc = useTRPC();
  const { data: session, refetch } = useSession();
  const { data: workspaces } = useQuery(trpc.workspace.list.queryOptions());

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user.name) setName(session.user.name);
  }, [session?.user.name]);

  const dirty = name.trim().length > 0 && name.trim() !== session?.user.name;

  async function onSave() {
    if (!dirty) return;
    setSaving(true);
    const { error } = await updateUser({ name: name.trim() });
    setSaving(false);
    if (error) {
      toast.error(error.message ?? "Could not update profile");
      return;
    }
    toast.success("Profile updated");
    refetch();
  }

  const initial = (session?.user.name ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update how your name appears across ShipFlow.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted font-display text-xl font-semibold text-foreground ring-1 ring-border">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{session?.user.name ?? "—"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {session?.user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Username</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={64}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={session?.user.email ?? ""}
              disabled
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Email is tied to your login and can&apos;t be changed here.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={onSave} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>Workspaces you belong to.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {workspaces?.map((ws) => (
            <div
              key={ws.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="text-sm font-medium">{ws.name}</span>
              <span className="text-xs capitalize text-muted-foreground">
                {ws.role}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
