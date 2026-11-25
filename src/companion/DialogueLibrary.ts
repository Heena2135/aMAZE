export const dialogue = {
  ready: ['Human detected. Experiment ready!', 'Chamber stable. Shall we test human navigation?'],
  playing: ['I’ll watch from here. You take the lead.', 'That way, question? Let us find out.'],
  paused: ['Experiment paused. Instruments standing by.'],
  collision: ['Solid rock. Human cannot pass.', 'Wall contact confirmed. Another route, question?'],
  repeated: ['Same wall again. Vey admires persistence. Try another direction, question?'],
  unexpected: ['Interesting. Prediction incorrect.'],
  hint: ['One tile marked. The remaining decisions are yours.'],
  efficient: ['Human following the shortest route so far. Excellent!'],
  improved: ['You took a more direct route than last time. Excellent!'],
  won: ['Amaze! Amaze! Amaze!'],
} as const

export type DialogueSignal = keyof typeof dialogue
