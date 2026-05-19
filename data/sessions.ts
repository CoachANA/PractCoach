export type Session = {
  id: string;
  scenarioId: string;
  plan: string;
  messages: {
    role: "coach" | "coachee";
    content: string;
  }[];
  feedback?: string;
  createdAt: string;
};

export const sessions: Session[] = [];