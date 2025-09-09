'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { parseIdOrUrl, buildUrl, buildShareUrl, parseShareUrl, type LinkMode } from '@/lib/arxiv'
import QRPreview from './QRPreview'

export default function HomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [input, setInput] = useState('')
  const mode: LinkMode = 'abs'
  const [format, setFormat] = useState<'png' | 'svg'>('png')
  const [size, setSize] = useState(1024)
  const [margin, setMargin] = useState(4)
  const [style, setStyle] = useState<'plain' | 'arxiv'>('arxiv')
  const [centerLabel, setCenterLabel] = useState<'none' | 'preprint' | 'arxiv'>('arxiv')
  const [caption, setCaption] = useState('')
  const [qrData, setQrData] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const params = parseShareUrl(searchParams)
    
    if (params.id) {
      setInput(params.id)
      setFormat(params.fmt || 'png')
      setSize(params.size || 512)
      setMargin(params.margin || 4)
      setStyle(params.style || 'plain')
      setCenterLabel(params.centerLabel || 'arxiv')
      setCaption(params.caption || `arXiv:${params.id}`)
      
      const url = buildUrl(params.id, 'abs')
      setQrData(url)
      console.log('URL params loaded:', { url, caption: params.caption || `arXiv:${params.id}` })
    }
  }, [searchParams])

  useEffect(() => {
    if (qrData) {
      console.log('QRData changed:', { qrData, size: Math.min(size, 300), margin, format, style, centerLabel, caption })
    }
  }, [qrData, size, margin, format, style, centerLabel, caption])

  const handleGenerate = () => {
    console.log('handleGenerate called with input:', input)
    if (!input.trim()) {
      setStatus('Enter a valid arXiv ID or URL')
      return
    }

    const parsed = parseIdOrUrl(input)
    console.log('Parsed input:', parsed)
    if (!parsed) {
      setStatus('Enter a valid arXiv ID or URL')
      return
    }

    const url = buildUrl(parsed.id, 'abs')
    const defaultCaption = caption || `arXiv:${parsed.id}`
    
    console.log('Generated URL:', url)
    console.log('Caption:', defaultCaption)
    
    setQrData(url)
    setCaption(defaultCaption)
    setStatus('')

    const shareParams = {
      id: parsed.id,
      mode: 'abs' as const,
      fmt: format,
      size,
      margin,
      style,
      centerLabel,
      caption: defaultCaption
    }

    const shareUrl = buildShareUrl(shareParams)
    router.replace(shareUrl, { scroll: false })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerate()
    }
  }

  const copyShareableUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setStatus('Sharable URL copied to clipboard!')
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('Failed to copy URL')
      setTimeout(() => setStatus(''), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-light text-preprint-red mb-2">aqrxiv</h1>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter arXiv ID or URL"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-preprint-red focus:border-transparent text-lg"
            aria-label="arXiv ID or URL input"
          />
          
          <p className="text-sm text-gray-500 text-center">
            Example: 2507.23165 or https://arxiv.org/abs/2507.23165
          </p>

          <button
            onClick={handleGenerate}
            className="w-full bg-preprint-red text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Generate
          </button>

          {status && (
            <div 
              className={`text-center p-3 rounded-lg text-sm ${
                status.includes('copied') || status.includes('generated') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}
              aria-live="polite"
            >
              {status}
            </div>
          )}
        </div>


        {qrData && (
          <div className="mt-8 text-center">
            <QRPreview
              data={qrData}
              size={Math.min(size, 400)}
              margin={margin}
              format={format}
              style={style}
              centerLabel={centerLabel}
              caption={caption}
              onDownload={(filename) => {
                setStatus(`Downloaded ${filename}`)
                setTimeout(() => setStatus(''), 2000)
              }}
            />

            <div className="mt-4">
              <button
                onClick={copyShareableUrl}
                className="w-full px-4 py-2 text-preprint-red border border-preprint-red rounded-lg hover:bg-preprint-red hover:text-white transition-colors text-sm"
              >
                Copy Sharable URL
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}