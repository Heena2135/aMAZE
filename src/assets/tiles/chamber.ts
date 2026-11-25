export const TILE = 24

export const chamberPalettes = [
  { frame: '#404a55', wall: '#2e3b49', shadow: '#182330', floor: '#626174', seam: '#474858', signal: '#ffbd73' },
  { frame: '#414d62', wall: '#2b394d', shadow: '#192436', floor: '#586675', seam: '#3f505e', signal: '#85cbd7' },
  { frame: '#4f4064', wall: '#392f50', shadow: '#241b37', floor: '#697082', seam: '#4c5069', signal: '#c2a6ef' },
  { frame: '#624957', wall: '#453344', shadow: '#2c2235', floor: '#76626d', seam: '#554554', signal: '#f2977e' },
  { frame: '#515365', wall: '#35394b', shadow: '#222639', floor: '#696879', seam: '#4d4a61', signal: '#ffe1a5' },
]

export function paintTile(ctx: CanvasRenderingContext2D, x: number, y: number, wall: boolean, stage: number, southOpen: boolean) {
  const palette = chamberPalettes[stage] ?? chamberPalettes[0]
  const left = x * TILE
  const top = y * TILE
  const variation = (x * 17 + y * 31 + stage * 7) % 11
  function block(dx: number, dy: number, width: number, height: number, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(left + dx, top + dy, width, height)
  }

  if (wall) {
    block(0, 0, 24, 24, palette.shadow)
    block(0, 0, 23, southOpen ? 18 : 22, palette.wall)
    block(1, 1, 22, 1, palette.frame)
    block(1, 2, 1, 15, palette.frame)
    block(2, 4, 1, 1, '#858098')
    block(20, 4, 1, 1, '#858098')
    if (variation < 4) {
      for (let i = 0; i < 4; i++) block(6, 6 + i * 2, 12, 1, palette.shadow)
    } else {
      block(6, 7, 12, 6, palette.shadow)
      block(7, 8, 9, 4, palette.frame)
      block(8 + variation % 3, 9, 4, 1, palette.signal)
    }
    if (southOpen) {
      block(0, 18, 24, 2, palette.frame)
      block(3, 20, 18, 1, palette.wall)
    }
    return
  }

  block(0, 0, 24, 24, palette.seam)
  block(1, 1, 22, 22, palette.floor)
  block(2, 2, 20, 1, '#88859a')
  block(3, 21, 18, 1, palette.seam)
  for (let i = 0; i < 6; i++) {
    block(3 + (i * 7 + variation) % 18, 4 + (i * 5 + variation) % 15, 1, 1, '#8c849650')
  }
  for (const bolt of [3, 19]) block(bolt, 4, 1, 1, '#bbb4ba')
  if (variation < 3) {
    block(9, 9, 6, 5, palette.seam)
    block(10, 10, 4, 1, palette.frame)
    block(10, 12, 4, 1, palette.frame)
  } else if (variation > 7) {
    block(3, 17, 8, 1, '#dbc0a140')
    block(3, 17, 3, 1, variation === 10 ? '#c8b0f2' : palette.signal)
  }
}
