"use client";

type VoiceOrbProps = {
  isRecording: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  showLabel?: boolean;
};

export default function VoiceOrb({
  isRecording,
  isThinking,
  isSpeaking,
  showLabel = true,
}: VoiceOrbProps) {
  let orbClasses = "bg-gradient-to-br from-sky-200 to-blue-500";
  let label = "Prêt à commencer";
  let ringOpacity = "opacity-20";
  let ringScale = "";
  let ringAnimation = "animate-pulse";

  if (isRecording) {
    orbClasses = "bg-gradient-to-br from-red-300 to-red-500";
    label = "La coach parle...";
    ringOpacity = "opacity-40";
    ringScale = "scale-110";
    ringAnimation = "animate-ping";
  } else if (isThinking) {
    orbClasses = "bg-gradient-to-br from-gray-300 to-gray-500";
    label = "Le coaché réfléchit...";
    ringOpacity = "opacity-25";
    ringScale = "scale-100";
    ringAnimation = "animate-pulse";
  } else if (isSpeaking) {
    orbClasses = "bg-gradient-to-br from-cyan-300 to-indigo-500";
    label = "Le coaché parle...";
    ringOpacity = "opacity-35";
    ringScale = "scale-110";
    ringAnimation = "animate-pulse";
  }

  return (
    <div className="flex w-full flex-col items-center justify-center py-10">
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute h-72 w-72 rounded-full bg-blue-200 blur-3xl ${ringOpacity} transition-all duration-500`}
        />

        <div
          className={`absolute h-56 w-56 rounded-full border border-white/30 ${ringOpacity} ${ringAnimation}`}
        />
        <div
          className={`absolute h-64 w-64 rounded-full border border-white/20 ${ringOpacity} ${ringAnimation} [animation-delay:200ms]`}
        />
        <div
          className={`absolute h-72 w-72 rounded-full border border-white/10 ${ringOpacity} ${ringAnimation} [animation-delay:400ms]`}
        />

        <div
          className={`relative rounded-full shadow-2xl transition-all duration-500 ${orbClasses} ${ringScale} h-40 w-40`}
        />
      </div>

      {showLabel && (
        <p className="mt-8 text-base text-gray-600">{label}</p>
      )}
    </div>
  );
}