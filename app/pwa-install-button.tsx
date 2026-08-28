"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [instructions, setInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<
    "android" | "apple" | "computer" | null
  >(null);

  useEffect(() => {
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js");

    const starter = window.setTimeout(() => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setInstalled(standalone);
      if (new URLSearchParams(window.location.search).get("install") === "1")
        setInstructions(true);
    }, 0);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setInstructions(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(starter);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) {
      setInstructions(true);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  };

  const installFor = async (
    device: "android" | "apple" | "computer",
  ) => {
    setSelectedDevice(device);
    if (device === "apple") return;
    if (prompt) {
      setInstructions(false);
      await install();
    }
  };

  if (installed) return null;
  return (
    <>
      <button className="installHubBtn" onClick={() => void install()}>
        <i>↓</i>
        <span>
          <b>Install Maliks Group Hub</b>
          <small>Add it to this device</small>
        </span>
      </button>
      {instructions && (
        <div className="overlay installOverlay" onMouseDown={() => setInstructions(false)}>
          <div className="installModal" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <span>
                <small>MALIKS GROUP HUB</small>
                <h2>Install the Hub on this device</h2>
                <p>No App Store download or separate subscription is required.</p>
              </span>
              <button onClick={() => setInstructions(false)}>×</button>
            </header>
            <div className="installDeviceGrid">
              <button
                className={selectedDevice === "android" ? "selected" : ""}
                onClick={() => void installFor("android")}
              >
                <i>◉</i>
                <h3>Android phone or tablet</h3>
                <strong>Click to install →</strong>
                <ol>
                  <li>Open the Hub in Chrome.</li>
                  <li>Tap the three-dot browser menu.</li>
                  <li>Select Install app or Add to Home screen.</li>
                </ol>
              </button>
              <button
                className={selectedDevice === "apple" ? "selected" : ""}
                onClick={() => void installFor("apple")}
              >
                <i>◆</i>
                <h3>iPhone or iPad</h3>
                <strong>Click for Apple steps →</strong>
                <ol>
                  <li>Open the Hub in Safari.</li>
                  <li>Tap Share at the bottom of the screen.</li>
                  <li>Select Add to Home Screen.</li>
                </ol>
              </button>
              <button
                className={selectedDevice === "computer" ? "selected" : ""}
                onClick={() => void installFor("computer")}
              >
                <i>▣</i>
                <h3>Windows or Mac</h3>
                <strong>Click to install →</strong>
                <ol>
                  <li>Open the Hub in Chrome or Edge.</li>
                  <li>Select the Install icon in the address bar.</li>
                  <li>Confirm Install.</li>
                </ol>
              </button>
            </div>
            {selectedDevice && !prompt && (
              <div className="installFallback">
                {selectedDevice === "apple" ? (
                  <>
                    <b>Apple requires one manual confirmation</b>
                    <p>
                      Safari does not allow websites to install themselves.
                      Tap Share, then Add to Home Screen and confirm Add.
                    </p>
                  </>
                ) : (
                  <>
                    <b>Use your browser’s Install option</b>
                    <p>
                      If the automatic browser window did not appear, open the
                      browser menu and choose Install app. The Hub will then
                      appear like a normal application.
                    </p>
                  </>
                )}
              </div>
            )}
            <p className="installSecurity">
              Always sign in using the exact email address approved by the Hub owner.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
