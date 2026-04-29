// Tic-Tac-Toe AI roster. Skill is gated by `skill` (0-1) which controls
// how often the AI plays optimal vs random.
import pawnPuppy from "@/assets/ai-pawn-puppy.jpg";
import foxSage from "@/assets/ai-fox-sage.jpg";
import bearWarrior from "@/assets/ai-bear-warrior.jpg";
import capybaraLord from "@/assets/ai-capybara-lord.jpg";
import edward from "@/assets/ai-edward.jpg";
import daniel from "@/assets/ai-daniel.jpeg";

export interface TTTOpponent {
  id: string;
  name: string;
  title: string;
  elo: number;
  skill: number; // 0..1 chance of optimal move
  image: string;
  description: string;
  quote: string;
  locked?: boolean;
  lockedByCrowns?: number;
  crownReward: number;
  remarks: { onMove: string[]; onWin: string[]; onLose: string[] };
}

export const TTT_OPPONENTS: TTTOpponent[] = [
  {
    id: "puppy",
    name: "Pawn Puppy",
    title: "Picks A Square Randomly",
    elo: 200,
    skill: 0.05,
    image: pawnPuppy,
    crownReward: 1,
    description: "Picks a square. Hopes for the best.",
    quote: "\"O? X? I'm O? oh ok\"",
    remarks: { onMove: ["uhh that one", "random!", "vibe pick"], onWin: ["I WIN??"], onLose: ["awooo"] },
  },
  {
    id: "fox",
    name: "Fox Sage",
    title: "Knows About Forks",
    elo: 800,
    skill: 0.55,
    image: foxSage,
    crownReward: 4,
    description: "Will set up a double-threat fork if you let him.",
    quote: "\"Two threats. Pick your loss.\"",
    remarks: { onMove: ["forking...", "patience", "foreseen"], onWin: ["forked."], onLose: ["interesting..."] },
  },
  {
    id: "bear",
    name: "Bear Warrior",
    title: "Always Blocks",
    elo: 1200,
    skill: 0.85,
    image: bearWarrior,
    crownReward: 8,
    description: "Will block every threat. Mostly draws. Mostly.",
    quote: "\"NO. YOU. DO. NOT.\"",
    remarks: { onMove: ["BLOCKED", "RAWR", "no."], onWin: ["RAWR 👑"], onLose: ["bears do not lose..."] },
  },
  {
    id: "capybara-lord",
    name: "Capybara Lord",
    title: "Perfect Play",
    elo: 1800,
    skill: 1,
    image: capybaraLord,
    crownReward: 14,
    description: "Plays minimax. You will draw at best.",
    quote: "\"*chews calmly while ending you*\"",
    remarks: { onMove: ["optimal.", "calculated.", "om."], onWin: ["as the oil foretold"], onLose: ["impossible..."] },
  },
  // Secret bosses
  {
    id: "edward-tophat",
    name: "Edward (Top Hat)",
    title: "It Makes Him Smarter",
    elo: 2200,
    skill: 1,
    image: edward,
    locked: true,
    crownReward: 35,
    description: "The hat sees the entire 3x3 in one glance. Or 5x5 if America hits.",
    quote: "\"Fahhhhhhh, the hat plays for me.\"",
    remarks: { onMove: ["fahhhhhhh.", "the hat sees.", "calculated."], onWin: ["fahhhhhhh 🎩"], onLose: ["MY HAT?!"] },
  },
  {
    id: "daniel",
    name: "Daniel",
    title: "The Ragebaiter",
    elo: 2500,
    skill: 1,
    image: daniel,
    locked: true,
    lockedByCrowns: 200,
    crownReward: 50,
    description: "Will draw, draw, draw, then taunt you for not winning.",
    quote: "\"draw again? skill issue tbh\"",
    remarks: {
      onMove: ["...sip", "draw incoming btw", "you can't win this", "*sips*"],
      onWin: ["told you. mid.", "L"],
      onLose: ["i let you", "rigged"],
    },
  },
];
