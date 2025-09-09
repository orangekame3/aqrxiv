'use client'

import { useEffect, useRef, useState } from 'react'
import { generatePlainQR, generateStyledQR, createCenterLabel, createQRWithCaption, downloadQR } from '@/lib/qr'

interface QRPreviewProps {
  data: string
  size: number
  margin: number
  format: 'png' | 'svg'
  style: 'plain' | 'arxiv'
  centerLabel: 'none' | 'preprint' | 'arxiv'
  caption: string
  onDownload?: (filename: string) => void
}

export default function QRPreview({
  data,
  size,
  margin,
  format,
  style,
  centerLabel,
  caption,
  onDownload
}: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgRef = useRef<HTMLDivElement>(null)
  const [qrCode, setQrCode] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateQR()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, size, margin, format, style, centerLabel, caption])

  const generateQR = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Clear previous QR codes
      if (svgRef.current) {
        svgRef.current.innerHTML = ''
      }

      // Use styled QR for all non-plain styles or SVG format
      if (style !== 'plain' || format === 'svg') {
        const styledQR = generateStyledQR({
          data,
          size,
          margin,
          fmt: format,
          style,
          centerLabel
        })

        if (centerLabel !== 'none') {
          const centerLabelImage = createCenterLabel(centerLabel, size)
          styledQR.update({
            image: centerLabelImage
          })
        }

        // For now, just use the original QR without caption
        if (svgRef.current) {
          await styledQR.append(svgRef.current)
        }
        setQrCode(styledQR)
      } else {
        // Use plain QR only for plain style with PNG format
        const qrString = await generatePlainQR({
          data,
          size,
          margin,
          fmt: format,
          style,
          centerLabel,
          caption
        })

        const img = new Image()
        img.onload = () => {
          if (canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
              canvas.width = size
              canvas.height = size
              ctx.drawImage(img, 0, 0, size, size)
              
              if (centerLabel !== 'none') {
                const labelImg = new Image()
                const centerLabelImage = createCenterLabel(centerLabel, size)
                labelImg.onload = () => {
                  const labelSize = size * 0.25
                  const x = (size - labelSize) / 2
                  const y = (size - labelSize) / 2
                  ctx.drawImage(labelImg, x, y, labelSize, labelSize)
                }
                labelImg.src = centerLabelImage
              }
            }
          }
        }
        img.src = qrString
        
        setQrCode(qrString)
      }
    } catch (err) {
      console.error('Error generating QR code:', err)
      setError('Failed to generate QR code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!qrCode) return

    const parsed = new URL(data)
    const pathParts = parsed.pathname.split('/')
    const id = pathParts[pathParts.length - 1].replace('.pdf', '')
    const mode = parsed.pathname.includes('/pdf/') ? 'pdf' : 
                parsed.pathname.includes('/abs/') ? 'abs' : 'doi'
    
    const filename = `arxiv-qr-${id}-${mode}.${format}`
    
    try {
      if (typeof qrCode === 'string') {
        // If qrCode is a string (data URL), handle it directly
        const link = document.createElement('a')
        link.download = filename
        link.href = qrCode
        link.click()
      } else {
        // If qrCode is a QRCodeStyling instance, use the original download method
        await downloadQR(qrCode, filename, format)
      }
      onDownload?.(filename)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Generating QR code...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>{error}</p>
        <button 
          onClick={generateQR}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="inline-block p-4 bg-gray-50 rounded-lg mb-4">
        <div 
          ref={svgRef}
          className="flex items-center justify-center"
          style={{ 
            minWidth: size, 
            minHeight: caption ? size + 40 : size 
          }}
        />
        <canvas
          ref={canvasRef}
          className={`max-w-full h-auto ${style !== 'plain' || format === 'svg' ? 'hidden' : ''}`}
          style={{ width: size, height: size }}
        />
      </div>

      <button
        onClick={handleDownload}
        disabled={!qrCode}
        className="px-6 py-3 bg-preprint-red text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Download {format.toUpperCase()}
      </button>
    </div>
  )
}