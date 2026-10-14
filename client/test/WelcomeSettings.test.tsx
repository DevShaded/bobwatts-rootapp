import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { WelcomeConfiguration } from "@bobwatts-rootapp/gen-shared";
import placements from "../../test/welcome-placement.json";
import WelcomeSettings from "../src/WelcomeSettings";

// Replace network boundaries; exercise the production editor and Markdown plugins.
const service = vi.hoisted(() => ({ loadEditor: vi.fn(), save: vi.fn() }));
vi.mock("@bobwatts-rootapp/gen-client", () => ({ welcomeServiceClient: service }));
// Importing the SDK initializes its DevHost bridge, which these offline tests do not use.
vi.mock("@rootsdk/client-app", () => ({ RootServerException: class extends Error {} }));

function loadGreeting(greeting: string, nickname = "Alice", enabled = true) {
  const configuration = { enabled, destinationId: "welcome-channel", greeting };
  service.loadEditor.mockResolvedValue({
    configuration,
    destinations: [{ id: "welcome-channel", name: "welcome" }],
    previewMember: { userId: "example-member", nickname },
  });
  return configuration;
}

beforeEach(() => { vi.resetAllMocks(); });
afterEach(cleanup);

test.each(placements)("draft preview: $name", async ({ greeting, mentions, selector }) => {
  loadGreeting(greeting);
  const { container } = render(<WelcomeSettings />);
  await screen.findByLabelText("Welcome greeting");
  const preview = container.querySelector(".preview-content");
  expect(preview).not.toBeNull();
  const renderedMentions = preview?.querySelectorAll(".preview-mention");
  if (mentions === null) {
    expect(Array.from(renderedMentions ?? []).filter((node) => node.textContent === "@Alice")).toHaveLength(0);
    expect(container.querySelector(".greeting-preview")?.textContent).toContain("This preview keeps {user} literal");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(service.save).not.toHaveBeenCalled();
  } else {
    // The URI-collision scenario contains an existing mention unrelated to the placeholder.
    const exampleMentions = Array.from(renderedMentions ?? []).filter((node) => node.textContent === "@Alice");
    expect(exampleMentions).toHaveLength(mentions);
    expect(preview?.textContent).not.toContain("root://user/example-member");
    if (selector) expect(preview?.querySelector(selector)).not.toBeNull();
  }
});

test("member-controlled Markdown stays literal inside a mention", async () => {
  loadGreeting("Hello {user}!", "` **owned** [link](https://evil.example) ||secret||");
  const { container } = render(<WelcomeSettings />);
  await screen.findByLabelText("Welcome greeting");
  const mention = container.querySelector(".preview-mention");
  expect(mention?.textContent).toBe("@` **owned** [link](https://evil.example) ||secret||");
  expect(mention?.querySelector("strong, a, code, .preview-spoiler")).toBeNull();
});

test("a focused spoiler survives a delayed Save response", async () => {
  const configuration = loadGreeting("Hello {user}! ||*secret*||");
  let completeSave: ((saved: WelcomeConfiguration) => void) | undefined;
  service.save.mockImplementation(() => new Promise<WelcomeConfiguration>((resolve) => { completeSave = resolve; }));
  const { container } = render(<WelcomeSettings />);
  await screen.findByLabelText("Welcome greeting");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(service.save).toHaveBeenCalledWith(configuration);
  const spoiler = container.querySelector<HTMLElement>(".preview-spoiler");
  expect(spoiler).not.toBeNull();
  spoiler?.focus();
  expect(document.activeElement).toBe(spoiler);
  await act(async () => { completeSave?.({ ...configuration }); });
  await screen.findByText("Saved. New members will receive your welcome message.");
  expect(spoiler?.isConnected).toBe(true);
  expect(container.querySelector(".preview-spoiler")).toBe(spoiler);
  expect(document.activeElement).toBe(spoiler);
});
