import React from 'react'

/**
 * Enhanced markdown parser for AI analysis text
 * Handles **bold**, *italic*, and other common markdown formatting
 */
export function parseMarkdownText(text: string): React.ReactNode[] {
  if (!text) return []

  // Handle **bold** text first
  const boldParts = text.split(/(\*\*.*?\*\*)/g)
  
  return boldParts.map((boldPart, boldIndex) => {
    if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
      // This is bold text - remove ** and make it bold
      const boldContent = boldPart.slice(2, -2)
      return (
        <strong key={`bold-${boldIndex}`} className="font-bold text-blue-900">
          {parseItalicText(boldContent)}
        </strong>
      )
    }
    
    // Handle italic text in non-bold parts
    return parseItalicText(boldPart, `normal-${boldIndex}`)
  })
}

function parseItalicText(text: string, keyPrefix: string = ''): React.ReactNode[] {
  // Handle *italic* text (single asterisks)
  const italicParts = text.split(/(\*.*?\*)/g)
  
  return italicParts.map((italicPart, italicIndex) => {
    if (italicPart.startsWith('*') && italicPart.endsWith('*') && !italicPart.startsWith('**')) {
      // This is italic text - remove * and make it italic
      const italicContent = italicPart.slice(1, -1)
      return (
        <em key={`${keyPrefix}-italic-${italicIndex}`} className="italic text-blue-800">
          {parseSpecialText(italicContent)}
        </em>
      )
    }
    
    // Handle special formatting in non-italic parts
    return parseSpecialText(italicPart, `${keyPrefix}-${italicIndex}`)
  })
}

function parseSpecialText(text: string, keyPrefix: string = ''): React.ReactNode {
  // Handle inline code `code`
  if (text.includes('`')) {
    const codeParts = text.split(/(`.*?`)/g)
    return codeParts.map((codePart, codeIndex) => {
      if (codePart.startsWith('`') && codePart.endsWith('`')) {
        const codeContent = codePart.slice(1, -1)
        return (
          <code key={`${keyPrefix}-code-${codeIndex}`} className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded text-sm font-mono">
            {codeContent}
          </code>
        )
      }
      return codePart
    })
  }
  
  return text
}

/**
 * Parse a line of markdown text and return formatted JSX
 */
export function parseMarkdownLine(line: string): React.ReactNode {
  const trimmedLine = line.trim()
  if (!trimmedLine) return null
  
  return (
    <span className="markdown-content">
      {parseMarkdownText(trimmedLine)}
    </span>
  )
}

/**
 * Check if a line is a markdown header
 */
export function isMarkdownHeader(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('#') || 
         trimmed.match(/^[\ud83d\udccb\ud83d\udd2c\ud83d\udc8a\ud83d\udd0d\ud83d\udcc4]/) !== null ||
         trimmed.includes('**') && trimmed.length < 100
}

/**
 * Check if a line is a numbered list item
 */
export function isNumberedItem(line: string): boolean {
  return /^\d+\./.test(line.trim())
}

/**
 * Check if a line is a bullet point
 */
export function isBulletPoint(line: string): boolean {
  return /^[\u2022\-\*]/.test(line.trim())
}

/**
 * Extract number from numbered list item
 */
export function extractNumber(line: string): string | null {
  const match = line.trim().match(/^(\d+)\./)
  return match ? match[1] : null
}

/**
 * Extract content from numbered list item (without the number)
 */
export function extractNumberedContent(line: string): string {
  return line.trim().replace(/^\d+\.\s*/, '')
}

/**
 * Extract content from bullet point (without the bullet)
 */
export function extractBulletContent(line: string): string {
  return line.trim().replace(/^[\u2022\-\*]\s*/, '')
}