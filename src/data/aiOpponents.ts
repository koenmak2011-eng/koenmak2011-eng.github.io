import pawnPuppy from "@/assets/ai-pawn-puppy.jpg";
import capybaraLord from "@/assets/ai-capybara-lord.jpg";
import bearWarrior from "@/assets/ai-bear-warrior.jpg";
import foxSage from "@/assets/ai-fox-sage.jpg";
import dragonOverlord from "@/assets/ai-dragon-overlord.jpg";

export interface AIOpponent {
  id: string;
  name: string;
  title: string;
  elo: number;
  depth: number;
  image: string;
  description: string;
}

export const AI_OPPONENTS: AIOpponent[] = [
  {
    id: "hamster",
    name: "Sir Nibbles",
    title: "The Clueless",
    elo: 400,
    depth: 1,
    image: pawnPuppy,
    description: "Barely knows how the pieces move. Snacks between turns.",
  },
  {
    id: "capybara",
    name: "Capybara Lord",
    title: "The Chill",
    elo: 800,
    depth: 2,
    image: capybaraLord,
    description: "Relaxed royalty. Wins by vibes and occasional brilliance.",
  },
  {
    id: "bear",
    name: "Bear Warrior",
    title: "The Crusher",
    elo: 1200,
    depth: 3,
    image: bearWarrior,
    description: "Aggressive tactician. Will sacrifice pieces just to intimidate you.",
  },
  {
    id: "fox",
    name: "Professor Fox",
    title: "The Cunning",
    elo: 1600,
    depth: 4,
    image: foxSage,
    description: "Three moves ahead. Always. Adjusts monocle after every checkmate.",
  },
  {
    id: "dragon",
    name: "Dragon Overlord",
    title: "The Unforgiving",
    elo: 2000,
    depth: 5,
    image: dragonOverlord,
    description: "Ancient grandmaster of flame and strategy. You will suffer.",
  },
];
