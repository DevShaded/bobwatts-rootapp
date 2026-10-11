import type { WelcomePreviewMember } from "@bobwatts-rootapp/gen-shared";

export const WELCOME_GREETING_LIMIT = 1000;

export function welcomeGreetingProblem(greeting: string): string | undefined {
  if (!greeting.trim()) return "Enter a welcome greeting before enabling welcome messages.";
  if (Array.from(greeting).length > WELCOME_GREETING_LIMIT) return "Keep the welcome greeting within 1,000 characters before enabling welcome messages.";
  // Named brace tokens are placeholders; ordinary punctuation and braces remain text.
  const unsupported = greeting.match(/\{[\p{L}_][\p{L}\p{N}_]*\}/gu)?.filter((placeholder) => placeholder !== "{user}");
  if (unsupported?.length) {
    return `Unsupported placeholder: ${[...new Set(unsupported)].join(", ")}. Only {user} is supported; it is optional and case-sensitive.`;
  }
  return undefined;
}
export function renderWelcomeGreeting(greeting: string, member: WelcomePreviewMember): string {
  // Escape only member-controlled text, keeping the administrator's greeting intact.
  const displayText = member.nickname
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/[\\`*_[\]{}()!~|]/g, "\\$&").replace(/[\r\n\t]/g, " ");
  const mention = `[@${displayText}](root://user/${member.userId})`;
  return greeting.split("{user}").join(mention);
}
