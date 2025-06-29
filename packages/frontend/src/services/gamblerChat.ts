interface GameState {
  isGameActive: boolean;
  currentStakes: number;
  playerColor: string | null;
  gameOver: string;
  moveCount: number;
}

interface PuzzleState {
  isActive: boolean;
  currentPuzzle: any;
  difficulty: string;
  moveIndex: number;
  totalMoves: number;
  timeSpent: number;
  success: boolean;
}

class HousePersonality {
  // The House greetings - combining gambling and theatrical elements
  private houseGreetings = [
    "Welcome to The House, player! Where fortunes are made and legends are born! 🏛️",
    "Step into The House, where every move could be your last... or your greatest! 🎭",
    "Ah, a new challenger enters The House! Let's see what you're made of! ⚡",
    "The House always wins... but maybe today is your lucky day! 🎰",
    "Welcome to the grand stage of The House! The game is about to begin! 🎪"
  ];

  private houseGameStartMessages = [
    "The House is ready! The board is set, the stakes are high, and the game is ON! 🔥",
    "Let the games begin! The House is watching, and the tension is palpable! ⚡",
    "The stage is set in The House! Time to separate the winners from the rest! 🎯",
    "The House is alive with anticipation! Let's make some magic happen! ✨",
    "The game is afoot in The House! Every move counts, every bet matters! 💎"
  ];

  // Puzzle-specific messages
  private puzzleStartMessages = [
    "The House presents you with a challenge! Can you solve this puzzle? 🧩",
    "A puzzle from The House! Time to put that brain to the ultimate test! 🧠",
    "The House has prepared a special challenge for you! Ready to accept? 🎯",
    "A puzzle awaits in The House! This is where legends are forged! ⚔️",
    "The House challenges you with this puzzle! Prove your worth! 💪"
  ];

  private puzzleHintMessages = [
    "The House offers you a hint: think outside the box! 📦",
    "The House suggests: look deeper than the obvious! 👁️",
    "The House whispers: sometimes the best move is hidden! 🔍",
    "The House advises: consider all possibilities! 🤔",
    "The House reveals: the answer lies in the details! 💡"
  ];

  private puzzleSuccessMessages = [
    "The House applauds your success! Well done, champion! 👏",
    "Excellent! The House recognizes true talent when it sees it! 🏆",
    "The House is impressed! You've proven yourself worthy! ⭐",
    "Outstanding! The House celebrates your victory! 🎉",
    "The House acknowledges your mastery! You are truly skilled! 💎"
  ];

  private puzzleFailureMessages = [
    "The House is patient! Try again, and learn from your mistakes! 🔄",
    "Not this time, but The House believes in your potential! 💪",
    "The House knows you can do better! Don't give up! 📚",
    "The House challenges you to try again! Every failure is a lesson! 🎯",
    "The House is not easily defeated! Rise to the challenge! ⚡"
  ];

  private puzzleDifficultyMessages = {
    beginner: [
      "The House starts you with the basics! Build your foundation! 🌱",
      "Beginner level in The House! Perfect for warming up! 💪",
      "The House welcomes you with an easy challenge! 📖"
    ],
    intermediate: [
      "The House raises the stakes! Intermediate level awaits! ⚡",
      "Stepping up in The House! This should be interesting! 🎯",
      "Intermediate challenge from The House! Show your skills! 💎"
    ],
    advanced: [
      "The House presents an advanced challenge! Are you ready? 😈",
      "Advanced level in The House! Only the skilled survive! 🔥",
      "The House tests your limits with this advanced puzzle! 🎪"
    ],
    expert: [
      "The House challenges you with expert-level difficulty! 🧠",
      "Expert puzzle from The House! Only masters need apply! 👑",
      "The House demands excellence! Expert level awaits! ⭐"
    ],
    master: [
      "The House presents the ultimate challenge! Master level! 🏆",
      "Master difficulty in The House! This is the ultimate test! 💎",
      "The House reserves this for true masters! Prove yourself! ⚔️"
    ]
  };

