import type { WelcomePreviewMember } from "@bobwatts-rootapp/gen-shared";
import MarkdownIt from "markdown-it";

export const WELCOME_GREETING_LIMIT = 1000;
const greetingMarkdown = new MarkdownIt({ html: true, linkify: true });
// Recognize common bare domains and email addresses as well as explicit URLs.
greetingMarkdown.linkify.set({ fuzzyLink: true, fuzzyEmail: true });
// Keep entity spellings intact so they cannot masquerade as source URL separators.
greetingMarkdown.inline.ruler.disable("entity");

export function welcomeGreetingContextProblem(greeting: string): string | undefined {
  const occurrences = greeting.split("{user}").length - 1;
  if (!occurrences) return undefined;

  // Only plain text outside existing links can become a new mention. Code,
  // image labels, destinations, and HTML tokens cannot safely receive Markdown.
  let eligible = 0;
  const existingUris = new Set<string>();
  for (const block of greetingMarkdown.parse(greeting, {})) {
    if (block.type !== "inline") continue;
    let linkDepth = 0;
    let bareUrlTail = false;
    for (const token of block.children ?? []) {
      if (token.type === "link_open") {
        linkDepth++;
        bareUrlTail = false;
        const uri = token.attrGet("href");
        if (typeof uri === "string") existingUris.add(uri);
      } else if (token.type === "link_close") {
        linkDepth--;
        bareUrlTail = token.markup === "linkify";
      } else if (token.type === "text" && linkDepth === 0) {
        // GFM recognizes www addresses without checking known domains and can
        // absorb mentions across formatting tokens. Whitespace ends that URL context.
        for (const part of token.content.split(/([ \t\r\n]+)/)) {
          if (/[ \t\r\n]/.test(part)) bareUrlTail = false;
          else {
            if (/\bwww\./i.test(part)) bareUrlTail = true;
            if (!bareUrlTail) eligible += part.split("{user}").length - 1;
          }
        }
      } else if (token.type === "softbreak" || token.type === "hardbreak") bareUrlTail = false;
    }
  }

  // Check the resulting syntax too: a preceding backslash or exclamation mark
  // can turn an otherwise ordinary-text placeholder into literal text or an image.
  let probeUri = "root://user/welcome-placeholder";
  // Parsed destinations also catch entity-encoded links that normalize to this URI.
  while (greeting.includes(probeUri) || existingUris.has(probeUri)) probeUri += "-";
  const probe = greeting.split("{user}").join(`[@Example](${probeUri})`);
  let mentions = 0;
  for (const block of greetingMarkdown.parse(probe, {})) {
    for (const token of block.children ?? []) {
      if (token.type === "link_open" && token.attrGet("href") === probeUri) mentions++;
    }
  }
  return eligible === occurrences && mentions === occurrences ? undefined
    : "Place {user} in ordinary greeting text, outside code, links, images, and HTML. Separate it from bare URLs with a space, and do not escape it with a backslash.";
}

export function welcomeGreetingProblem(greeting: string): string | undefined {
  if (!greeting.trim()) return "Enter a welcome greeting before enabling welcome messages.";
  if (Array.from(greeting).length > WELCOME_GREETING_LIMIT) return "Keep the welcome greeting within 1,000 characters before enabling welcome messages.";
  // Named brace tokens are placeholders; ordinary punctuation and braces remain text.
  const unsupported = greeting.match(/\{[\p{L}_][\p{L}\p{N}_]*\}/gu)?.filter((placeholder) => placeholder !== "{user}");
  if (unsupported?.length) {
    return `Unsupported placeholder: ${[...new Set(unsupported)].join(", ")}. Only {user} is supported; it is optional and case-sensitive.`;
  }
  return welcomeGreetingContextProblem(greeting);
}
export function renderWelcomeGreeting(greeting: string, member: WelcomePreviewMember): string {
  const problem = welcomeGreetingContextProblem(greeting);
  if (problem) throw new Error(problem);
  // Escape only member-controlled text, keeping the administrator's greeting intact.
  const displayText = member.nickname
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/[\\`*_[\]{}()!~|]/g, "\\$&").replace(/[\r\n\t]/g, " ");
  const mention = `[@${displayText}](root://user/${member.userId})`;
  return greeting.split("{user}").join(mention);
}
