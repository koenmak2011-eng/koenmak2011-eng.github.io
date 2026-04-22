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
  remarks: {
    onMove: string[];
    onCapture: string[];
    onCheck: string[];
    onLosing: string[];
    onWinning: string[];
  };
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
    remarks: {
      onMove: ["Uhh... that one!", "I'm just vibing tbh", "Is this how the horsey moves?", "My cat could play better... wait"],
      onCapture: ["Oops I ate one lol", "Wait that was mine?? Oh no it's yours, nice", "OM NOM NOM"],
      onCheck: ["CHECK!! Wait is that good?", "Did I just do something smart??"],
      onLosing: ["This is fine 🔥", "I'm having fun and that's what matters", "Can we restart? Asking for a friend"],
      onWinning: ["HOW AM I WINNING?!", "Mom get the camera!!", "I literally don't know what I'm doing"],
    },
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
    remarks: {
      onMove: ["*aggressive nibbling*", "Squeak squeak!", "I smell cheese... wait wrong game", "YOLO"],
      onCapture: ["MINE NOW", "*stuffs piece in cheeks*", "Get nibbled on 😤"],
      onCheck: ["Was that check?! I blacked out", "NIBBLE ATTACK!!"],
      onLosing: ["The wheel was rigged!!", "*angry hamster noises*"],
      onWinning: ["FEAR THE NIBBLE", "I am the Senate", "Get rekt nerd"],
    },
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
    remarks: {
      onMove: ["*relaxed splash*", "Chill move, bro", "No stress, just chess", "Vibes only 🧘"],
      onCapture: ["Sorry bro, nothing personal", "Took that while soaking, no biggie"],
      onCheck: ["Oh check. Anyway...", "That happened I guess"],
      onLosing: ["It's about the journey man", "Win or lose, I'm still in the hot tub"],
      onWinning: ["See? Chill always wins", "Told you, just relax lol"],
    },
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
    remarks: {
      onMove: ["RAAAWR", "*slams piece*", "BEAR SMASH", "You dare challenge ME?!"],
      onCapture: ["CRUSHED 💀", "*eats piece aggressively*", "ANOTHER ONE FALLS"],
      onCheck: ["YOUR KING TREMBLES", "BEAR CHECK!! ROAAAAAR"],
      onLosing: ["This table is getting flipped", "*angry growling*", "REMATCH. NOW."],
      onWinning: ["BEAR SUPREMACY 🐻", "Too easy. Pathetic.", "Bow to the bear"],
    },
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
    remarks: {
      onMove: ["Elementary.", "As I predicted.", "A textbook response.", "*adjusts monocle*"],
      onCapture: ["Your piece was in an untenable position.", "Predictable.", "I saw that 12 moves ago."],
      onCheck: ["Check. Obviously.", "Your king's position was fundamentally flawed."],
      onLosing: ["I'm... recalibrating.", "An intentional sacrifice, I assure you.", "Hmm. Interesting."],
      onWinning: ["As expected.", "Perhaps try checkers?", "A masterclass, if I say so myself."],
    },
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
    remarks: {
      onMove: ["Your doom approaches.", "Every move brings you closer to defeat.", "Tremble.", "⚡"],
      onCapture: ["OBLITERATED", "Your army crumbles.", "Another soul claimed."],
      onCheck: ["YOUR KING KNEELS BEFORE ME", "The end is near, mortal."],
      onLosing: ["IMPOSSIBLE!", "This... this cannot be!", "You've merely delayed the inevitable."],
      onWinning: ["Kneel.", "Was there ever any doubt?", "Your ashes will fertilize my garden."],
    },
  },
];
