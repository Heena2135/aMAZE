import { dialogue } from './DialogueLibrary.ts'
import type { DialogueSignal } from './DialogueLibrary'

export class DialogueEngine {
  private lastAt = -Infinity
  private lastSignal: DialogueSignal = 'ready'
  private cursor = 0
  get signal() { return this.lastSignal }

  public message: string = dialogue.ready[0]

  react(signal: DialogueSignal, now: number): void {
    const priority = signal === 'ready' || signal === 'paused' || signal === 'won' || signal === 'improved'
    if (signal === 'playing' && signal === this.lastSignal) return
    if (!priority && now - this.lastAt < 1800 && this.lastSignal !== 'ready' && this.lastSignal !== 'paused') {
      return
    }
    const lines = dialogue[signal]
    this.message = lines[this.cursor++ % lines.length]
    this.lastAt = now
    this.lastSignal = signal
  }
}
