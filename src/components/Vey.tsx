import type { CSSProperties } from 'react'
import './Vey.css'

export type VeyExpression = 'idle' | 'curious' | 'thinking' | 'excited' | 'concerned' | 'celebrating'

const signalColors: Record<VeyExpression, string> = {
  idle: '#B9A5E8',
  curious: '#B9A5E8',
  thinking: '#8FAAC8',
  excited: '#FFC66D',
  concerned: '#D7A38C',
  celebrating: '#EEDC98',
}

interface Props {
  expression: VeyExpression
  dialogue?: string
  dialogueDuration?: number
  className?: string
}

export function Vey({ expression, dialogue, dialogueDuration, className = '' }: Props) {
  const color = signalColors[expression]
  const beats = dialogue && dialogueDuration ? dialogueDuration / 520 : dialogue ? Math.min(12, Math.max(3, Math.ceil(dialogue.trim().split(/\s+/).length / 2))) : 0
  const speechStyle = { '--speech-beats': beats, '--speech-time': `${beats * 520}ms` } as CSSProperties
  const celebrating = expression === 'celebrating'

  return (
    <svg className={`vey ${className}`} data-expression={expression} viewBox="0 0 100 100"
      aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="86" rx="33" ry="6" fill="#777" opacity=".15" />
      <g className="vey-posture">
        <g stroke="#8E7966" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path className="vey-limb vey-left-arm" d={celebrating ? 'M32 49 L16 34 L9 14' : 'M32 49 L15 60 L9 77'} />
          <path className="vey-limb vey-right-arm" d={celebrating ? 'M68 49 L84 34 L91 14' : 'M68 49 L85 60 L91 77'} />
          <path className="vey-limb vey-left-leg" d="M37 64 L27 76 L20 85" />
          <path className="vey-limb vey-right-leg" d="M63 64 L73 76 L80 85" />
          <path className="vey-limb vey-center-leg" d="M50 65 L50 87" />
        </g>
        <g>
          <path d="M25 38 L37 22 L58 18 L77 35 L79 56 L65 72 L39 73 L21 56 Z" fill="#A18C75" stroke="#69594D" strokeWidth="2" />
          <path d="M25 38 L47 35 L37 22 L58 18 L65 37 L77 35 L79 56 L58 51 L65 72 L39 73 L43 54 L21 56 Z" fill="#C3AE92" />
          <path d="M37 22 L47 35 L43 54 L58 51 L65 37 L77 35 M43 54 L39 73 M58 51 L65 72" fill="none" stroke="#786554" strokeWidth="2" />
          <g key={dialogue ?? ''} className="vey-signal" data-speaking={beats > 0} style={speechStyle}>
            <path d="M47 35 L43 54 L58 51 L65 37" fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />
            <circle cx="53" cy="44" r="8" fill={color} opacity=".2" />
            <circle cx="53" cy="44" r="3" fill={color} />
          </g>
        </g>
      </g>
      {celebrating && <g className="vey-sparkles" stroke="#FFC66D" strokeWidth="2">
        <path d="M13 20h8 M17 16v8" />
        <path d="M79 23h8 M83 19v8" />
        <path d="M46 7h8 M50 3v8" />
      </g>}
    </svg>
  )
}
