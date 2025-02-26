import { z } from "zod";

const clientMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
});
const serverMessageSchema = z.union([
  z.object({
    type: z.union([z.literal("ready"), z.literal("response")]),
    html: z.string(),
    error: z.optional(z.never()),
  }),
  z.object({
    type: z.literal("error"),
    html: z.optional(z.never()),
    error: z.string(),
  }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ServerMessage = z.infer<typeof serverMessageSchema>;

export function parseClientMessage(data: unknown) {
  return clientMessageSchema.safeParse(data);
}
export function parseServerMessage(data: unknown) {
  // console.log("Server message: ", data);
  return serverMessageSchema.safeParse(data);
}
