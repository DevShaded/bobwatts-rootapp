import { useEffect, useState } from "react";
import { RootServerException } from "@rootsdk/client-app";
import { welcomeServiceClient } from "@bobwatts-rootapp/gen-client";
import { WelcomeError, type WelcomeConfiguration, type WelcomeDestination } from "@bobwatts-rootapp/gen-shared";
import { Button } from "@/components/arc/button/button";
import { Textarea } from "@/components/arc/textarea/textarea";

export default function WelcomeSettings() {
  const [draft, setDraft] = useState<WelcomeConfiguration | null>(null);
  const [destinations, setDestinations] = useState<WelcomeDestination[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "denied">("loading");
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    setError("");
    const load = async () => {
      try {
        const editor = await welcomeServiceClient.loadEditor();
        if (cancelled) return;
        if (!editor.configuration) throw new Error("Missing welcome configuration");
        setDraft(editor.configuration);
        setDestinations(editor.destinations);
        setPhase("ready");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof RootServerException && error.code === WelcomeError.ACCESS_DENIED) {
          setPhase("denied");
        } else {
          setError("Welcome settings could not be loaded. Try again when your connection is available.");
          setPhase("error");
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [reload]);

  const edit = (changes: Partial<WelcomeConfiguration>) => {
    setDraft((current) => current ? { ...current, ...changes } : current);
    setStatus("");
    setError("");
  };

  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const saved = await welcomeServiceClient.save(draft);
      setDraft(saved);
      setStatus(saved.enabled ? "Saved. New members will receive your welcome message." : "Saved. Welcome messages are disabled.");
    } catch (error) {
      if (error instanceof RootServerException && error.code === WelcomeError.ACCESS_DENIED) {
        setPhase("denied");
      } else if (error instanceof RootServerException && error.code === WelcomeError.INVALID_CONFIGURATION) {
        setError(error.message);
      } else {
        // A lost response can follow a committed save. Reload instead of claiming it failed.
        setStatus("Save could not be confirmed. Reloading the saved configuration.");
        setReload((current) => current + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  if (phase === "loading") return <p role="status">Loading welcome settings…</p>;
  if (phase === "denied") return (
    <section className="welcome-panel" aria-label="Access denied">
      <h2>Administrator access required</h2>
      <p>Only the community owner or members with Full Control or Manage Apps can view and change welcome settings.</p>
    </section>
  );
  if (phase === "error" || !draft) return (
    <section className="welcome-panel" aria-label="Welcome settings unavailable">
      <p className="error-message" role="alert">{error}</p>
      <Button onClick={() => setReload((current) => current + 1)}>Try again</Button>
    </section>
  );

  const missingDestination = draft.destinationId && !destinations.some((destination) => destination.id === draft.destinationId);
  return (
    <section className="welcome-panel" aria-label="Welcome settings">
      <form className="welcome-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <fieldset disabled={saving}>
          <div className="enabled-field">
            <label htmlFor="welcome-enabled">Enable welcome messages</label>
            <input id="welcome-enabled" type="checkbox" role="switch" checked={draft.enabled}
              onChange={(event) => edit({ enabled: event.target.checked })} aria-describedby="enabled-help" />
          </div>
          <p id="enabled-help" className="field-help">Changes take effect only after Save.</p>
          <div className="destination-field">
            <label htmlFor="welcome-destination">Destination text channel</label>
            <select id="welcome-destination" value={draft.destinationId ?? ""}
              onChange={(event) => edit({ destinationId: event.target.value || undefined })} aria-describedby="destination-help">
              <option value="">Choose a channel</option>
              {missingDestination ? <option value={draft.destinationId}>Saved channel unavailable</option> : null}
              {destinations.map((destination) => <option key={destination.id} value={destination.id}>#{destination.name}</option>)}
            </select>
            <p id="destination-help" className="field-help">{destinations.length === 0
              ? "No writable text channels available. Give BobWatts access to view a channel and create messages."
              : "Only text channels BobWatts can view and post in are listed."}</p>
          </div>
          <Textarea label="Welcome greeting" rows={5} value={draft.greeting}
            onChange={(event) => edit({ greeting: event.target.value })}
            description="Use {user} to mention the joining member. You can use it more than once, or leave it out." />
        </fieldset>
        <div className="save-row">
          <Button type="submit" loading={saving}>{saving ? "Saving…" : "Save"}</Button>
          <p className="field-help">Welcomes use your saved settings.</p>
        </div>
        {error ? <p className="error-message" role="alert">{error}</p> : null}
        <p className="save-status" role="status" aria-atomic="true">{status}</p>
      </form>
    </section>
  );
}
