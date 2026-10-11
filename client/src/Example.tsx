import React, { useState, useEffect } from "react";
import { RootServerException, RootServerExceptionType } from "@rootsdk/client-app";
import {
  echoServiceClient,
  EchoServiceClientEvent,
} from "@bobwatts-rootapp/gen-client";
import { EchoRequest, EchoResponse, EchoEvent } from "@bobwatts-rootapp/gen-shared";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";

const Echo: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Process when this client initiates: send the request and receive the response
  const send = async (): Promise<void> => {
    if (sending || !inputText.trim()) return;
    setSending(true);
    setError("");
    try {
      const request: EchoRequest = { message: inputText };
      const response: EchoResponse = await echoServiceClient.echo(request);
      setOutputText(response.message);
    } catch (error) {
      let message = "The message could not be confirmed. Please try again later.";
      if (error instanceof RootServerException) {
        switch (error.code) {
          case RootServerExceptionType.MessageTooLong:
            message = "This message is too long. Shorten it and try again.";
            break;
          case RootServerExceptionType.RateLimitExceeded:
            message = "The message limit was reached. Wait a moment before trying again, or shorten your message.";
            break;
          case RootServerExceptionType.RequestTimeout:
            message = "The response timed out. Your message may have been sent.";
            break;
        }
      }
      setError(message);
    } finally {
      setSending(false);
    }
  };

  // Handle the broadcast event when a different client sends the echo request
  useEffect(() => {
    const onEchoReceived = (event: EchoEvent) => {
      setOutputText(event.message);
    };

    echoServiceClient.on(EchoServiceClientEvent.Created, onEchoReceived);

    return () => {
      echoServiceClient.off(EchoServiceClientEvent.Created, onEchoReceived);
    };
  }, []);

  return (
    <section className="echo-panel" aria-label="Echo messages">
      <form
        className="echo-form"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <Input
          label="Your message"
          placeholder="Say something…"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          autoComplete="off"
        />
        <Button type="submit" loading={sending} disabled={!inputText.trim()}>
          {sending ? "Sending…" : "Send message"}
        </Button>
      </form>
      {error ? <p className="error-message" role="alert">{error}</p> : null}
      <div className="echo-result">
        <h2>Latest response</h2>
        <p aria-live="polite" aria-atomic="true">
          {outputText || "Your echoed message will appear here."}
        </p>
      </div>
    </section>
  );
};

export default Echo;
