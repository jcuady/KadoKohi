type ClerkTokenGetter = () => Promise<string | null>;
type ClerkSignOutFn = () => Promise<void>;

let clerkTokenGetter: ClerkTokenGetter | null = null;
let clerkSignOutFn: ClerkSignOutFn | null = null;

export function registerClerkTokenGetter(getter: ClerkTokenGetter): void {
  clerkTokenGetter = getter;
}

export function registerClerkSignOut(fn: ClerkSignOutFn): void {
  clerkSignOutFn = fn;
}

export function clearClerkTokenGetter(): void {
  clerkTokenGetter = null;
}

export function clearClerkSignOut(): void {
  clerkSignOutFn = null;
}

export async function getClerkSupabaseToken(): Promise<string | null> {
  if (!clerkTokenGetter) return null;
  try {
    return await clerkTokenGetter();
  } catch {
    return null;
  }
}

export async function clerkSignOut(): Promise<void> {
  if (clerkSignOutFn) await clerkSignOutFn();
}
