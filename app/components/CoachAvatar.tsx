type CoachAvatarProps = {
  isSpeaking: boolean;
  isThinking: boolean;
  isIdle?: boolean;
  label?: string;
  imageSrc: string;
};

export default function CoachAvatar({
  isSpeaking,
  isThinking,
  isIdle = false,
  label = "Coaché IA",
  imageSrc,
}: CoachAvatarProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <div
          className={`absolute inset-0 scale-95 rounded-full blur-2xl transition-all duration-500 will-change-transform ${
            isSpeaking
              ? "bg-cyan-200/70"
              : isThinking
              ? "bg-slate-200/70"
              : "bg-blue-100/70"
          }`}
        />

        <div
  className={`relative h-56 w-56 overflow-hidden rounded-full bg-white shadow-2xl will-change-transform ${
    isSpeaking
      ? "animate-[avatarSpeak_1.1s_ease-in-out_infinite]"
      : isThinking
      ? "animate-[avatarThink_2.8s_ease-in-out_infinite]"
      : "animate-[avatarIdle_4s_ease-in-out_infinite]"
  }`}
>
  <img
    src={imageSrc}
    alt={label}
    className={`h-full w-full object-cover will-change-transform ${
      isSpeaking
        ? "animate-[faceSpeak_0.8s_ease-in-out_infinite]"
        : isThinking
        ? "animate-[faceThink_2.8s_ease-in-out_infinite]"
        : "animate-[faceIdle_4s_ease-in-out_infinite]"
    }`}
  />

  <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-black/10 via-transparent to-white/10" />

  {isSpeaking && (
    <>
      <span className="absolute inset-0 rounded-full border border-cyan-300/60 animate-ping" />
      <span
        className="absolute -inset-2 rounded-full border border-blue-300/30 animate-ping"
        style={{ animationDelay: "250ms" }}
      />
    </>
  )}
</div>

        {isThinking && !isSpeaking && (
          <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-bounce" />
            <span
              className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: "120ms" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: "240ms" }}
            />
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-lg font-semibold text-slate-800">{label}</p>

          {isSpeaking ? (
          <p className="mt-1 text-sm font-medium text-cyan-700">
            Réponse en cours...
          </p>
        ) : isThinking ? (
          <p className="mt-1 text-sm font-medium text-slate-500">
            Réflexion...
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            {isIdle ? "Présence active" : "Prêt à répondre"}
          </p>
        )}
      </div>

      <style jsx>{`
  @keyframes avatarIdle {
    0%,
    100% {
      transform: translateY(0) scale(1);
    }

    50% {
      transform: translateY(-4px) scale(1.025);
    }
  }

  @keyframes faceIdle {
    0%,
    100% {
      transform: scale(1.06) translateY(0);
    }

    50% {
      transform: scale(1.075) translateY(-1px);
    }
  }

  @keyframes avatarSpeak {
  0%,100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }

  20% {
    transform: translateY(-4px) rotate(-0.8deg) scale(1.03);
  }

  40% {
    transform: translateY(-2px) rotate(0.7deg) scale(1.02);
  }

  60% {
    transform: translateY(-5px) rotate(-0.6deg) scale(1.04);
  }

  80% {
    transform: translateY(-2px) rotate(0.5deg) scale(1.02);
  }
}

  @keyframes faceSpeak {
    0%,
    100% {
      transform: scale(1.07) translateY(0);
    }

    50% {
      transform: scale(1.1) translateY(-2px);
    }
  }

  @keyframes avatarThink {
    0%,
    100% {
      transform: translateX(0) rotate(0deg) scale(1);
    }

    50% {
      transform: translateX(3px) rotate(0.7deg) scale(1.015);
    }
  }

  @keyframes faceThink {
    0%,
    100% {
      transform: scale(1.07) translateX(0);
    }

    50% {
      transform: scale(1.085) translateX(2px);
    }
  }
`}</style>
    </div>
  );
}