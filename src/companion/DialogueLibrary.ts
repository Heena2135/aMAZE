export const dialogue = {
  ready: ['Human detected. Experiment ready!', 'Chamber stable. Shall we test human navigation?'],
  playing: ['Human navigation patterns detected.', 'Recording your route. Proceed when ready.'],
  paused: ['Experiment paused. Instruments standing by.'],
  collision: ['Solid rock. Human cannot pass.', 'Wall contact confirmed. Another route, question?'],
  repeated: ['Pattern observed. Try a different direction?'],
  unexpected: ['Interesting. Prediction incorrect.'],
  hint: ['One tile marked. The remaining decisions are yours.'],
  improved: ['Previous route efficiency exceeded. Human adapting. Excellent!'],
  won: ['Amaze! Amaze! Amaze!'],
} as const

export type DialogueSignal = keyof typeof dialogue
