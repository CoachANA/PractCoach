"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { scenarios } from "@/data/scenarios";
import VoiceOrb from "@/app/components/VoiceOrb";
import CoachAvatar from "@/app/components/CoachAvatar";
import DidAgentEmbed from "@/app/components/DidAgentEmbed";
import { supabase } from "@/lib/supabase";
import NavBar from "@/app/components/NavBar";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Message = {
  role: "coach" | "coachee";
  content: string;
};

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const scenarioId = params.scenarioId as string;
  const selectedPlan = searchParams.get("plan") ?? "argent";

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId),
    [scenarioId]
  );

  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [activePassId, setActivePassId] = useState<string | null>(null);

  const isArgent = selectedPlan === "argent";
  const isSilver = selectedPlan === "silver";
  const isGold = selectedPlan === "gold";

  const SILVER_AVATAR_LIMIT = 180;

  const hasPlayedIntroRef = useRef(false);

  const formattedPlan =
    selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coachee",
      content:
        "Bonjour… je ne sais pas trop par où commencer, mais j’ai l’impression d’être bloqué en ce moment.",
    },
  ]);

  const [feedback, setFeedback] = useState<any | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  const [silverAvatarTimeUsed, setSilverAvatarTimeUsed] = useState(0);
  const [currentAvatarDuration, setCurrentAvatarDuration] = useState(0);
  const [isFinalizingSession, setIsFinalizingSession] = useState(false);

  const [goldMainProblem, setGoldMainProblem] = useState("");
  const [goldKeyQuestions, setGoldKeyQuestions] = useState("");
  const [goldOutcome, setGoldOutcome] = useState("");
  const [goldFeedbackError, setGoldFeedbackError] = useState("");

  const DID_AGENT_ID = "v2_agt_yTV_wBbg";
  const DID_CLIENT_KEY =
    "YXV0aDB8NjkxYjhjNmM5ZjY1OTk5YjM5MTk1NmZhOktqenoyOGFFQlgyN1d2M2FMYTJZOQ==";

  const shouldShowGoldPlaceholder =
    isGold && isSessionEnded && messages.length <= 2 && !feedback;

  const shouldShowFeedback = !!feedback;


    useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: pass } = await supabase
        .from("session_passes")
        .select("*")
        .eq("user_id", user.id)
        .eq("scenario_id", scenarioId)
        .eq("plan", selectedPlan)
        .eq("status", "paid")
        .is("used_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

     if (!pass) {
  setTimeout(() => {
    router.refresh();
  }, 1500);

  return;
}

      setActivePassId(pass.id);
      setHasAccess(true);
      setAccessChecked(true);
    }

    checkAccess();
  }, [router, scenarioId, selectedPlan]);

  useEffect(() => {
  if (!accessChecked || !hasAccess) return;
  if (!isArgent && !isSilver) return;
  if (hasPlayedIntroRef.current) return;
  if (messages.length !== 1) return;

  hasPlayedIntroRef.current = true;
  playCoachReply(messages[0].content);
}, [accessChecked, hasAccess, isArgent, isSilver, messages]);

  useEffect(() => {
  if (isSessionEnded) return;

  const interval = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [isSessionEnded]);

useEffect(() => {
  if (timeLeft === 0 && !isSessionEnded && !isFinalizingSession) {
    handleEndSession();
  }
}, [timeLeft, isSessionEnded, isFinalizingSession]);

  if (!scenario) {
    return <main className="p-10">Scénario introuvable.</main>;
  }

  if (!accessChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Vérification de l’accès...
      </main>
    );
  }

  if (!hasAccess) {
    return null;
  }



function shouldShowAvatarForSilver(text: string) {
  const lower = text.toLowerCase();

  const emotionalMarkers = [
    "peur",
    "j'ai peur",
    "stress",
    "angoisse",
    "bloqué",
    "bloquée",
    "blocage",
    "je doute",
    "doute",
    "honte",
    "triste",
    "tristesse",
    "frustré",
    "frustration",
    "perdu",
    "perdue",
    "confus",
    "confuse",
    "ça me touche",
    "je me sens",
    "ça me fait",
    "je suis mal",
    "je n'y arrive pas",
    "je me sens en dessous",
    "je me sens nul",
    "je me sens pas à la hauteur",
  ];

  return emotionalMarkers.some((marker) => lower.includes(marker));
}

