import { z } from "zod";

export const FrequencyEnum = z.enum(["daily", "weekly", "none"]);
export type Frequency = z.infer<typeof FrequencyEnum>;

export const TaskCreateSchema = z.object({
  title: z.string().min(2).max(80),
  frequency: FrequencyEnum,
});
export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;

export const TaskUpdateSchema = z.object({
  title: z.string().min(2).max(80).optional(),
  frequency: FrequencyEnum.optional(),
  is_active: z.boolean().optional(),
});
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;
