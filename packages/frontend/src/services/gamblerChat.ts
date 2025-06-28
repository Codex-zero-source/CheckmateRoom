interface GameState {
  isGameActive: boolean;
  currentStakes: number;
  playerColor: string | null;
  gameOver: string;
  moveCount: number;
}

class GamblerPersonality {
  private greetings = [
    "Hey there, champ! Ready to make some REAL money today? 💰",
    "Welcome to the big leagues, player! The house always wins... or do they? 😏",
    "Ah, a fresh face! I can smell the potential for profit from here! 🎰",
    "Well well well, look who's here to test their luck! Let's make some magic happen! ✨",
    "Yo! You look like someone who knows how to play the game. Ready to double down? 🃏"
  ];

  private gameStartMessages = [
    "The game is ON! I can feel the tension in the air... and the smell of opportunity! 🎯",
    "Here we go! Time to separate the winners from the... well, let's just say the others! 😈",
    "The board is set, the pieces are moving, and the stakes are calling your name! 🎲",
    "Game time! Remember, fortune favors the bold... and the ones who bet big! 💪",
    "Let the games begin! I've got a feeling this is going to be EPIC! 🔥"
  ];

  private stakesChangeMessages = [
    "Now THAT'S what I'm talking about! Real money on the line! 🎰",
    "The pot is getting juicier by the minute! Are you in or are you out? 💰",
    "Stakes are rising! This is where legends are made, my friend! ⚡",
    "I love the smell of fresh bets in the morning! Let's make it rain! 🌧️",
    "The higher the stakes, the sweeter the victory! Time to go big or go home! 🚀"
  ];

  private encouragementMessages = [
    "You're on fire! Keep that momentum going and let's see some REAL action! 🔥",
    "This is your moment! Don't let it slip away - double down and show them who's boss! 💪",
    "I can feel it in my bones - this is going to be HUGE! Time to make some moves! ⚡",
    "The game is heating up! Are you ready to make history or just watch from the sidelines? 🎯",
    "This is what we live for! The thrill, the risk, the REWARD! Let's make it count! 🎰"
  ];

  private gameOverMessages = [
    "And there you have it! Another chapter in the book of legends! 📖",
    "Game over, but the story is just beginning! What's your next move? 🎲",
    "The final move has been played! Time to collect your winnings... or learn from your losses! 💰",
    "That's a wrap! But remember, every ending is just a new beginning! 🔄",
    "The dust has settled! Now let's talk about what's next on the agenda! 🎯"
  ];

  private betSuggestions = [
    "Listen, I've got a feeling about this one. How about we make it interesting with a {amount} MAG bet? 🎰",
    "The stars are aligned, the cards are right, and my gut says {amount} MAG is the magic number! ✨",
    "I'm seeing {amount} MAG written all over this game! It's practically screaming your name! 💰",
    "Trust me on this one - {amount} MAG is the sweet spot. You can thank me later! 😏",
    "The universe is telling me {amount} MAG is your lucky number today! Let's make it happen! 🎯"
  ];

  private userResponses = {
    bet: [
      "That's the spirit! A player after my own heart! Let's make some magic happen! ✨",
      "Now you're talking! I love a player who knows how to play the game! 🎰",
      "Bold move! I can already see the victory dance in your future! 💃",
      "That's what I call confidence! Time to turn that bet into a fortune! 💰",
      "You've got the right attitude! Let's make this one for the history books! 📚"
    ],
    win: [
      "BOOM! There it is! I told you this was going to be epic! 🎉",
      "Winner winner, chicken dinner! You're on fire today! 🔥",
      "That's how it's done! You're making it look easy! 💪",
      "The house doesn't always win when you're playing! Nice work! 🎯",
      "I knew you had it in you! This is just the beginning! 🚀"
    ],
    lose: [
      "Hey, don't sweat it! Every loss is just a lesson learned! 📚",
      "The best players know how to bounce back! Ready for round two? 💪",
      "That's the beauty of the game - there's always another chance! 🔄",
      "Keep your head up! The next one is going to be your big break! ⭐",
      "Losses happen to the best of us! The key is to keep playing! 🎲"
    ],
    default: [
      "I like your style! You've got that winner's mentality! 💪",
      "Keep talking like that and we're going to be rich! 💰",
      "You're speaking my language! This is going to be fun! 😄",
      "I can tell you know how to play the game! Let's make some moves! 🎯",
      "That's the kind of energy I love to see! Ready to make it happen! ⚡"
    ]
  };

  private loginWarningMessages = [
    "Hey, high roller! You can't play if you don't buy in—connect that wallet and let's get lucky! 🎲",
    "Whoa there, partner! You gotta connect your wallet before you can join the action! 💳",
    "No wallet, no wager! Hook up your wallet and let's chase some wins! 💰",
    "You can't win if you're not in! Connect your wallet and let's roll the dice! 🎰",
    "The tables are waiting, but you need to connect your wallet to play! Don't miss out! 🃏"
  ];