function canUseSilverAvatar(nextDurationEstimate = 20) {
  return silverAvatarTimeUsed < SILVER_AVATAR_LIMIT &&
    silverAvatarTimeUsed + nextDurationEstimate <= SILVER_AVATAR_LIMIT;
}

async function sendCoachMessage(messageText: string) {
  if (!messageText.trim()) return;

  const coachMessage: Message = {
    role: "coach",
    content: messageText,
  };

  const updatedMessages = [...messages, coachMessage];
  setMessages(updatedMessages);

  // GOLD = handled by D-ID live widget
  if (selectedPlan === "gold") {
    return;
  }

  setIsLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scenarioId,
        messages: updatedMessages,
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur API");
    }

    const data = await response.json();

    const aiText =
      data.reply || "Je ne sais pas trop quoi répondre pour l’instant.";

    const aiReply: Message = {
      role: "coachee",
      content: aiText,
    };

    setMessages((prev) => [...prev, aiReply]);

  const shouldUseSilverAvatar =
  selectedPlan === "silver" &&
  shouldShowAvatarForSilver(aiText) &&
  canUseSilverAvatar();

if (shouldUseSilverAvatar) {
  await generateAvatar(aiText);
  setSilverAvatarTimeUsed((prev) => prev + 20);
} else {
  await playCoachReply(aiText);
}
  } catch (error) {
    console.error(error);

    setMessages((prev) => [
      ...prev,
      {
        role: "coachee",
        content:
          "Désolé, je n’arrive pas à répondre pour le moment.",
      },
    ]);
  } finally {
    setIsLoading(false);
  }

  
}

async function handleSendMessage() {
  if (!input.trim()) return;

  const textToSend = input;
  setInput("");

  await sendCoachMessage(textToSend);
}

async function handleEndSession() {
  if (isFinalizingSession || feedback) return;

  setIsFinalizingSession(true);
  setIsSessionEnded(true);

  console.log("END SESSION - activePassId:", activePassId);

  try {
    const hasCoachMessage = messages.some(
      (message) => message.role === "coach"
    );

    if (!hasCoachMessage && !isGold) {
      setFeedback(null);
      return;
    }

    if (isGold && messages.length <= 2) {
      return;
    }

    const feedbackResponse = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scenarioId,
        messages,
      }),
    });

    const feedbackResult = await feedbackResponse.json();

    if (!feedbackResponse.ok) {
      console.error("Erreur feedback API :", feedbackResult);
      throw new Error(
        feedbackResult.error || "Erreur lors de la génération du feedback"
      );
    }

    const feedbackData = feedbackResult;
    setFeedback(feedbackData);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const saveResponse = await fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scenarioId,
        plan: selectedPlan,
        messages,
        feedback: feedbackData,
        userId: user?.id,
      }),
    });

    const saveText = await saveResponse.text();

    let saveResult: any = null;

    try {
      saveResult = JSON.parse(saveText);
    } catch {
      console.error("Réponse non JSON de /api/sessions :", saveText);
      throw new Error("La route /api/sessions renvoie une erreur HTML.");
    }

    if (!saveResponse.ok) {
      throw new Error(saveResult.error || "Erreur lors de la sauvegarde");
    }
  } catch (error) {
    console.error("Erreur sauvegarde session :", error);
  } finally {
    if (activePassId) {
      const { error } = await supabase
        .from("session_passes")
        .update({
          status: "used",
          used_at: new Date().toISOString(),
        })
        .eq("id", activePassId);

      if (error) {
        console.error("Erreur update pass :", error);
      } else {
        console.log("Pass marqué comme utilisé ✅");
      }
    } else {
      console.warn("Aucun activePassId trouvé ❌");
    }

    setIsFinalizingSession(false);
  }
}

