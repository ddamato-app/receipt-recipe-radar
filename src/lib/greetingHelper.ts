// Helper functions for personalized greetings

export const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
};

export const getGreeting = (): string => {
  const timeOfDay = getTimeOfDay();
  
  const greetings = {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Good evening"
  };
  
  return greetings[timeOfDay as keyof typeof greetings];
};

export const getTimeBasedEmoji = (): string => {
  const timeOfDay = getTimeOfDay();
  
  const emojis = {
    morning: "☀️",
    afternoon: "👋",
    evening: "🌙",
    night: "🌙"
  };
  
  return emojis[timeOfDay as keyof typeof emojis];
};

export const getContextualMessage = (expiringSoon: number): string => {
  if (expiringSoon === 0) {
    return "Let's make sure nothing goes to waste";
  }
  
  if (expiringSoon === 1) {
    return "Let's use that item before it goes bad";
  }
  
  return "Let's make sure nothing goes to waste today";
};

export const getStatusMessage = (totalItems: number, expiringSoon: number, expired: number): string => {
  if (totalItems === 0) {
    return "🏠 Time to stock up your fridge";
  }
  
  if (expired > 0) {
    return `⚠️ ${expired} ${expired === 1 ? 'item has' : 'items have'} expired`;
  }
  
  if (expiringSoon > 0) {
    return `⏰ ${expiringSoon} ${expiringSoon === 1 ? 'item needs' : 'items need'} attention today`;
  }
  
  return "✅ Everything fresh and organized!";
};

export const getMotivationalMessage = (efficiency: number, moneySaved: number, moneyWasted: number): string => {
  const totalSpent = moneySaved + moneyWasted;
  
  if (totalSpent === 0) {
    return "Let's track your food journey together! 💪";
  }
  
  if (efficiency === 0 && moneyWasted > 0) {
    return "Let's turn this around together! 💪";
  }
  
  if (efficiency < 50) {
    return "Small improvements add up! 🌱";
  }
  
  if (efficiency < 80) {
    return "Great progress this month! 🎉";
  }
  
  return "You're crushing it! Keep going! 🌟";
};

export const getHealthScoreMessage = (score: number, consumedCount: number): { title: string; message: string; emoji: string } => {
  if (consumedCount === 0) {
    return {
      title: "Just getting started!",
      message: "Track what you eat to see your health score",
      emoji: "🌱"
    };
  }
  
  if (score < 50) {
    return {
      title: "You're on your way!",
      message: "Add more fruits and veggies to boost your score",
      emoji: "🌱"
    };
  }
  
  if (score < 75) {
    return {
      title: "Looking good!",
      message: "Keep it up! You're eating well",
      emoji: "💪"
    };
  }
  
  return {
    title: "Crushing it!",
    message: "Your fridge is a nutrition powerhouse!",
    emoji: "🌟"
  };
};
