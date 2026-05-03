import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// Auth handler routes are runtime-dynamic (use cookies/headers).
export const dynamic = "force-dynamic";
