import { redirect } from "next/navigation";

export default function GitHubSettingsRedirect() {
  redirect("/dashboard/repositories");
}
