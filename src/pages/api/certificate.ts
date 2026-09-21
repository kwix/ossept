import type { APIRoute } from 'astro'
import fs from 'fs/promises'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createClient } from '@supabase/supabase-js'

export const prerender = false

type AffiliateRecord = {
  Item: string | null
  'CEDULA DE CIUDADANIA': string | null
  NOMBRES: string | null
  APELLIDOS: string | null
  ESTADO: string | null
}

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_KEY ?? import.meta.env.SUPABASE_SECRET_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
]

function wrapText(text: string, maxWidth: number, font: any, size: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, size)

    if (testWidth <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
}

function drawParagraph(page: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: any, size: number, options?: { align?: 'left' | 'center' | 'right' | 'justify'; color?: any }) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentWords: string[] = []
  let currentWidth = 0

  for (const word of words) {
    const wordWidth = font.widthOfTextAtSize(word, size)
    const testWidth = currentWords.length === 0 ? wordWidth : currentWidth + font.widthOfTextAtSize(' ', size) + wordWidth

    if (testWidth <= maxWidth) {
      currentWords.push(word)
      currentWidth = testWidth
    } else {
      if (currentWords.length > 0) {
        lines.push(currentWords.join(' '))
      }
      currentWords = [word]
      currentWidth = wordWidth
    }
  }

  if (currentWords.length > 0) {
    lines.push(currentWords.join(' '))
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const isLastLine = index === lines.length - 1
    const lineWidth = font.widthOfTextAtSize(line, size)

    let drawX = x
    if (options?.align === 'center') {
      drawX = x + (maxWidth - lineWidth) / 2
    } else if (options?.align === 'right') {
      drawX = x + maxWidth - lineWidth
    } else if (options?.align === 'justify' && !isLastLine && lines.length > 1) {
      const wordsInLine = line.split(/\s+/).filter(Boolean)
      const wordsWidth = wordsInLine.reduce((total, word) => total + font.widthOfTextAtSize(word, size), 0)
      const gapCount = Math.max(wordsInLine.length - 1, 1)
      const extraSpace = (maxWidth - wordsWidth) / gapCount
      let cursor = x

      for (let wordIndex = 0; wordIndex < wordsInLine.length; wordIndex += 1) {
        const word = wordsInLine[wordIndex]
        page.drawText(word, {
          x: cursor,
          y,
          font,
          size,
          color: options?.color ?? rgb(0, 0, 0)
        })
        cursor += font.widthOfTextAtSize(word, size) + (wordIndex < wordsInLine.length - 1 ? font.widthOfTextAtSize(' ', size) + extraSpace : 0)
      }

      y -= lineHeight
      continue
    }

    page.drawText(line, {
      x: drawX,
      y,
      font,
      size,
      color: options?.color ?? rgb(0, 0, 0)
    })
    y -= lineHeight
  }

  return y
}

function drawCenteredText(page: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: any, size: number) {
  return drawParagraph(page, text, x, y, maxWidth, lineHeight, font, size, { align: 'center' })
}

