export type MemoryImportance = 1 | 2 | 3 | 4 | 5;

export type MemoryInput = {
  title: string;
  content: string;
  entity?: string;
  source?: string;
  importance?: MemoryImportance;
  tags?: string[];
};

export type MemoryResult = {
  id: string;
  raw: unknown;
};

export function memoryIsConfigured() {
  return Boolean(process.env.MEMORY_API_URL && process.env.MEMORY_ADMIN_TOKEN);
}

export async function createMemory(input: MemoryInput): Promise<MemoryResult> {
  const baseUrl = process.env.MEMORY_API_URL?.replace(/\/$/, "");
  const adminToken = process.env.MEMORY_ADMIN_TOKEN;

  if (!baseUrl || !adminToken) {
    throw new Error(
      "Memory API is not configured. Set MEMORY_API_URL and MEMORY_ADMIN_TOKEN."
    );
  }

  const response = await fetch(`${baseUrl}/memory`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({
      ...input,
      importance: input.importance ?? 3,
      tags: input.tags ?? [],
    }),
  });

  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      raw && typeof raw === "object" && "error" in raw
        ? JSON.stringify(raw.error)
        : `Memory API returned ${response.status}`;
    throw new Error(message);
  }

  const id = extractMemoryId(raw);
  if (!id) throw new Error("Memory API returned a response without a memory id.");

  return { id, raw };
}

function extractMemoryId(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;

  if (typeof body.id === "string") return body.id;

  if (body.memory && typeof body.memory === "object") {
    const memory = body.memory as Record<string, unknown>;
    return typeof memory.id === "string" ? memory.id : null;
  }

  return null;
}
