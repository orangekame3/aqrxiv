'use client'

import { useEffect, useRef, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'

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
  const canvasRef = useRef<HTMLDivElement>(null)
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateQR()
  }, [data, size, margin, format, style, centerLabel, caption])

  const generateQR = async () => {
    try {
      console.log('generateQR called with:', { data, size, margin, format, style, centerLabel, caption })
      setIsLoading(true)
      setError(null)

      // Clear previous QR codes
      if (canvasRef.current) {
        canvasRef.current.innerHTML = ''
      }

      // Create QR code instance
      const qrCodeInstance = new QRCodeStyling({
        width: size,
        height: size,
        data: data,
        margin: margin,
        qrOptions: {
          errorCorrectionLevel: 'Q'
        },
        dotsOptions: {
          color: style === 'arxiv' ? '#b31b1b' : '#000000',
          type: 'dots'
        },
        cornersSquareOptions: {
          color: style === 'arxiv' ? '#b31b1b' : '#000000',
          type: 'extra-rounded'
        },
        cornersDotOptions: {
          color: style === 'arxiv' ? '#b31b1b' : '#000000',
          type: 'dot'
        },
        backgroundOptions: {
          color: '#ffffff'
        }
      })

      // Add center label if needed
      if (centerLabel !== 'none') {
        // Extract ID from URL for the label
        const parsed = new URL(data)
        const pathParts = parsed.pathname.split('/')
        const id = pathParts[pathParts.length - 1].replace('.pdf', '')
        
        const labelSize = size * 0.5
        const fontSize = Math.max(12, labelSize * 0.2)
        
        const labelSvg = `
          <svg width="${labelSize}" height="${labelSize}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white" rx="${labelSize * 0.15}" stroke="#e5e7eb" stroke-width="1"/>
            <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" 
                  font-family="system-ui, -apple-system, sans-serif" 
                  font-size="${fontSize}" 
                  font-weight="500" 
                  fill="#b31b1b">
              arXiv:
            </text>
            <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" 
                  font-family="system-ui, -apple-system, sans-serif" 
                  font-size="${fontSize * 0.8}" 
                  font-weight="400" 
                  fill="#b31b1b">
              ${id}
            </text>
          </svg>
        `
        
        const labelDataUrl = `data:image/svg+xml;base64,${btoa(labelSvg)}`
        qrCodeInstance.update({
          image: labelDataUrl,
          imageOptions: {
            hideBackgroundDots: true,
            imageSize: 0.5,
            margin: 2,
            crossOrigin: 'anonymous'
          }
        })
      }

      // Append QR code directly to canvas ref
      if (canvasRef.current) {
        await qrCodeInstance.append(canvasRef.current)
      }
      
      setQrCode(qrCodeInstance)
      console.log('QR code generated successfully')
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
    
    const filename = `arxiv-qr-${id}-${mode}`
    
    try {
      if (format === 'svg') {
        qrCode.download({ name: filename, extension: 'svg' })
      } else {
        qrCode.download({ name: filename, extension: 'png' })
      }
      onDownload?.(`${filename}.${format}`)
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
        <div ref={canvasRef} />
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