import arthur from "@/assets/ai-arthur.png";
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
  locked?: boolean;
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
    id: "austen",
    name: "Austen",
    title: "The Mathlete",
    elo: 800,
    depth: 2,
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
    elo: 1400,
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
  {
    id: "arthur-awakened",
    name: "Arthur ★",
    title: "The Awakened One",
    elo: 2500,
    depth: 6,
    image: arthur,
    locked: true,
    description: "Arthur has seen the truth. The horsey DOES move in circles — circles of DESTRUCTION. He has transcended. You are not ready.",
    quote: "\"I finally know which one is the king. It's me.\"",
    remarks: {
      onMove: ["I see everything now.", "The horsey whispers to me.", "You cannot comprehend my power.", "I was only pretending before."],
      onCapture: ["I used to eat pieces by accident. Now it's ON PURPOSE.", "CALCULATED CHAOS", "The old Arthur would've missed that."],
      onCheck: ["I KNOW WHAT CHECK MEANS NOW", "YOUR KING. MY PREY."],
      onLosing: ["No... not again... I can't go back to being dumb...", "THE AWAKENING FLICKERS", "This wasn't in the prophecy!!"],
      onWinning: ["I AM THE PROPHECY.", "From clueless to GODHOOD.", "The horsey bows to ME now. 🐴👑"],
    },
  },
];
