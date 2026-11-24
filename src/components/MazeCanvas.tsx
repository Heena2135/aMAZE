import { useEffect, useRef } from 'react'
import type { Position } from '../types/Position'
import type { GameSnapshot } from '../types/GameSnapshot'

interface MazeCanvasProps {
  snapshot: GameSnapshot
  hintCell?: Position
}

export function MazeCanvas({ snapshot, hintCell }: MazeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { grid, playerPosition, exitPosition } = snapshot
  const rows = grid.length
  const columns = grid[0].length

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    function draw() {
      if (!canvas || !context) return

      const { width, height } = canvas.getBoundingClientRect()
      if (width === 0 || height === 0) return

      const scale = window.devicePixelRatio || 1
      const pixelWidth = Math.round(width * scale)
      const pixelHeight = Math.round(height * scale)
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight

      context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0)
      context.clearRect(0, 0, width, height)
      context.lineWidth = 1

      const cell = Math.min(width / columns, height / rows)
      const offsetX = (width - columns * cell) / 2
      const offsetY = (height - rows * cell) / 2
      context.translate(offsetX, offsetY)

      grid.forEach((row, y) => {
        row.forEach((value, x) => {
          const left = x * cell
          const top = y * cell

          context.fillStyle = value === 1 ? '#292D3E' : '#101522'
          context.fillRect(left, top, cell, cell)
          if (value === 1) {
            context.strokeStyle = '#41465B'
            context.strokeRect(left + 0.5, top + 0.5, cell - 1, cell - 1)
          } else {
            context.fillStyle = '#34394D'
            context.fillRect(left + cell * 0.48, top + cell * 0.48, cell * 0.04, cell * 0.04)
          }
        })
      })

      if (hintCell) {
        context.fillStyle = '#71608E'
        context.fillRect(hintCell.x * cell, hintCell.y * cell, cell, cell)
      }

      context.strokeStyle = '#FFC66D'
      context.lineWidth = cell * 0.05
      context.strokeRect(
        (exitPosition.x + 0.25) * cell,
        (exitPosition.y + 0.25) * cell,
        cell * 0.5,
        cell * 0.5,
      )

      context.beginPath()
      context.arc(
        (playerPosition.x + 0.5) * cell,
        (playerPosition.y + 0.5) * cell,
        cell * 0.23,
        0,
        Math.PI * 2,
      )
      context.fillStyle = '#B9A5E8'
      context.fill()
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    window.addEventListener('resize', draw)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', draw)
    }
  }, [columns, rows, grid, playerPosition, exitPosition, hintCell])

  return (
    <canvas
      ref={canvasRef}
      className="maze-canvas"
      style={{ aspectRatio: `${columns} / ${rows}` }}
      role="img"
      aria-label={`Maze. Player at column ${playerPosition.x + 1}, row ${playerPosition.y + 1}. Exit at column ${exitPosition.x + 1}, row ${exitPosition.y + 1}.${hintCell ? ` Hint at column ${hintCell.x + 1}, row ${hintCell.y + 1}.` : ''}`}
    >
      Your browser needs Canvas support to display the maze.
    </canvas>
  )
}
