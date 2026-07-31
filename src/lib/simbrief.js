// Parsing helpers for SimBrief's XML OFP feed.
// https://developers.navigraph.com/docs/simbrief/fetching-ofp-data
//
// The feed is plain XML with no CDATA sections: every text node — including
// <plan_html>, which carries the whole formatted OFP — is entity-encoded
// (&lt;div&gt;&lt;pre&gt;…). Reading a node's raw content therefore yields
// escaped markup, which a browser renders as literal tag source instead of the
// formatted plan. Everything here decodes before returning.

const NAMED_ENTITIES = {
    lt: '<', gt: '>', amp: '&', quot: '"', apos: "'",
    nbsp: ' ', ndash: '–', mdash: '—', deg: '°',
}

export function decodeEntities(str) {
    if (!str) return ''
    return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body) => {
        if (body[0] === '#') {
            const code = body[1] === 'x' || body[1] === 'X'
                ? parseInt(body.slice(2), 16)
                : parseInt(body.slice(1), 10)
            return Number.isFinite(code) && code > 0 && code <= 0x10ffff
                ? String.fromCodePoint(code)
                : match
        }
        const named = NAMED_ENTITIES[body.toLowerCase()]
        return named === undefined ? match : named
    })
}

export function extractField(xml, tag) {
    if (!xml) return null
    const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
    if (!m) return null
    return decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim()
}

// Raw inner XML of a container node, for scoping field lookups to one section
// (several tags such as <icao_code> and <plan_rwy> repeat per airport).
export function extractBlock(xml, tag) {
    if (!xml) return ''
    const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
    return m ? m[1] : ''
}

export function extractPlanHtml(xml) {
    // CDATA is not what SimBrief sends today, but cheap to keep supporting
    const cdata = xml.match(/<plan_html[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/plan_html>/i)
    if (cdata) return cdata[1].trim()
    const plain = xml.match(/<plan_html[^>]*>([\s\S]*?)<\/plan_html>/i)
    return plain ? decodeEntities(plain[1]).trim() : ''
}

const BOOKMARK_RE = /<!--\s*BKMK\/\/\/([\s\S]*?)\/\/\/(\d+)\s*-->/gi

// SimBrief marks OFP sections with <!--BKMK///Title///Level--> comments so a
// viewer can build a table of contents.
export function extractBookmarks(html) {
    const out = []
    let m
    BOOKMARK_RE.lastIndex = 0
    while ((m = BOOKMARK_RE.exec(html)) !== null) {
        const title = m[1].trim()
        if (!title) continue
        out.push({ id: `bkmk-${out.length}`, title, level: Number(m[2]) || 0 })
    }
    return out
}

// Turn those comments into empty anchors matching extractBookmarks() ids.
export function annotateBookmarks(html) {
    let i = 0
    return html.replace(
        BOOKMARK_RE,
        (match, title) => (title.trim() ? `<span id="bkmk-${i++}" class="bkmk"></span>` : match),
    )
}

// Plain-text OFP for the no-HTML fallback view. Runs on already-decoded HTML,
// so the tag stripping actually has tags to strip.
export function htmlToText(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|tr|pre)>/gi, '\n')
        .replace(/<img[^>]*>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}
