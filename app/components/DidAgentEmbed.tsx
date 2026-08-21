"use client";

import { useEffect, useMemo } from "react";

type DidAgentEmbedProps = {
  agentId: string;
  clientKey: string;
  enabled: boolean;
};

export default function DidAgentEmbed({
  agentId,
  clientKey,
  enabled,
}: DidAgentEmbedProps) {
  const targetId = useMemo(
    () => `did-agent-target-${agentId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [agentId]
  );

  useEffect(() => {
  if (!enabled) {
    console.log("[D-ID] disabled");
    return;
  }

  console.log("[D-ID] Starting initialization");
  console.log("[D-ID] Agent ID:", agentId);
  console.log("[D-ID] Target ID:", targetId);
  console.log("[D-ID] User agent:", navigator.userAgent);

  const existing = document.querySelector(
    `script[data-name="did-agent"][data-agent-id="${agentId}"]`
  );

  if (existing) {
    console.log("[D-ID] Removing existing script");
    existing.remove();
  }

  const target = document.getElementById(targetId);

  if (target) {
    console.log("[D-ID] Target found");
    target.innerHTML = "";
  } else {
    console.error("[D-ID] Target NOT found");
  }

  const script = document.createElement("script");

  script.type = "module";
  script.src = "https://agent.d-id.com/v2/index.js";
  script.setAttribute("data-mode", "full");
  script.setAttribute("data-client-key", clientKey);
  script.setAttribute("data-agent-id", agentId);
  script.setAttribute("data-name", "did-agent");
  script.setAttribute("data-monitor", "true");
  script.setAttribute("data-target-id", targetId);

  script.onload = () => {
    console.log("[D-ID] Script loaded successfully");
    console.log(
      "[D-ID] API available:",
      Boolean((window as any).DID_AGENTS_API)
    );
  };

  script.onerror = (error) => {
    console.error("[D-ID] Script loading error:", error);
  };

  document.body.appendChild(script);

  return () => {
    console.log("[D-ID] Cleanup");

    script.remove();

    const target = document.getElementById(targetId);

    if (target) {
      target.innerHTML = "";
    }
  };
}, [agentId, clientKey, targetId, enabled]);

  // Si le consentement IA n'est pas actif,
  // aucun widget D-ID n'est affiché
  if (!enabled) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="aspect-video w-full bg-white">
          <div id={targetId} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}