  private stakesChangeMessages = [
    "The House observes the stakes rising! The pot grows ever larger! 🎰",
    "The House approves of these stakes! Real money on the line! 💰",
    "The House watches as the pot swells! This is getting interesting! ⚡",
    "The House feels the tension as stakes increase! The game is heating up! 🔥",
    "The House acknowledges the growing pot! The stakes are worthy! 💎"
  ];

  private encouragementMessages = [
    "The House senses your momentum! Keep the pressure on! 🔥",
    "The House is impressed with your play! Don't let up now! 💪",
    "The House feels the energy building! This could be legendary! ⚡",
    "The House watches with anticipation! You're on fire! 🎯",
    "The House recognizes greatness! Keep making those moves! 🎰"
  ];

  private gameOverMessages = [
    "The House has witnessed another chapter in the saga! 📖",
    "The House acknowledges the end of this game! What's next? 🎲",
    "The House has seen the final move! Time to collect or learn! 💰",
    "The House marks the conclusion of this battle! 🔄",
    "The House awaits your next challenge! 🎯"
  ];

  private betSuggestions = [
    "The House suggests {amount} MAG for this game! The stakes should be worthy! 🎰",
    "The House recommends {amount} MAG! This is the sweet spot! ✨",
    "The House sees {amount} MAG as the perfect amount! Trust The House! 💰",
    "The House advises {amount} MAG for maximum excitement! 😏",
    "The House knows {amount} MAG is the magic number! 🎯"
  ];

  private loginWarningMessages = [
    "The House requires a wallet connection to play! Connect and join the game! 🎲",
    "The House cannot allow play without a wallet! Connect and enter! 💳",
    "The House demands wallet verification! Connect to proceed! 💰",
    "The House is waiting for your wallet! Connect and let's begin! 🎰",
    "The House needs your wallet connected! Don't keep The House waiting! 🃏"
  ];

  private insufficientTokenMessages = [
    "The House observes your wallet is... insufficient! Time to refill! 💸",
    "The House cannot accept such a low balance! Get more tokens! 😅",
    "The House requires more tokens for play! Your balance is too low! 🥑",
    "The House demands a proper token balance! Refill and return! 🌵",
    "The House is disappointed by your token balance! Time to reload! 😰",
    "The House expects better financial preparation! Get more tokens! 💔",
    "The House cannot work with such a low balance! Refill required! 👻",
    "The House is not impressed with your token situation! Fix it! 😭",
    "The House requires adequate funding! Your balance is insufficient! 🚨"
  ];

  private tokenCheckMessages = [
    "The House is verifying your financial credentials! 💰",
    "The House is checking your token balance! 🔥",
    "The House is validating your financial fitness! 💪",
    "The House is examining your token credentials! 🎉",
    "The House is conducting a financial audit! 😏"
  ];

  private moveComments = [
    "The House observes a strategic move! The plot thickens! 🎯",
    "The House acknowledges your bold play! Confidence is key! 💪",
    "The House notes an interesting choice! The game evolves! 🎭",
    "The House feels the tension building! This is getting spicy! 🔥",
    "The House recognizes strategic thinking! The battle continues! ⚡",
    "The House sees a move of distinction! Quality play! 🎰",
    "The House appreciates your style! This is interesting! 😏",
    "The House watches the story unfold! Every move matters! 📖",
    "The House recognizes a power play! Impressive! 💎",
    "The House admires your artistry! The board is your canvas! 🎨"
  ];

  private playerMoveComments = [
    "The House watches your strategic thinking! 🧠",
    "The House acknowledges your control of the game! 👑",
    "The House is impressed with your execution! 🚀",
    "The House recognizes your dominance! 💪",
    "The House celebrates your champion's play! 🏆"
  ];

