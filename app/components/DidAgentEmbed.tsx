"use client";

import { useEffect, useMemo } from "react";

type DidAgentEmbedProps = {
  agentId: string;
  clientKey: string;
};

export default function DidAgentEmbed({
  agentId,
  clientKey,
}: DidAgentEmbedProps) {
  const targetId = useMemo(
    () => `did-agent-target-${agentId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [agentId]
  );

  useEffect(() => {
    const existing = document.querySelector(
      `script[data-name="did-agent"][data-agent-id="${agentId}"]`
    );
    if (existing) existing.remove();

    const target = document.getElementById(targetId);
    if (target) target.innerHTML = "";

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://agent.d-id.com/v2/index.js";
    script.setAttribute("data-mode", "full");
    script.setAttribute("data-client-key", clientKey);
    script.setAttribute("data-agent-id", agentId);
    script.setAttribute("data-name", "did-agent");
    script.setAttribute("data-monitor", "true");
    script.setAttribute("data-target-id", targetId);

    document.body.appendChild(script);

    return () => {
      script.remove();
      const target = document.getElementById(targetId);
      if (target) target.innerHTML = "";
    };
  }, [agentId, clientKey, targetId]);

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