export const POST: APIRoute = async ({ request }) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let cedula = ''
  const contentType = request.headers.get('content-type') ?? ''
  const rawBody = await request.text().catch(() => '')

  console.log('certificate request', { contentType, rawBody })

  if (contentType.includes('application/json') || rawBody.startsWith('{') || rawBody.startsWith('[')) {
    if (rawBody) {
      try {
        const payload = JSON.parse(rawBody)
        cedula = typeof payload?.cedula === 'string'
          ? payload.cedula.trim()
          : typeof payload?.id === 'string'
            ? payload.id.trim()
            : typeof payload?.affiliateId === 'string'
              ? payload.affiliateId.trim()
              : ''
      } catch {
        const params = new URLSearchParams(rawBody)
        cedula = params.get('cedula')?.trim() || params.get('id')?.trim() || params.get('affiliateId')?.trim() || ''
      }
    }
  } else if (contentType.includes('application/x-www-form-urlencoded') || rawBody.includes('=')) {
    const params = new URLSearchParams(rawBody)
    cedula = params.get('cedula')?.trim() || params.get('id')?.trim() || params.get('affiliateId')?.trim() || ''
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    cedula = String(formData.get('cedula') ?? formData.get('id') ?? formData.get('affiliateId') ?? '').trim()
  } else {
    try {
      const payload = JSON.parse(rawBody)
      cedula = typeof payload?.cedula === 'string'
        ? payload.cedula.trim()
        : typeof payload?.id === 'string'
          ? payload.id.trim()
          : typeof payload?.affiliateId === 'string'
            ? payload.affiliateId.trim()
            : ''
    } catch {
      const params = new URLSearchParams(rawBody)
      cedula = params.get('cedula')?.trim() || params.get('id')?.trim() || params.get('affiliateId')?.trim() || ''
    }
  }

  if (!cedula) {
    return new Response(JSON.stringify({ error: 'La cédula de ciudadanía es requerida.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let affiliate: AffiliateRecord | null = null

  try {
    const { data, error } = await supabase
      .from('afiliados')
      .select('"CEDULA DE CIUDADANIA","NOMBRES","APELLIDOS","ESTADO"')
      .eq('CEDULA DE CIUDADANIA', cedula)
      .maybeSingle()

    if (error) {
      console.error('Supabase query error', error)
      return new Response(JSON.stringify({ error: 'No se pudo consultar la base de datos. Verifique la configuración de Supabase.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    affiliate = data as AffiliateRecord | null
  } catch (queryError) {
    console.error('Supabase lookup failed', queryError)
    return new Response(JSON.stringify({ error: 'No se pudo consultar la base de datos. Verifique la configuración de Supabase.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (!affiliate) {
    return new Response(JSON.stringify({ error: 'No se encontró ningún afiliado con ese ID.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const estado = affiliate.ESTADO ?? ''
  if (!String(estado).toLowerCase().includes('activo')) {
    return new Response(JSON.stringify({ error: 'El afiliado no se encuentra en estado ACTIVO.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const nombre = [affiliate.NOMBRES, affiliate.APELLIDOS].filter(Boolean).join(' ') || 'NOMBRE DESCONOCIDO'
  const documento = affiliate['CEDULA DE CIUDADANIA'] ?? 'DOCUMENTO DESCONOCIDO'
  const now = new Date()
  const day = now.getDate()
  const month = monthNames[now.getMonth()]
  const year = now.getFullYear()

  const templatePdfBytes = await fs.readFile(new URL('../../assets/Certificado modelo.pdf', import.meta.url))
  const pdfDoc = await PDFDocument.load(templatePdfBytes)
  const page = pdfDoc.getPage(0)
  const { width, height } = page.getSize()

  const [helveticaFont, helveticaBoldFont, helveticaObliqueFont] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  ])

  const topMargin = 5 * 28.3464566929
  const rightMargin = 2.5 * 28.3464566929
  const leftMargin = 2.5 * 28.3464566929
  const bottomMargin = 2.5 * 28.3464566929

  const margin = leftMargin
  const bodyWidth = width - leftMargin - rightMargin
  const introText = 'LA ORGANIZACION SINDICAL DE SERVIDORES PUBLICOS TERRITORIALES - OSSEPT'

  drawCenteredText(page, introText, leftMargin, height - topMargin - 70, bodyWidth, 16, helveticaBoldFont, 14)

  let cursorY = height - topMargin - 140
  cursorY = drawCenteredText(page, 'HACE CONSTAR', leftMargin, cursorY, bodyWidth, 18, helveticaBoldFont, 14)

  cursorY -= 28
  const certificadoTexto = `Que ${nombre}, identificado(a) con la cédula No. ${documento}, se encuentra en estado ACTIVO dentro de nuestra organización sindical.`
  cursorY = drawParagraph(page, certificadoTexto, leftMargin, cursorY, bodyWidth, 16, helveticaFont, 12, { align: 'justify' })

  cursorY -= 18
  drawParagraph(
    page,
    'Para constancia se expide el presente certificado.',
    leftMargin,
    cursorY,
    bodyWidth,
    16,
    helveticaFont,
    12,
    { align: 'justify' }
  )

  cursorY -= 42
  const fechaTexto = `Sincelejo, ${day} de ${month} de ${year}.`
  drawParagraph(page, fechaTexto, leftMargin, cursorY, bodyWidth, 16, helveticaFont, 12, { align: 'justify' })

  const pdfBytes = await pdfDoc.save()
  const pdfArrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer
  const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' })

  return new Response(pdfBlob, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=certificado-afiliacion.pdf'
    }
  })
}