async function handleGenerateGoldFeedback() {
  setGoldFeedbackError("");

  const mainProblem = goldMainProblem.trim();
  const keyQuestions = goldKeyQuestions.trim();
  const outcome = goldOutcome.trim();

  if (mainProblem.length < 20 || keyQuestions.length < 20 || outcome.length < 20) {
    setGoldFeedbackError(
      "Remplis les 3 champs avec au moins une phrase chacun pour générer un feedback utile."
    );
    return;
  }

  setIsFinalizingSession(true);

  try {
    const goldSummaryMessages: Message[] = [
      {
        role: "coach",
        content: `Problématique travaillée : ${mainProblem}`,
      },
      {
        role: "coach",
        content: `Questions clés posées : ${keyQuestions}`,
      },
      {
        role: "coach",
        content: `Déclic ou plan d’action ressorti : ${outcome}`,
      },
    ];

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scenarioId,
        messages: goldSummaryMessages,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erreur lors de la génération du feedback Gold");
    }

    setFeedback(result);
  } catch (error) {
    console.error(error);
    setGoldFeedbackError("Impossible de générer le feedback Gold pour le moment.");
  } finally {
    setIsFinalizingSession(false);
  }
}

async function handleStartRecording() {
  setIsSpeaking(false);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: "audio/webm" });

      setAudioChunks(chunks);
      setIsTranscribing(true);

      try {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Erreur transcription");
        }

        const data = await response.json();
        const transcribedText = data.text || "";

        setInput(transcribedText);

        if (transcribedText.trim()) {
        await sendCoachMessage(transcribedText);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  } catch (error) {
    console.error("Erreur micro :", error);
  }
}

function handleStopRecording() {
  setIsSpeaking(false);
  if (!mediaRecorder) return;

  mediaRecorder.stop();
  setIsRecording(false);
}

async function playCoachReply(text: string) {
  try {
    setIsSpeaking(true);

    const response = await fetch("/api/speak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Erreur génération audio");
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      setIsSpeaking(false);
    };

    await audio.play();
  } catch (error) {
    console.error("Erreur lecture audio :", error);
    setIsSpeaking(false);
  }
}

async function generateAvatar(text: string) {
  try {
    setIsGeneratingAvatar(true);

    const res = await fetch("/api/avatar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    console.log("Réponse /api/avatar :", data);
    console.log("Status avatar API :", res.status);
    console.log("Body avatar API :", data);

    if (!res.ok) {
      console.error("Erreur API avatar :", data);
      return;
    }

    const talkId = data.id;

    if (!talkId) {
      console.error("Pas de talkId reçu", data);
      return;
    }

    let videoReady = false;

    while (!videoReady) {
      await new Promise((r) => setTimeout(r, 2000));

      const check = await fetch(`/api/avatar?id=${talkId}`);
      const result = await check.json();

      console.log("Polling avatar :", result);

      if (result.status === "done" && result.videoUrl) {
        setVideoUrl(result.videoUrl);
        videoReady = true;
      }

      if (!check.ok || result.status === "error") {
        console.error("Erreur polling avatar :", result);
        break;
      }
    }
  } catch (err) {
    console.error("Erreur generateAvatar :", err);
  } finally {
    setIsGeneratingAvatar(false);
  }
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

if (!accessChecked) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      Vérification de l’accès...
    </main>
  );
}

