import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@/server/trpc/root";

/**
 * `useTRPC()` gives components access to query/mutation option builders
 * (e.g. `trpc.workspace.list.queryOptions()`), which are then passed to
 * TanStack Query's `useQuery`/`useMutation` directly. This is the
 * `@trpc/tanstack-react-query` pattern — distinct from the older
 * `@trpc/react-query` proxy-client pattern, chosen because your stack list
 * calls out TanStack Query explicitly as the caching layer.
 */
export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();
