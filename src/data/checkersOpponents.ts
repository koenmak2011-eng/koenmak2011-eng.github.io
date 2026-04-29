// Checkers AI roster — mirrors chess ELO tiers with different personas.
// Reuses existing image assets to avoid generation costs.
import pawnPuppy from "@/assets/ai-pawn-puppy.jpg";
import foxSage from "@/assets/ai-fox-sage.jpg";
import bearWarrior from "@/assets/ai-bear-warrior.jpg";
import dragonOverlord from "@/assets/ai-dragon-overlord.jpg";
import edward from "@/assets/ai-edward.jpg";
import daniel from "@/assets/ai-daniel.jpeg";

export interface CheckersOpponent {
  id: string;
  name: string;
  title: string;
  elo: number;
  depth: number; // search depth for AI
  image: string;
  description: string;
  quote: string;
  locked?: boolean;
  lockedByCrowns?: number;
  crownReward: number;
  remarks: {
    onMove: string[];
    onCapture: string[];
    onLosing: string[];
    onWinning: string[];
  };
}

export const CHECKERS_OPPONENTS: CheckersOpponent[] = [
  {
    id: "puppy",
    name: "Pawn Puppy",
    title: "Just Happy To Be Here",
    elo: 200,
    depth: 1,
    image: pawnPuppy,
    crownReward: 5,
    description: "Moves diagonally forward because that's the only direction he understands.",
    quote: "\"WAIT we can JUMP each other?? cool!!\"",
    remarks: {
      onMove: ["aroof!", "diagonal vibes", "uhh this way?"],
      onCapture: ["nom nom", "got one!", "tasty cracker 🍪"],
      onLosing: ["awooo 😢", "this fine"],
      onWinning: ["I WON?? FOR ME?", "best day ever"],
    },
  },
  {
    id: "fox",
    name: "Fox Sage",
    title: "The Diagonal Whisperer",
    elo: 800,
    depth: 3,
    image: foxSage,
    crownReward: 12,
    description: "Sees three jumps ahead. Whispers to the dark squares.",
    quote: "\"Every square knows its fate.\"",
    remarks: {
      onMove: ["the diagonals speak to me", "patience...", "i see it"],
      onCapture: ["snap.", "two birds, one fox", "predicted."],
      onLosing: ["interesting...", "the squares betray me"],
      onWinning: ["foreseen.", "you walked into it"],
    },
  },
  {
    id: "bear",
    name: "Bear Warrior",
    title: "King Me Or Die",
    elo: 1400,
    depth: 4,
    image: bearWarrior,
    crownReward: 18,
    description: "Trades men eagerly to crown his back row. Brutal in the endgame.",
    quote: "\"KING ROW. NOW.\"",
    remarks: {
      onMove: ["forward.", "king row is mine", "RAWR"],
      onCapture: ["RIPPED", "another one falls", "ROAR 🐻"],
      onLosing: ["this is not bear-like..."],
      onWinning: ["KING. ME. 👑", "the woods are mine"],
    },
  },
  {
    id: "dragon",
    name: "Dragon Overlord",
    title: "The Final Crown",
    elo: 2000,
    depth: 6,
    image: dragonOverlord,
    crownReward: 25,
    description: "Counts every piece. Will not blunder. Has been promoted to king already in spirit.",
    quote: "\"You play with wood. I play with fire.\"",
    remarks: {
      onMove: ["calculated.", "your move was anticipated", "🔥"],
      onCapture: ["consumed.", "ash.", "the flame eats wood"],
      onLosing: ["this... cannot be..."],
      onWinning: ["as scripted.", "the crown burns. 👑🔥"],
    },
  },
  // Secret bosses
  {
    id: "edward-tophat",
    name: "Edward (Top Hat)",
    title: "It Makes Him Smarter",
    elo: 2400,
    depth: 7,
    image: edward,
    locked: true,
    crownReward: 40,
    description: "Edward in a top hat. He claims the hat increases his ELO by 400. Disturbingly, it does.",
    quote: "\"With the hat on, fahhhhhhh I see ALL the diagonals.\"",
    remarks: {
      onMove: ["fahhhhhhh.", "the hat... it knows.", "calculated by hat."],
      onCapture: ["fahhhhhhh GONE", "the hat demands tribute", "FAHHHHHHH"],
      onLosing: ["MY HAT... IS IT SLIPPING?!"],
      onWinning: ["the hat reigns 🎩", "fahhhhhhh as ordained"],
    },
  },
  {
    id: "daniel",
    name: "Daniel",
    title: "The Ragebaiter",
    elo: 2700,
    depth: 7,
    image: daniel,
    locked: true,
    lockedByCrowns: 200,
    crownReward: 60,
    description: "Sips Coke. Says nothing for 9 turns. Then ragebaits you until the very end.",
    quote: "\"...sip... your move was mid btw\"",
    remarks: {
      onMove: ["...sip", "your last move was actually crazy", "i'd resign if i were you", "*sips slowly*"],
      onCapture: ["bro got cooked 💀", "L + ratio + checkers", "COOKED.", "*another sip*"],
      onLosing: ["nah this game is rigged", "i let you have that one", "skill issue on my end... allegedly"],
      onWinning: ["told you. mid.", "you fell for the bait", "this is why i sip"],
    },
  },
];