if (!hasAccess) {
  return null;
}

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <NavBar />
      <div className="w-full">
        <div className="mx-auto max-w-3xl">
        {!isArgent && <p className="text-sm text-gray-500">{scenario.difficulty}</p>}

        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          {scenario.title}
        </h1>

        <p className="mt-4 text-gray-600">{scenario.summary}</p>

        <div className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-sm text-white">
          Plan sélectionné : {formattedPlan}
        </div>

        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {isArgent && (
          <p>
          Mode actif : <strong>Audio</strong>. Expérience vocale avec transcription et feedback.
          </p>
          )}

          {isSilver && (
          <p>
          Mode actif : <strong>Immersif partiel</strong>. Audio activé, avatar partiel prévu sur les moments clés.
          </p>
          )}

          {isGold && (
          <p>
          Mode actif : <strong>Premium</strong>. Audio activé, avatar complet prévu sur toute la séance.
          </p>
          )}
        </div>

        <div className="relative z-20 inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm text-white">
          Temps restant : {formatTime(timeLeft)}
        </div>

        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          

         

  {isArgent ? (
  <div className="relative flex w-full min-h-[60vh] flex-col items-center justify-center -mt-10 overflow-hidden">
    <VoiceOrb
      isRecording={isRecording}
      isThinking={isLoading}
      isSpeaking={isSpeaking}
    />

    <div className="mt-4 mb-28 text-center">
      {isTranscribing && (
        <p className="mt-2 text-sm text-blue-600">Transcription en cours...</p>
      )}

      {isSessionEnded && (
        <p className="mt-3 text-sm font-medium text-red-600">
          La séance est terminée. Tu peux maintenant consulter ton feedback.
        </p>
      )}
    </div>

    {!isSessionEnded && (
      <div className="fixed bottom-8 left-0 right-0 z-50">
        <button
          onClick={handleStopRecording}
          disabled={!isRecording || isSessionEnded}
          className="absolute left-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-2xl shadow-lg opacity-90 disabled:opacity-50"
        >
          ✕
        </button>

        <div className="flex justify-center">
          <button
            onClick={handleStartRecording}
            disabled={isLoading || isSpeaking || isRecording || isSessionEnded}
            className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl shadow-xl transition ${
              isLoading || isSpeaking || isRecording || isSessionEnded
                ? "bg-gray-400 text-white opacity-70"
                : "bg-black text-white"
            }`}
          >
            🎤
          </button>

          <button
            onClick={handleEndSession}
            disabled={isSessionEnded}
            className="fixed right-6 top-20 z-50 rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Terminer la session
          </button>
        </div>
      </div>
    )}
  </div>
) : isSilver ? (
  <div className="relative flex w-full min-h-[60vh] flex-col items-center justify-center -mt-6 overflow-hidden">
    <div className="relative flex h-[520px] w-full items-center justify-center">
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          playsInline
          onEnded={() => setVideoUrl(null)}
          className="max-h-[520px] w-full max-w-xl rounded-2xl object-cover shadow-xl"
        />
      ) : (
        <VoiceOrb
          isRecording={isRecording}
          isThinking={isLoading || isGeneratingAvatar}
          isSpeaking={false}
        />
      )}
    </div>

    <div className="mt-4 mb-28 text-center">
      {isLoading && (
        <p className="mt-2 text-sm text-gray-500">Le coaché réfléchit...</p>
      )}

      {!videoUrl && isSpeaking && (
        <p className="mt-2 text-sm text-purple-600">Le coaché parle...</p>
      )}

      {isRecording && (
        <p className="mt-3 text-sm text-red-600">Enregistrement en cours...</p>
      )}

      {isTranscribing && (
        <p className="mt-3 text-sm text-blue-600">Transcription en cours...</p>
      )}

      {isGeneratingAvatar && (
        <p className="mt-4 text-blue-600">Génération de l’avatar...</p>
      )}

      <p className="mt-3 text-sm text-indigo-600">
        Plan Silver : avatar partiel à activer sur moments clés.
      </p>

      <div className="mt-20 relative z-0 inline-flex rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
        🎭 Avatar Silver : {Math.round(silverAvatarTimeUsed)}s / 180s utilisés
      </div>

      {isSessionEnded && (
        <p className="mt-3 text-sm font-medium text-red-600">
          La séance est terminée. Tu peux maintenant consulter ton feedback.
        </p>
      )}
    </div>

    {!isSessionEnded && (
      <div className="fixed bottom-8 left-0 right-0 z-50">
        <button
          onClick={handleStopRecording}
          disabled={!isRecording || isSessionEnded}
          className="absolute left-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-2xl shadow-lg opacity-90 disabled:opacity-50"
        >
          ✕
        </button>

        <div className="flex justify-center">
          <button
            onClick={handleStartRecording}
            disabled={isLoading || isSpeaking || isRecording || isSessionEnded}
            className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl shadow-xl transition ${
              isLoading || isSpeaking || isRecording || isSessionEnded
                ? "bg-gray-400 text-white opacity-70"
                : "bg-black text-white"
            }`}
          >
            🎤
          </button>

          <button
            onClick={handleEndSession}
            disabled={isSessionEnded}
            className="fixed right-6 top-20 z-50 rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Terminer la session
          </button>
        </div>
      </div>
    )}
  </div>
) : (
  <div className="relative flex w-full min-h-[70vh] flex-col items-center justify-center -mt-4 overflow-hidden">
    {!isSessionEnded ? (
      <>
        <DidAgentEmbed
          agentId={DID_AGENT_ID}
          clientKey={DID_CLIENT_KEY}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-yellow-600">
            Plan Gold : avatar live D-ID actif sur toute la séance.
          </p>
        </div>

        <button
          onClick={handleEndSession}
          disabled={isSessionEnded || isFinalizingSession}
          className="fixed right-6 top-20 z-50 rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isFinalizingSession ? "Finalisation..." : "Terminer la session"}
        </button>
      </>
    ) : (
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900">
          Séance terminée
        </h3>
        <p className="mt-3 text-sm text-gray-600">
          L’avatar a été désactivé. Tu peux maintenant consulter ton feedback ci-dessous.
        </p>
      </div>
    )}
  </div>
)}
                      
        </div>

    {isSessionEnded &&
  !isGold &&
  !feedback &&
  !messages.some((message) => message.role === "coach") && (
    <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
      <h2 className="text-lg font-semibold text-gray-900">
        Séance terminée
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Aucun feedback n’a été généré car aucune intervention du coach n’a été enregistrée.
      </p>
    </div>
  )}

    {shouldShowGoldPlaceholder && !feedback && (
  <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
    <h2 className="text-lg font-semibold text-yellow-800 text-center">
      Analyse Gold personnalisée
    </h2>

    <p className="mt-2 text-sm text-yellow-700 text-center">
      Complète ces 3 éléments pour générer ton feedback premium.
    </p>

    <div className="mt-5 space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-800">
          1. Quelle problématique principale a été travaillée ?
        </label>

        <textarea
          value={goldMainProblem}
          onChange={(e) => setGoldMainProblem(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-800">
          2. Quelles questions clés as-tu posées ?
        </label>

        <textarea
          value={goldKeyQuestions}
          onChange={(e) => setGoldKeyQuestions(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-800">
          3. Quel déclic / plan d’action est ressorti ?
        </label>

        <textarea
          value={goldOutcome}
          onChange={(e) => setGoldOutcome(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm"
        />
      </div>
    </div>

    {goldFeedbackError && (
      <p className="mt-4 text-sm text-red-600 text-center">
        {goldFeedbackError}
      </p>
    )}

    <div className="mt-6 flex justify-center">
      <button
        onClick={handleGenerateGoldFeedback}
        disabled={isFinalizingSession}
        className="rounded-xl bg-black px-5 py-3 text-sm text-white disabled:opacity-50"
      >
        {isFinalizingSession
          ? "Analyse en cours..."
          : "Générer mon feedback Gold"}
      </button>
    </div>
  </div>
)}



     {shouldShowFeedback && feedback && (
  <div className="mt-10 rounded-2xl border border-gray-200 p-6">
    <h2 className="text-xl font-semibold text-gray-900">
      {isGold ? "Analyse Gold personnalisée" : "Feedback de coaching"}
    </h2>

    <div className="mt-4">
      <p className="font-semibold text-green-600">Points forts :</p>
      <ul className="ml-5 mt-2 list-disc">
        {feedback.strengths.map((item: string, i: number) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>

    <div className="mt-4">
      <p className="font-semibold text-orange-600">Axes d’amélioration :</p>
      <ul className="ml-5 mt-2 list-disc">
        {feedback.improvements.map((item: string, i: number) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>

    <div className="mt-4">
      <p className="font-semibold text-blue-600">Prochaine étape :</p>
      <p className="mt-1">{feedback.nextStep}</p>
    </div>

    <div className="mb-6 grid gap-4 md:grid-cols-4">
      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Score global</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {feedback.overallScore}/100
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Questions</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {feedback.questioning}/100
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Exploration</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {feedback.exploration}/100
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Posture</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {feedback.posture}/100
        </p>
      </div>
    </div>

    {isSessionEnded && messages.length > 0 && !isGold && (
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900">Transcription</h3>

        <div className="mt-4 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <p className="text-sm font-semibold text-gray-700">
                {message.role === "coach" ? "Coach" : "Coaché IA"}
              </p>
              <p className="mt-1 text-gray-800">{message.content}</p>
            </div>
          ))}
        </div>
      </div>
    )}

  <div className="mt-8 flex flex-wrap gap-3">
  <a
    href="/history"
    className="rounded-xl bg-black px-5 py-3 text-sm text-white hover:opacity-90"
  >
    Voir mes sessions
  </a>

  <a
    href="/progress"
    className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm text-gray-900 hover:bg-gray-50"
  >
    Voir ma progression
  </a>
</div>


  </div>
)}
        </div>
      </div>
    </main>
  );
}