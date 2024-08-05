export interface Message {
  id: string;
  text: string;
  timestamp: string;
}

export const kv = await Deno.openKv();