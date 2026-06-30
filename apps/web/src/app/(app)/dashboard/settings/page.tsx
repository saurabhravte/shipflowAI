"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { useSession, updateUser } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
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
  const { data: connected } = useQuery(trpc.workspace.connectedAccounts.queryOptions());
  const { data: workspaces } = useQuery(trpc.workspace.list.queryOptions());

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user.name) setName(session.user.name);
  }, [session?.user.name]);

  const dirty = name.trim().length > 0 && name.trim() !== session?.user.name;
  const displayImage =
    session?.user.image ?? connected?.providers.find((p) => p.avatarUrl)?.avatarUrl;

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

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your identity across ShipFlow — photo from Google or GitHub when
            connected.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={session?.user.name ?? "User"}
              imageUrl={displayImage}
              size="lg"
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{session?.user.name ?? "—"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {session?.user.email}
              </p>
            </div>
          </div>

          {connected && connected.providers.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Connected accounts</Label>
              <ul className="flex flex-col gap-2">
                {connected.providers.map((p) => (
                  <li
                    key={p.provider + p.accountId}
                    className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2"
                  >
                    <UserAvatar
                      name={p.accountId}
                      imageUrl={p.avatarUrl}
                      size="sm"
                    />
                    <span className="text-sm capitalize">{p.provider}</span>
                    <Badge variant="outline" className="ml-auto font-data text-[10px]">
                      {p.accountId}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Display name</Label>
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
            <Input id="email" value={session?.user.email ?? ""} disabled readOnly />
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
          <CardDescription>Teams you belong to.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {workspaces?.map((ws) => (
            <div
              key={ws.id}
              className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {ws.logoUrl ? (
                  <UserAvatar name={ws.name} imageUrl={ws.logoUrl} size="sm" />
                ) : (
                  <UserAvatar name={ws.name} size="sm" />
                )}
                <span className="text-sm font-medium">{ws.name}</span>
              </div>
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
