import arthur from "@/assets/ai-arthur.png";
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
  quote: string;
}

export const AI_OPPONENTS: AIOpponent[] = [
  {
    id: "arthur",
    name: "Arthur",
    title: "The Absolute Unit",
    elo: 200,
    depth: 1,
    image: arthur,
    description: "Thinks the horsey moves in circles. Once tried to castle with a pawn. Eats pieces off the board when you're not looking.",
    quote: "\"Wait... which one is the king again?\"",
  },
  {
    id: "hamster",
    name: "Sir Nibbles",
    title: "The Menace",
    elo: 400,
    depth: 1,
    image: pawnPuppy,
    description: "Has the attention span of a goldfish. Will randomly sacrifice his queen for absolutely no reason. Smells like sunflower seeds.",
    quote: "\"I meant to do that\" (he did not)",
  },
  {
    id: "capybara",
    name: "Capybara Lord",
    title: "The Unbothered",
    elo: 800,
    depth: 2,
    image: capybaraLord,
    description: "Plays chess while soaking in a hot tub. Accidentally wins games by being so chill opponents rage-quit. Has never experienced stress.",
    quote: "\"bro it's just a game lol\"",
  },
  {
    id: "bear",
    name: "Bear Warrior",
    title: "The Unhinged",
    elo: 1200,
    depth: 3,
    image: bearWarrior,
    description: "Opens every game by slamming a pawn down so hard the table shakes. Growls at his own pieces when they don't perform. Banned from 3 tournaments.",
    quote: "\"YOUR QUEEN DIES TONIGHT\"",
  },
  {
    id: "fox",
    name: "Professor Fox",
    title: "The Insufferable",
    elo: 1600,
    depth: 4,
    image: foxSage,
    description: "Will explain why your move was bad before you even make it. Has a PhD in being annoying. Tips his top hat after every capture.",
    quote: "\"Fascinating. A truly amateur blunder.\"",
  },
  {
    id: "dragon",
    name: "Dragon Overlord",
    title: "The Final Boss",
    elo: 2000,
    depth: 5,
    image: dragonOverlord,
    description: "Has beaten every grandmaster in existence (allegedly). Sets the board on fire when he wins. You WILL cry. Good luck, mortal.",
    quote: "\"I don't play chess. I end careers.\"",
  },
];
