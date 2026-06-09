// Original study-motivation lines (no copyright / no attribution issues).
// Expand this list toward 365 anytime — the daily picker just cycles through them.
export const QUOTES = [
  "Every question you review today is one you won't fear in the exam hall.",
  "Slow progress is still progress. Show up again tomorrow.",
  "You don't have to know everything — just a little more than yesterday.",
  "The doctor you're becoming is built one revision session at a time.",
  "Rest is part of the plan, not a break from it.",
  "Hard topics feel impossible until the day they suddenly click.",
  "Your future patients are worth the page you don't feel like reading tonight.",
  "Consistency beats intensity. Small daily reps win.",
  "Confusion is the feeling of learning happening. Stay with it.",
  "You've passed hard exams before. This is just the next one.",
  "Done is better than perfect. Finish the question, then refine.",
  "The night before means little; the months before mean everything.",
  "Trust the hours you've already put in.",
  "A question wrong today is a mark saved tomorrow.",
  "Breathe. You are more prepared than your anxiety claims.",
  "Studying tired still counts. Be proud of the effort, not just the mood.",
  "One more topic. Then rest. That's the whole secret.",
  "You are allowed to find this hard and still be good at it.",
  "Momentum is built, not found. Start the first question.",
  "The exam tests preparation, not perfection.",
  "Comparison steals focus. Run your own race today.",
  "Every expert was once exactly where you are now.",
  "Your worth is not your score — but your effort still matters.",
  "Review the mistake, not the shame. The mistake is the lesson.",
  "Tired hands have written many pass letters. Keep going.",
  "Five focused minutes beat an hour of guilt about not starting.",
  "You're not behind. You're on your own timeline.",
  "The hardest part of studying is sitting down. You've done that.",
  "Knowledge compounds. Today's page pays interest in the exam.",
  "Be the colleague your future team can rely on. Start now.",
  "Progress isn't always visible, but it's always happening.",
  "Doubt is loud. Discipline is quiet. Choose the quiet one.",
  "You can do hard things — your training already proves it.",
  "Make peace with imperfect revision. It still moves you forward.",
  "The goal isn't to feel ready. It's to be ready. Keep building.",
  "Small wins stack into big results. Bank one today.",
  "Your effort tonight is a gift to your future self.",
  "Keep your eyes on the next question, not the whole mountain.",
  "Showing up on the low-motivation days is what separates you.",
  "One day, this exam will be a story you tell. Write a good one.",
];

// Deterministic daily pick: same quote for everyone on a given calendar day.
export function quoteOfTheDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const idx = dayOfYear % QUOTES.length;
  return { id: idx, text: QUOTES[idx] };
}
