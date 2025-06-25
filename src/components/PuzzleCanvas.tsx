'use client'

import React, { useRef, useEffect, useState } from 'react'

const ROWS = 25
const COLS = 40
const SNAP_THRESHOLD = 20 // Tolerance for snapping (pixels)

type Piece = {
  sx: number
  sy: number
  x: number
  y: number
  width: number
  height: number
}

export default function PuzzleCanvas({ imageSrc }: { imageSrc: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const scaleRef = useRef(1)

  useEffect(() => {
    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      setImage(img)

      const screenWidth = window.innerWidth
      const scale = screenWidth / img.width
      scaleRef.current = scale

      const width = img.width * scale
      const height = img.height * scale
      setCanvasSize({ width, height })

      initializePieces(img)
    }
  }, [imageSrc])

  const initializePieces = (img: HTMLImageElement) => {
    const pieceWidth = img.width / COLS
    const pieceHeight = img.height / ROWS

    const newPieces: Piece[] = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        newPieces.push({
          sx: col * pieceWidth,
          sy: row * pieceHeight,
          x: Math.random() * (img.width - pieceWidth),
          y: Math.random() * (img.height - pieceHeight),
          width: pieceWidth,
          height: pieceHeight,
        })
      }
    }
    setPieces(newPieces)
  }

  const draw = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach((p) => {
      ctx.drawImage(
        image,
        p.sx,
        p.sy,
        p.width,
        p.height,
        p.x * scaleRef.current,
        p.y * scaleRef.current,
        p.width * scaleRef.current,
        p.height * scaleRef.current
      )
    })
  }

  useEffect(() => {
    draw()
  }, [pieces, canvasSize, image])

  const getPieceAt = (x: number, y: number) => {
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i]
      const scaledX = p.x * scaleRef.current
      const scaledY = p.y * scaleRef.current
      const scaledW = p.width * scaleRef.current
      const scaledH = p.height * scaleRef.current

      if (x >= scaledX && x <= scaledX + scaledW && y >= scaledY && y <= scaledY + scaledH) {
        return i
      }
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const index = getPieceAt(x, y)
    if (index !== null) {
      setDraggedIndex(index)
      const piece = pieces[index]
      offsetRef.current = {
        x: x / scaleRef.current - piece.x,
        y: y / scaleRef.current - piece.y,
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedIndex === null) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newPieces = [...pieces]
    const piece = { ...newPieces[draggedIndex] }
    piece.x = x / scaleRef.current - offsetRef.current.x
    piece.y = y / scaleRef.current - offsetRef.current.y
    newPieces[draggedIndex] = piece
    setPieces(newPieces)
  }

  const handleMouseUp = () => {
    if (draggedIndex === null) return
    const piece = pieces[draggedIndex]

    // Snap to correct position if close enough
    const correctX = piece.sx / scaleRef.current
    const correctY = piece.sy / scaleRef.current

    const distance = Math.sqrt(
      Math.pow(piece.x - correctX, 2) + Math.pow(piece.y - correctY, 2)
    )

    if (distance < SNAP_THRESHOLD) {
      // Snap the piece into place
      const newPieces = [...pieces]
      newPieces[draggedIndex] = { ...piece, x: correctX, y: correctY }
      setPieces(newPieces)
    }

    setDraggedIndex(null)
  }

  const fixPuzzle = () => {
    if (!image) return
    const pieceWidth = image.width / COLS
    const pieceHeight = image.height / ROWS

    const solvedPieces: Piece[] = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        solvedPieces.push({
          sx: col * pieceWidth,
          sy: row * pieceHeight,
          x: col * pieceWidth,
          y: row * pieceHeight,
          width: pieceWidth,
          height: pieceHeight,
        })
      }
    }
    setPieces(solvedPieces)
  }

  const messUpPuzzle = () => {
    if (image) initializePieces(image)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomAmount = e.deltaY < 0 ? 0.1 : -0.1
    const newScale = Math.max(0.5, Math.min(2, scaleRef.current + zoomAmount))
    scaleRef.current = newScale

    // Update the canvas size based on the scale
    const canvas = canvasRef.current
    if (canvas && image) {
      const width = image.width * newScale
      const height = image.height * newScale
      setCanvasSize({ width, height })
    }
  }

  return (
    <div className="w-screen overflow-x-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel} // Add the wheel listener for zoom
        className="border mx-auto block touch-none"
      />
      <div className="flex justify-center gap-4 mt-4 mb-8">
        <button
          onClick={fixPuzzle}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          🧩 Fix Puzzle
        </button>
        <button
          onClick={messUpPuzzle}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          💥 Mess It Up
        </button>
      </div>
    </div>
  )
}
