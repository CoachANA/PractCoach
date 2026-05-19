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
          className={`absolute inset-0 scale-125 rounded-full blur-3xl transition-all duration-500 will-change-transform ${
            isSpeaking
              ? "bg-cyan-200/70"
              : isThinking
              ? "bg-slate-200/70"
              : "bg-blue-100/70"
          }`}
        />

        <div
          className={`relative h-56 w-56 overflow-hidden rounded-full shadow-2xl transition-all duration-500 will-change-transform ${
            isSpeaking
              ? "scale-105 animate-[speakMove_1.4s_ease-in-out_infinite]"
              : isThinking
              ? "scale-[1.02]"
              : "animate-[breathe_3.2s_ease-in-out_infinite]"
          }`}
        >
          <img
            src={imageSrc}
            alt={label}
            className={`h-full w-full object-cover transition-all duration-300 ${
              isSpeaking
                ? "scale-105"
                : isThinking
                ? "scale-[1.02]"
                : "scale-100"
            }`}
          />

          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-black/10 via-transparent to-white/10" />

          {isSpeaking && (
            <>
              <span className="absolute inset-0 rounded-full border border-cyan-300/70 animate-ping" />
              <span
                className="absolute -inset-3 rounded-full border border-blue-300/40 animate-ping"
                style={{ animationDelay: "220ms" }}
              />
            </>
          )}
        </div>

        {isThinking && (
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

        {!isSpeaking && !isThinking && (
          <p className="mt-1 text-sm text-slate-500">
            {isIdle ? "Présence active" : "Prêt à répondre"}
          </p>
        )}

        {isSpeaking && (
          <p className="mt-1 text-sm font-medium text-cyan-700">
            Réponse en cours...
          </p>
        )}

        {isThinking && (
          <p className="mt-1 text-sm font-medium text-slate-500">
            Réflexion...
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.025);
          }
        }

        @keyframes speakMove {
         0%,100% {
         transform: scale(1.05) translateY(0px);
         }
         50% {
         transform: scale(1.08) translateY(-4px);
         }
        }
      `}</style>
    </div>
  );
}