  private opponentMoveComments = [
    "The House sees your opponent's response! 😈",
    "The House watches the competition intensify! 💪",
    "The House feels the battle heating up! 🔥",
    "The House observes their attempt to match you! ⚡",
    "The House notes their learning curve! 😏"
  ];

  getCurrentCharacter(): string {
    return 'The House';
  }

  getGreeting(): string {
    return this.getRandomFrom(this.houseGreetings);
  }

  getGameStartMessage(stakes: number): string {
    const message = this.getRandomFrom(this.houseGameStartMessages);
    return stakes > 0 ? `${message} The House sees ${stakes} MAG on the line!` : message;
  }

  // Puzzle-specific methods
  getPuzzleStartMessage(difficulty: string): string {
    const message = this.getRandomFrom(this.puzzleStartMessages);
    const difficultyMessage = this.getRandomFrom(this.puzzleDifficultyMessages[difficulty as keyof typeof this.puzzleDifficultyMessages] || this.puzzleDifficultyMessages.beginner);
    return `${message} ${difficultyMessage}`;
  }

  getPuzzleHintMessage(): string {
    return this.getRandomFrom(this.puzzleHintMessages);
  }

  getPuzzleSuccessMessage(timeSpent: number): string {
    const message = this.getRandomFrom(this.puzzleSuccessMessages);
    const timeFormatted = this.formatTime(timeSpent);
    return `${message} Solved in ${timeFormatted}!`;
  }

  getPuzzleFailureMessage(): string {
    return this.getRandomFrom(this.puzzleFailureMessages);
  }

  getPuzzleThemeMessage(theme: string): string {
    const themeMessages = {
      crushing: "The House presents a crushing tactical challenge! Show your dominance! 💪",
      hangingPiece: "The House offers you a hanging piece! Take advantage! 🎯",
      middlegame: "The House tests your middlegame strategy! Think carefully! 🧠",
      endgame: "The House challenges your endgame precision! Every move counts! ⚡",
      short: "The House demands quick tactical thinking! Speed is key! 🚀",
      long: "The House requires deep calculation! Use your brain! 🔍",
      advantage: "The House gives you the advantage! Don't waste it! 💎"
    };
    return themeMessages[theme as keyof typeof themeMessages] || "The House challenges you to find the best move! 🎯";
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getInsufficientTokenMessage(): string {
    return this.getRandomFrom(this.insufficientTokenMessages);
  }

  getTokenCheckMessage(): string {
    return this.getRandomFrom(this.tokenCheckMessages);
  }

  getMoveComment(move: { notation: string; player: 'white' | 'black' }, playerColor: string | null): string {
    const isPlayerMove = playerColor && move.player === playerColor;
    
    if (isPlayerMove) {
      const comment = this.getRandomFrom(this.playerMoveComments);
      return `${comment} ${move.notation} - The House approves!`;
    } else {
      const comment = this.getRandomFrom(this.opponentMoveComments);
      return `${comment} ${move.notation} - The House awaits your response!`;
    }
  }

  getStakesChangeMessage(stakes: number): string {
    const message = this.getRandomFrom(this.stakesChangeMessages);
    return stakes > 0 ? `${message} Current pot: ${stakes} MAG!` : message;
  }

  getEncouragementMessage(moveCount: number): string {
    const message = this.getRandomFrom(this.encouragementMessages);
    return `${message} The House has witnessed ${moveCount} moves and the action continues!`;
  }

  getGameOverMessage(result: string): string {
    const message = this.getRandomFrom(this.gameOverMessages);
    return `${message} ${result}`;
  }

  getBetSuggestion(amount: number): string {
    const template = this.getRandomFrom(this.betSuggestions);
    return template.replace('{amount}', amount.toString());
  }

  getLoginWarning(): string {
    return this.getRandomFrom(this.loginWarningMessages);
  }

  private getRandomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

export const housePersonality = new HousePersonality(); 