export type LinkMode = 'abs' | 'pdf' | 'doi'

export interface ArxivInfo {
  id: string
  mode: LinkMode
}

export interface ShareParams {
  id: string
  mode: LinkMode
  fmt: 'png' | 'svg'
  size: number
  margin: number
  style: 'plain' | 'arxiv'
  centerLabel: 'none' | 'preprint' | 'arxiv'
  caption: string
}

const NEW_ARXIV_REGEX = /^\d{4}\.\d{4,5}(v\d+)?$/
const OLD_ARXIV_REGEX = /^[a-z-]+(\.[A-Z]{2})?\d{7}(v\d+)?$/

export function parseIdOrUrl(input: string): ArxivInfo | null {
  const trimmed = input.trim()
  
  if (!trimmed) return null

  if (NEW_ARXIV_REGEX.test(trimmed) || OLD_ARXIV_REGEX.test(trimmed)) {
    return { id: trimmed, mode: 'abs' }
  }

  try {
    const url = new URL(trimmed)
    
    if (!url.hostname.includes('arxiv.org') && !url.hostname.includes('doi.org')) return null

    if (url.hostname.includes('arxiv.org')) {
      const pathParts = url.pathname.split('/').filter(Boolean)
      
      if (pathParts.length < 2) return null

      const [category, idWithExt] = pathParts
      const id = idWithExt.replace('.pdf', '')
      
      if (!NEW_ARXIV_REGEX.test(id) && !OLD_ARXIV_REGEX.test(id)) return null

      const mode: LinkMode = category === 'pdf' ? 'pdf' : 'abs'
      
      return { id, mode }
    }

    if (url.hostname.includes('doi.org') && url.pathname.startsWith('/10.48550/arXiv.')) {
      const id = url.pathname.replace('/10.48550/arXiv.', '')
      if (NEW_ARXIV_REGEX.test(id) || OLD_ARXIV_REGEX.test(id)) {
        return { id, mode: 'doi' }
      }
    }

    return null
  } catch {
    return null
  }
}

export function buildUrl(id: string, mode: LinkMode): string {
  switch (mode) {
    case 'abs':
      return `https://arxiv.org/abs/${id}`
    case 'pdf':
      return `https://arxiv.org/pdf/${id}.pdf`
    case 'doi':
      return `https://doi.org/10.48550/arXiv.${id}`
    default:
      return `https://arxiv.org/abs/${id}`
  }
}

export function buildShareUrl(params: ShareParams): string {
  const searchParams = new URLSearchParams()
  
  searchParams.set('id', params.id)
  searchParams.set('mode', params.mode)
  searchParams.set('fmt', params.fmt)
  searchParams.set('size', params.size.toString())
  searchParams.set('margin', params.margin.toString())
  searchParams.set('style', params.style)
  searchParams.set('center', params.centerLabel)
  searchParams.set('caption', params.caption)
  
  return `/?${searchParams.toString()}`
}

export function parseShareUrl(searchParams: URLSearchParams): Partial<ShareParams> {
  return {
    id: searchParams.get('id') || undefined,
    mode: (searchParams.get('mode') as LinkMode) || 'abs',
    fmt: (searchParams.get('fmt') as 'png' | 'svg') || 'png',
    size: parseInt(searchParams.get('size') || '1024'),
    margin: parseInt(searchParams.get('margin') || '4'),
    style: (searchParams.get('style') as 'plain' | 'arxiv') || 'arxiv',
    centerLabel: (searchParams.get('center') as 'none' | 'preprint' | 'arxiv') || 'arxiv',
    caption: searchParams.get('caption') || ''
  }
}