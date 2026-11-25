import { useEffect, useRef } from 'react'
import { art } from '../assets/registry'
import { chamberPalettes, paintTile, TILE } from '../assets/tiles/chamber'
import type { Direction } from '../types/Direction'
import type { GameSnapshot } from '../types/GameSnapshot'
import type { Position } from '../types/Position'

interface Props {
  snapshot: GameSnapshot
  layout: GameSnapshot['grid']
  hintCell?: Position
  facing: Direction
  stage: number
  reducedMotion: boolean
}

const WALK_MS = 145
const AIRLOCK_MS = 550
const CELEBRATION_MS = 750
const LIGHT_PHASE_MS = 380
const FRAME_INTERVAL_MS = 48

const spriteRow: Record<Direction, number> = { down: 0, right: 1, left: 2, up: 3 }

export function MazeCanvas({ snapshot, layout, hintCell, facing, stage, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sprite = useRef<HTMLImageElement | null>(null)
  const tiles = useRef<HTMLCanvasElement | null>(null)
  const previous = useRef<Position | undefined>(undefined)
  const { playerPosition: { x: playerX, y: playerY }, exitPosition: { x: exitX, y: exitY }, status } = snapshot
  const hintX = hintCell?.x
  const hintY = hintCell?.y
  const rows = layout.length
  const columns = layout[0].length

  useEffect(() => {
    const image = new Image()
    image.src = art.astronaut
    sprite.current = image
  }, [])

  useEffect(() => {
    const backdrop = document.createElement('canvas')
    backdrop.width = columns * TILE
    backdrop.height = rows * TILE
    const context = backdrop.getContext('2d')
    if (!context) return
    layout.forEach((row, y) => row.forEach((cell, x) =>
      paintTile(context, x, y, cell === 1, stage, layout[y + 1]?.[x] === 0),
    ))
    tiles.current = backdrop
  }, [layout, columns, rows, stage])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const backdrop = tiles.current
    if (!canvas || !context || !backdrop) return

    const layer = document.createElement('canvas')
    layer.width = columns * TILE
    layer.height = rows * TILE
    const pixels = layer.getContext('2d')
    if (!pixels) return
    const playerPosition = { x: playerX, y: playerY }
    const last = previous.current
    previous.current = playerPosition
    const adjacent = last && Math.abs(last.x - playerPosition.x) + Math.abs(last.y - playerPosition.y) === 1
    const origin = adjacent && (status === 'playing' || status === 'won') ? last : playerPosition
    const beginning = performance.now()
    const prefs = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lastFrame = 0
    let frameId = 0
    let bounds = canvas.getBoundingClientRect()

    function draw(now = performance.now()) {
      if (!canvas || !context || !pixels || !backdrop) return
      const { width, height } = bounds
      if (!width || !height) return
      const ratio = window.devicePixelRatio || 1
      const pixelWidth = Math.round(width * ratio)
      const pixelHeight = Math.round(height * ratio)
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight
      const still = reducedMotion || prefs.matches
      const elapsed = now - beginning
      const walk = still ? 1 : Math.min(1, elapsed / WALK_MS)
      const phase = still ? 0 : Math.floor(now / LIGHT_PHASE_MS) % 2
      pixels.drawImage(backdrop, 0, 0)

      if (hintX !== undefined && hintY !== undefined) {
        pixels.strokeStyle = '#ffda94'
        pixels.strokeRect(hintX * TILE + 2.5, hintY * TILE + 2.5, 19, 19)
        pixels.fillStyle = '#ffda9450'
        pixels.fillRect(hintX * TILE + 3, hintY * TILE + 3, 18, 18)
      }

      const x = exitX * TILE
      const y = exitY * TILE
      const open = status === 'won' ? (still ? 1 : Math.min(1, elapsed / AIRLOCK_MS)) : 0
      pixels.fillStyle = '#242433'
      pixels.fillRect(x + 1, y + 3, 22, 19)
      pixels.fillStyle = chamberPalettes[stage].signal
      pixels.fillRect(x + 2, y + 3, 20, 2)
      pixels.fillRect(x + 3, y + 5, 2, 14)
      pixels.fillRect(x + 19, y + 5, 2, 14)
      pixels.fillStyle = phase || open ? '#ffda94' : '#d39857'
      pixels.fillRect(x + 5, y + 7, 14, 12)
      pixels.fillStyle = '#68506b'
      const door = Math.round(7 * (1 - open))
      pixels.fillRect(x + 5, y + 7, door, 11)
      pixels.fillRect(x + 19 - door, y + 7, door, 11)
      pixels.fillStyle = '#ffda94'
      pixels.fillRect(x + 9, y + 20, 6, 1)

      const px = Math.round((origin.x + (playerPosition.x - origin.x) * walk) * TILE)
      const py = Math.round((origin.y + (playerPosition.y - origin.y) * walk) * TILE)
      const image = sprite.current
      if (image?.complete && image.naturalWidth) {
        const frame = origin !== playerPosition && walk < 1 ? 1 + Math.floor(walk * 3) : 0
        pixels.drawImage(image, frame * TILE, spriteRow[facing] * TILE, TILE, TILE, px, py - phase, TILE, TILE)
      } else {
        pixels.fillStyle = '#f2e3c4'
        pixels.fillRect(px + 6, py + 4, 12, 16)
      }
      context.imageSmoothingEnabled = false
      context.clearRect(0, 0, pixelWidth, pixelHeight)
      context.drawImage(layer, 0, 0, pixelWidth, pixelHeight)
    }

    function tick(now: number) {
      if (now - lastFrame > FRAME_INTERVAL_MS) {
        draw(now)
        lastFrame = now
      }
      if (status === 'playing' || (status === 'won' && now - beginning < CELEBRATION_MS)) {
        frameId = requestAnimationFrame(tick)
      }
    }

    draw()
    if (!reducedMotion && !prefs.matches && (status === 'playing' || status === 'won')) {
      frameId = requestAnimationFrame(tick)
    }
    const resize = () => {
      if (!canvas) return
      bounds = canvas.getBoundingClientRect()
      draw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    window.addEventListener('resize', resize)
    sprite.current?.addEventListener('load', resize)
    function motionChanged() {
      cancelAnimationFrame(frameId)
      draw()
      if (!reducedMotion && !prefs.matches && status === 'playing') frameId = requestAnimationFrame(tick)
    }
    prefs.addEventListener('change', motionChanged)
    const image = sprite.current
    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      prefs.removeEventListener('change', motionChanged)
      image?.removeEventListener('load', resize)
    }
  }, [columns, rows, layout, playerX, playerY, exitX, exitY, status, hintX, hintY, facing, stage, reducedMotion])

  return (
    <canvas ref={canvasRef} className="maze-canvas" role="img"
      style={{ aspectRatio: `${columns} / ${rows}` }}
      aria-label={`Maze. Player at column ${playerX + 1}, row ${playerY + 1}. Exit at column ${exitX + 1}, row ${exitY + 1}.${hintCell ? ` Hint at column ${hintCell.x + 1}, row ${hintCell.y + 1}.` : ''}`}>
      The maze requires Canvas support.
    </canvas>
  )
}
