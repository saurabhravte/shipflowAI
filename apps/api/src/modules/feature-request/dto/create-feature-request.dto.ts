import { z } from "zod";

export const CreateFeatureRequestDto = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Please provide more context (min 10 chars)"),
});
export type CreateFeatureRequestDto = z.infer<typeof CreateFeatureRequestDto>;
