'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { parseIdOrUrl, buildUrl, buildShareUrl, parseShareUrl, type LinkMode } from '@/lib/arxiv'
import QRPreview from './QRPreview'

export default function HomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [input, setInput] = useState('')
  const [mode, setMode] = useState<LinkMode>('abs')
  const [format, setFormat] = useState<'png' | 'svg'>('png')
  const [size, setSize] = useState(512)
  const [margin, setMargin] = useState(4)
  const [style, setStyle] = useState<'plain' | 'arxiv'>('arxiv')
  const [centerLabel, setCenterLabel] = useState<'none' | 'preprint' | 'arxiv'>('none')
  const [caption, setCaption] = useState('')
  const [qrData, setQrData] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    const params = parseShareUrl(searchParams)
    
    if (params.id) {
      setInput(params.id)
      setMode(params.mode || 'abs')
      setFormat(params.fmt || 'png')
      setSize(params.size || 512)
      setMargin(params.margin || 4)
      setStyle(params.style || 'plain')
      setCenterLabel(params.centerLabel || 'preprint')
      setCaption(params.caption || `arXiv:${params.id}`)
      
      const url = buildUrl(params.id, params.mode || 'abs')
      setQrData(url)
    }
  }, [searchParams])

  const handleGenerate = () => {
    if (!input.trim()) {
      setStatus('Enter a valid arXiv ID or URL')
      return
    }

    const parsed = parseIdOrUrl(input)
    if (!parsed) {
      setStatus('Enter a valid arXiv ID or URL')
      return
    }

    const url = buildUrl(parsed.id, mode)
    const defaultCaption = caption || `arXiv:${parsed.id}`
    
    setQrData(url)
    setCaption(defaultCaption)
    setStatus('')

    const shareParams = {
      id: parsed.id,
      mode,
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
            Example: 2501.01234 or https://arxiv.org/abs/2501.01234
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

        {showOptions && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">Link Type</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as LinkMode)}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                >
                  <option value="abs">Abstract</option>
                  <option value="pdf">PDF</option>
                  <option value="doi">DOI</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'svg')}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                >
                  <option value="png">PNG</option>
                  <option value="svg">SVG</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                >
                  <option value={256}>256px</option>
                  <option value={512}>512px</option>
                  <option value={768}>768px</option>
                  <option value={1024}>1024px</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as 'plain' | 'arxiv')}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                >
                  <option value="plain">Plain</option>
                  <option value="arxiv">arXiv</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {qrData && (
          <div className="mt-8 text-center">
            <QRPreview
              data={qrData}
              size={Math.min(size, 300)}
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

            <div className="mt-4 space-y-2">
              <button
                onClick={copyShareableUrl}
                className="w-full px-4 py-2 text-preprint-red border border-preprint-red rounded-lg hover:bg-preprint-red hover:text-white transition-colors text-sm"
              >
                Copy Sharable URL
              </button>
              
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                {showOptions ? 'Hide' : 'Show'} Options
              </button>
            </div>
          </div>
        )}

        {!qrData && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              {showOptions ? 'Hide' : 'Show'} Options
            </button>
          </div>
        )}
      </div>
    </div>
  )
}