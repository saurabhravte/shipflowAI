import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  fetchOptions: {
    onRequest(context) {
      console.log("Better Auth request URL:", context.url);
      console.log("Better Auth request path:", context.path);
    },
  },
});

export const { signIn, signOut, useSession } = authClient;