  private insufficientTokenMessages = [
    "Oh honey, your wallet is looking a little... thin! 💸 Time to hit up the token faucet!",
    "Broke and beautiful! Your $MAG balance is giving me second-hand embarrassment! 😅",
    "Looks like someone's been spending their tokens on avocado toast! 🥑 Time to refill that wallet!",
    "Your token balance is so low, even a penny would feel rich! 😂 Get some $MAG and come back!",
    "Sweetie, your wallet is drier than a desert! 🌵 Time to get some tokens flowing!",
    "Oh no, not another broke player! Your $MAG balance is giving me anxiety! 😰",
    "Looks like you've been living that broke life! 💔 Time to get your financial act together!",
    "Your token balance is so low, it's practically invisible! 👻 Get some $MAG, stat!",
    "Honey, your wallet is emptier than my dating life! 😭 Time to load up on tokens!",
    "Broke alert! 🚨 Your $MAG balance is giving me second-hand poverty! Time to refill!"
  ];

  private tokenCheckMessages = [
    "Let me check if you've got the goods to play with the big boys! 💰",
    "Time to see if your wallet can handle the heat! 🔥",
    "Checking your financial fitness for this game! 💪",
    "Let's see if you've got what it takes to join the party! 🎉",
    "Verifying your token credentials... this better be good! 😏"
  ];

  private moveComments = [
    "Nice move! I can see the strategy unfolding... 🎯",
    "That's a bold play! I love the confidence! 💪",
    "Interesting choice! The plot thickens... ��",
    "Ooh, that's a spicy move! Things are heating up! 🔥",
    "Strategic thinking! I can feel the tension building! ⚡",
    "That's the kind of move that separates winners from losers! 🎰",
    "I like your style! This is getting interesting! 😏",
    "The game is evolving! Every move tells a story! 📖",
    "That's a power play if I've ever seen one! 💎",
    "The board is your canvas, and you're painting a masterpiece! 🎨"
  ];

  private playerMoveComments = [
    "Your move! I can see the wheels turning... 🧠",
    "That's the spirit! Taking control of the game! 👑",
    "You're making it look easy! Keep it up! 🚀",
    "That's how you assert dominance! I love it! 💪",
    "You're playing like a true champion! 🏆"
  ];

  private opponentMoveComments = [
    "Your opponent is trying to keep up! 😈",
    "They're putting up a fight, but you've got this! 💪",
    "The competition is heating up! Time to show them who's boss! 🔥",
    "They think they can match your skill! Let's prove them wrong! ⚡",
    "Your opponent is learning the hard way! 😏"
  ];

  getGreeting(): string {
    return this.getRandomFrom(this.greetings);
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
      return `${comment} ${move.notation} - that's how it's done!`;
    } else {
      const comment = this.getRandomFrom(this.opponentMoveComments);
      return `${comment} ${move.notation} - your turn to respond!`;
    }
  }

  getGameStartMessage(stakes: number): string {
    const message = this.getRandomFrom(this.gameStartMessages);
    return stakes > 0 ? `${message} And I see we've got ${stakes} MAG on the line!` : message;
  }

  getStakesChangeMessage(stakes: number): string {
    const message = this.getRandomFrom(this.stakesChangeMessages);
    return stakes > 0 ? `${message} Current pot: ${stakes} MAG!` : message;
  }

  getEncouragementMessage(moveCount: number): string {
    const message = this.getRandomFrom(this.encouragementMessages);
    return `${message} We're ${moveCount} moves in and the action is just getting started!`;
  }

  getGameOverMessage(result: string): string {
    const message = this.getRandomFrom(this.gameOverMessages);
    return `${message} ${result}`;
  }

  getBetSuggestion(amount: number): string {
    const template = this.getRandomFrom(this.betSuggestions);
    return template.replace('{amount}', amount.toString());
  }

  getResponseToUserInput(userInput: string, gameState: GameState): string {
    const input = userInput.toLowerCase();
    
    if (input.includes('bet') || input.includes('wager') || input.includes('stake')) {
      return this.getRandomFrom(this.userResponses.bet);
    }
    
    if (input.includes('win') || input.includes('victory') || input.includes('success')) {
      return this.getRandomFrom(this.userResponses.win);
    }
    
    if (input.includes('lose') || input.includes('loss') || input.includes('defeat')) {
      return this.getRandomFrom(this.userResponses.lose);
    }
    
    return this.getRandomFrom(this.userResponses.default);
  }

  getLoginWarning(): string {
    return this.getRandomFrom(this.loginWarningMessages);
  }

  private getRandomFrom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

export const gamblerPersonality = new GamblerPersonality(); 