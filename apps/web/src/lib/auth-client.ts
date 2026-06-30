import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  fetchOptions: {
    onRequest(context) {
      console.log("Better Auth request URL:", context.url);
    },
  },
});

export const { signIn, signOut, useSession } = authClient;
