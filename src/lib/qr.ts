import QRCode from 'qrcode'
import QRCodeStyling, { Options } from 'qr-code-styling'

export interface QROptions {
  data: string
  size: number
  margin: number
  fmt: 'png' | 'svg'
  style?: 'plain' | 'arxiv'
  centerLabel?: 'none' | 'preprint' | 'arxiv'
  caption?: string
}

export async function generatePlainQR(options: QROptions): Promise<string> {
  const { data, size, margin, fmt, caption = '' } = options
  
  if (!caption) {
    // If no caption, generate normal QR code
    const config = {
      width: size,
      margin: margin,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'Q' as const
    }

    if (fmt === 'svg') {
      return await QRCode.toString(data, { ...config, type: 'svg' })
    } else {
      return await QRCode.toDataURL(data, { ...config, type: 'image/png' })
    }
  }

  // If caption exists, create composite QR code with text
  const textHeight = 40
  const totalHeight = size + textHeight
  const fontSize = Math.max(12, size * 0.024)

  if (fmt === 'svg') {
    const qrSvg = await QRCode.toString(data, { 
      width: size, 
      margin: margin, 
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'Q' as const,
      type: 'svg' 
    })
    
    // Parse the QR SVG to extract the inner content
    const parser = new DOMParser()
    const qrDoc = parser.parseFromString(qrSvg, 'image/svg+xml')
    const qrSvgElement = qrDoc.documentElement
    
    // Create composite SVG
    const compositeSvg = `
      <svg width="${size}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <g transform="translate(0,0)">
          ${qrSvgElement.innerHTML}
        </g>
        <text x="${size / 2}" y="${size + 25}" 
              text-anchor="middle" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="${fontSize}" 
              font-weight="400" 
              fill="#374151">
          ${caption}
        </text>
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(compositeSvg)}`
  } else {
    // For PNG, create composite using canvas
    const qrDataUrl = await QRCode.toDataURL(data, { 
      width: size, 
      margin: margin, 
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'Q' as const,
      type: 'image/png' 
    })
    
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = totalHeight
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Fill background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, size, totalHeight)
        
        // Draw QR code
        ctx.drawImage(img, 0, 0, size, size)
        
        // Add text
        ctx.fillStyle = '#374151'
        ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(caption, size / 2, size + textHeight / 2)
        
        resolve(canvas.toDataURL())
      }
      img.onerror = reject
      img.src = qrDataUrl
    })
  }
}

export function generateStyledQR(options: QROptions): QRCodeStyling {
  const { data, size, margin, style = 'plain', centerLabel = 'none' } = options
  
  let dotsColor = '#000000'
  let backgroundColor = '#FFFFFF'
  
  if (style === 'arxiv') {
    dotsColor = '#b31b1b'  // arXivのテーマカラー（赤系）
  }

  const config: Options = {
    width: size,
    height: size,
    margin: margin,
    data: data,
    dotsOptions: {
      color: dotsColor,
      type: 'dots'
    },
    cornersSquareOptions: {
      color: dotsColor,
      type: 'extra-rounded'
    },
    cornersDotOptions: {
      color: dotsColor,
      type: 'dot'
    },
    backgroundOptions: {
      color: backgroundColor
    },
    qrOptions: {
      errorCorrectionLevel: 'Q'
    }
  }

  if (centerLabel !== 'none') {
    config.imageOptions = {
      hideBackgroundDots: true,
      imageSize: 0.25,
      margin: 4,
      crossOrigin: 'anonymous'
    }
  }

  const qrCode = new QRCodeStyling(config)
  
  return qrCode
}

export function createCenterLabel(label: 'preprint' | 'arxiv', size: number): string {
  const labelSize = size * 0.25
  const fontSize = Math.max(10, labelSize * 0.25)
  const text = label === 'preprint' ? 'Preprint' : 'arXiv'
  
  const svg = `
    <svg width="${labelSize}" height="${labelSize}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white" rx="${labelSize * 0.15}" stroke="#e5e7eb" stroke-width="1"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${fontSize}" 
            font-weight="500" 
            fill="#374151">
        ${text}
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export async function createQRWithCaption(qrCode: QRCodeStyling, caption: string, size: number, format: 'png' | 'svg'): Promise<string> {
  if (!caption) {
    // If no caption, return the original QR code
    if (format === 'svg') {
      const svgData = await qrCode.getRawData('svg')
      return typeof svgData === 'string' ? svgData : `data:image/svg+xml;base64,${btoa(svgData?.toString() || '')}`
    } else {
      const canvas = document.createElement('canvas')
      await qrCode.append(canvas)
      return canvas.toDataURL()
    }
  }

  const textHeight = 40
  const totalHeight = size + textHeight
  const fontSize = Math.max(12, size * 0.024)

  if (format === 'svg') {
    // For SVG, we need to create a composite SVG
    const svgData = await qrCode.getRawData('svg')
    const qrSvg = typeof svgData === 'string' ? svgData : svgData?.toString() || ''
    
    // Parse the QR SVG to get its content
    const parser = new DOMParser()
    const qrDoc = parser.parseFromString(qrSvg, 'image/svg+xml')
    const qrSvgElement = qrDoc.documentElement
    
    // Create new composite SVG
    const compositeSvg = `
      <svg width="${size}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <g transform="translate(0,0)">
          ${qrSvgElement.innerHTML}
        </g>
        <text x="${size / 2}" y="${size + 25}" 
              text-anchor="middle" 
              font-family="system-ui, -apple-system, sans-serif" 
              font-size="${fontSize}" 
              font-weight="400" 
              fill="#374151">
          ${caption}
        </text>
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(compositeSvg)}`
  } else {
    // For PNG, use canvas to composite
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = totalHeight
    const ctx = canvas.getContext('2d')
    
    if (!ctx) throw new Error('Could not get canvas context')
    
    // Fill background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, size, totalHeight)
    
    // Get QR code as canvas and draw it
    const qrCanvas = document.createElement('canvas')
    await qrCode.append(qrCanvas)
    ctx.drawImage(qrCanvas, 0, 0, size, size)
    
    // Add text
    ctx.fillStyle = '#374151'
    ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(caption, size / 2, size + textHeight / 2)
    
    return canvas.toDataURL()
  }
}

export async function downloadQR(qrCode: QRCodeStyling | string, filename: string, format: 'png' | 'svg') {
  if (typeof qrCode === 'string') {
    const link = document.createElement('a')
    link.download = filename
    link.href = qrCode
    link.click()
  } else {
    if (format === 'svg') {
      qrCode.download({ name: filename.replace('.png', ''), extension: 'svg' })
    } else {
      qrCode.download({ name: filename.replace('.svg', ''), extension: 'png' })
    }
  }
}