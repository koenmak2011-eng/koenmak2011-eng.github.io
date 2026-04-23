import austen from "@/assets/ai-austen.jpg";
import william from "@/assets/ai-william.jpg";
import edward from "@/assets/ai-edward.jpg";

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
    id: "austen",
    name: "Austen",
    title: "The Mathlete",
    elo: 400,
    depth: 1,
    image: austen,
    description: "Will calculate the probability of your next move instead of actually playing. Has headphones on so he can't hear you crying. Once solved a Rubik's cube mid-game.",
    quote: "\"Actually, statistically speaking, you've already lost.\"",
    remarks: {
      onMove: ["Hold on, let me calculate...", "According to my equations...", "The probability says this is optimal", "Math doesn't lie 🤓"],
      onCapture: ["That's a negative sum for you", "Subtracted!", "Your pieces are being divided 📐"],
      onCheck: ["Checkmate is just an equation away", "The numbers don't lie!"],
      onLosing: ["This doesn't add up...", "I need to recalculate", "Statistical anomaly!!"],
      onWinning: ["Calculated. 😎", "Math wins again", "The formula was correct all along"],
    },
  },
  {
    id: "william",
    name: "William",
    title: "The Pterodactyl",
    elo: 1200,
    depth: 3,
    image: william,
    description: "Genuinely believes he is a pterodactyl trapped in a human body. Surprisingly brilliant at chess despite screeching between moves. Will flap arms after every capture.",
    quote: "\"SCREEEEECH... I mean, good game.\"",
    remarks: {
      onMove: ["*pterodactyl noises*", "SCREECH", "A pterodactyl never retreats", "*flaps arms intellectually*"],
      onCapture: ["SWOOPED AND SNATCHED 🦅", "*aggressive flapping*", "The pterodactyl feeds!"],
      onCheck: ["AERIAL ASSAULT ON YOUR KING", "SCREEEECH CHECK!!"],
      onLosing: ["Even pterodactyls have bad days...", "The wind was against me!", "*sad screech*"],
      onWinning: ["PTERODACTYL SUPREMACY 🦕", "I soar above your defeat", "Evolution chose ME"],
    },
  },
  {
    id: "edward",
    name: "Edward",
    title: "The Final Boss",
    elo: 2000,
    depth: 5,
    image: edward,
    description: "The undisputed king. Says 'fahhhhhhh' after every devastating move. Has never shown emotion except mild disappointment. You will not survive.",
    quote: "\"Fahhhhhhh... you thought you had a chance?\"",
    remarks: {
      onMove: ["Fahhhhhhh.", "Fahhhhhhh... too easy.", "...fahhhhhhh.", "Fahhhhhhh 😐"],
      onCapture: ["Fahhhhhhh your piece is gone", "FAHHHHHHH 💀", "Fahhhhhhh... another one"],
      onCheck: ["Fahhhhhhh... check.", "FAHHHHHHHHHH YOUR KING TREMBLES"],
      onLosing: ["Fah...wait what?!", "FAHHHHHH THIS IS IMPOSSIBLE", "...no. Fahhhhhhh no."],
      onWinning: ["Fahhhhhhh. GG.", "Fahhhhhhh... as expected.", "FAHHHHHHHHHHHH 👑"],
    },
  },
];
