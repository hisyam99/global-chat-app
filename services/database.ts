import { Message } from "../shared/api.ts";
import { z } from "zod";

// Open connection to database
export const db = await Deno.openKv();

// Define input schema using zod
export const inputSchema = z.array(z.object({
  id: z.string(),
  text: z.string(),
}));

// Define input schema type
export type InputSchema = z.infer<typeof inputSchema>;

// Function to load messages based on chat ID and consistency
export async function loadMessages(
  id: string,
  consistency: "strong" | "eventual",
): Promise<Message[]> {
  const out: Message[] = [];

  // Get iterator from database
  const it = db.list({ prefix: ["chat", id] }, {
    reverse: true,
    consistency,
  });

  // Iterate and add items to output list
  for await (const entry of it) {
    const item = entry.value as Message;
    item.id = entry.key[entry.key.length - 1] as string;
    item.timestamp = Number(entry.versionstamp!); // Convert versionstamp to number
    out.push(item);
  }

  return out;
}

// Function to write messages to database
export async function writeMessages(
  chatId: string,
  inputs: InputSchema,
): Promise<void> {
  const op = db.atomic();

  inputs.forEach((input: InputSchema[number]) => {
    const now = Date.now();
    const message: Message = {
      id: input.id,
      text: input.text,
      sender: "user",
      timestamp: now,
    };

    op.set(["chat", chatId, input.id], message);
  });

  await op.commit();
}
