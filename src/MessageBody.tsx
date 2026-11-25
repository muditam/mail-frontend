import {createElement, Fragment, useMemo, type ReactNode} from 'react'
import DOMPurify from 'dompurify'
import {LinkifyIt} from 'linkify-it'

const linkify = new LinkifyIt({fuzzyLink: true, fuzzyEmail: true}).add('ftp:', null)
const allowedTags = ['p','div','span','br','strong','b','em','i','u','s','del','blockquote','pre','code','h1','h2','h3','h4','h5','h6','ul','ol','li','table','thead','tbody','tfoot','tr','th','td','caption','hr','a','img']

function safeHref(value: string): string | undefined {
  try {
    const url = new URL(value)
    if (!['http:','https:','mailto:'].includes(url.protocol) || url.username || url.password) return
    return url.href
  } catch { return }
}
const linkProps = (href: string) => ({href, title: href, target: '_blank', rel: 'noopener noreferrer', referrerPolicy: 'no-referrer' as const})

function linkText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []; let end = 0
  for (const match of linkify.match(text) || []) {
    const href = safeHref(match.url)
    if (!href) continue
    nodes.push(text.slice(end, match.index))
    nodes.push(<a key={match.index} {...linkProps(href)}>{text.slice(match.index, match.lastIndex)}</a>)
    end = match.lastIndex
  }
  nodes.push(text.slice(end)); return nodes
}

function cleanHtml(html: string): DocumentFragment {
  const fragment = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    // Style/hidden are inspected only to discard invisible preheaders below.
    // Sender styles are never applied to the rendered message.
    ALLOWED_ATTR: ['href','title','colspan','rowspan','alt','role','style','hidden'],
    ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
    FORBID_TAGS: ['script','style','form','input','button','textarea','select','iframe','object','embed','svg','math','template'],
  })
  for (const element of Array.from(fragment.querySelectorAll('[style],[hidden]'))) {
    const style = (element as HTMLElement).style
    if (element.hasAttribute('hidden') || style.getPropertyValue('display').trim().toLowerCase() === 'none' || style.getPropertyValue('visibility').trim().toLowerCase() === 'hidden') element.remove()
    element.removeAttribute('style'); element.removeAttribute('hidden')
  }
  return fragment
}

// Email authors use nested tables for positioning. Only tables with their own
// headers/caption are data grids; presentation tables must not acquire grid UI.
function isLayoutTable(table: Element): boolean {
  if (['presentation','none'].includes((table.getAttribute('role') || '').trim().toLowerCase())) return true
  return !Array.from(table.querySelectorAll('th,caption')).some(cell => cell.closest('table') === table)
}
function hasReadableContent(element: Element): boolean {
  return !!element.textContent?.replace(/\u00a0/g, ' ').trim() || Array.from(element.querySelectorAll('img[alt]')).some(image => image.getAttribute('alt')?.trim())
}

function renderNode(node: Node, key: string, insideLink = false, depth = 0): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return insideLink ? node.textContent : <Fragment key={key}>{linkText(node.textContent || '')}</Fragment>
  if (node.nodeType !== Node.ELEMENT_NODE) return null
  const element = node as Element, tag = element.tagName.toLowerCase()
  // Bound React tree depth; deeper content remains escaped readable text.
  if (depth > 40) return element.textContent
  if (tag === 'table' && isLayoutTable(element) && !hasReadableContent(element)) return null
  if (tag === 'tr') {
    const table = element.closest('table')
    if (table && isLayoutTable(table) && !hasReadableContent(element)) return null
  }
  if (tag === 'img') return element.getAttribute('alt') ? <span key={key}>[{element.getAttribute('alt')}]</span> : null
  const children = Array.from(node.childNodes).map((child, index) => renderNode(child, `${key}-${index}`, insideLink || tag === 'a', depth + 1))
  if (tag === 'a') {
    const href = safeHref(element.getAttribute('href') || '')
    return href ? <a key={key} {...linkProps(href)}>{children}</a> : <span key={key}>{children}</span>
  }
  const props: Record<string, unknown> = {key}
  if (tag === 'table') {
    const layout = isLayoutTable(element)
    props.className = layout ? 'email-layout-table' : 'email-data-table'
    if (layout) props.role = 'presentation'
  }
  if (tag === 'td' || tag === 'th') {
    for (const [attr, prop] of [['colspan','colSpan'],['rowspan','rowSpan']]) {
      const value = Number(element.getAttribute(attr))
      if (Number.isInteger(value) && value >= 1 && value <= 100) props[prop] = value
    }
  }
  return createElement(tag, props, ...(['br','hr'].includes(tag) ? [] : children))
}

export function messagePlainText(bodyText: string, bodyHtml?: string): string {
  if (bodyText.trim() || !bodyHtml) return bodyText
  const fragment = cleanHtml(bodyHtml)
  // Keep useful line breaks when replying to HTML-only messages.
  for (const br of fragment.querySelectorAll('br')) br.replaceWith('\n')
  for (const block of fragment.querySelectorAll('p,div,li,tr,blockquote,h1,h2,h3,h4,h5,h6')) block.append('\n')
  return fragment.textContent?.trim() || ''
}

export function MessageBody({bodyText, bodyHtml}: {bodyText: string; bodyHtml?: string}) {
  const content = useMemo(() => {
    if (bodyHtml?.trim()) {
      const fragment = cleanHtml(bodyHtml)
      if (fragment.textContent?.trim() || Array.from(fragment.querySelectorAll('img[alt]')).some(image => image.getAttribute('alt')?.trim())) return {html: true, nodes: Array.from(fragment.childNodes).map((node, i) => renderNode(node, String(i)))}
    }
    return {html: false, nodes: linkText(bodyText || 'This message has no readable text body.')}
  }, [bodyText, bodyHtml])
  return <div className={`message-body ${content.html ? 'message-body-html' : 'message-body-text'}`}>{content.nodes}</div>
}
