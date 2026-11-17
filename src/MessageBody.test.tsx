// @vitest-environment jsdom
import {afterEach, describe, expect, it} from 'vitest'
import {cleanup, render, screen} from '@testing-library/react'
import {MessageBody, messagePlainText} from './MessageBody'

afterEach(cleanup)
describe('message formatting', () => {
  it('linkifies complete plain-text URLs and email addresses without losing verification parameters', () => {
    const url='https://accounts.example.com/verify?email=person%40muditam.in&token=Ab*c9!!%24&next=%2Fmail#continue'
    const {container}=render(<MessageBody bodyText={`Hi,\n\nVerify here: ${url}\nContact help@muditam.in.\nThanks.`}/>)
    const link=screen.getByRole('link',{name:url})
    expect(link.getAttribute('href')).toBe(url)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.getAttribute('referrerpolicy')).toBe('no-referrer')
    expect(screen.getByRole('link',{name:'help@muditam.in'}).getAttribute('href')).toBe('mailto:help@muditam.in')
    expect(container.querySelector('.message-body-text')?.textContent).toBe(`Hi,\n\nVerify here: ${url}\nContact help@muditam.in.\nThanks.`)
  })
  it('keeps surrounding punctuation outside links and handles www addresses', () => {
    render(<MessageBody bodyText="See https://example.com/path. Also www.example.com!"/>)
    expect(screen.getByRole('link',{name:'https://example.com/path'}).getAttribute('href')).toBe('https://example.com/path')
    expect(screen.getByRole('link',{name:'www.example.com'}).getAttribute('href')).toBe('http://www.example.com/')
  })
  it('preserves HTML paragraphs, headings, emphasis, lists, quotes and tables', () => {
    const {container}=render(<MessageBody bodyText="fallback" bodyHtml={'<h2>Account update</h2><p>Hello <strong>team</strong>.</p><ul><li>First</li><li>Second</li></ul><blockquote>Earlier message</blockquote><table><tr><th>Item</th><th>Status</th></tr><tr><td colspan="2">Ready</td></tr></table><p><a href="https://example.com/?a=1&amp;b=2">Verify account</a></p>'}/>)
    expect(screen.getByRole('heading',{name:'Account update'})).toBeTruthy()
    expect(container.querySelector('strong')?.textContent).toBe('team')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(container.querySelector('blockquote')?.textContent).toBe('Earlier message')
    expect(screen.getByRole('table')).toBeTruthy()
    expect(container.querySelector('td')?.getAttribute('colspan')).toBe('2')
    expect(screen.getByRole('link',{name:'Verify account'}).getAttribute('href')).toBe('https://example.com/?a=1&b=2')
    expect(container.textContent).not.toContain('fallback')
  })
  it('does not interpret plain-text HTML as markup', () => {
    const raw='<script>alert(1)</script><img src="https://tracker.example.com/pixel">'
    const {container}=render(<MessageBody bodyText={raw}/>)
    expect(container.querySelector('script,img')).toBeNull()
    expect(container.textContent).toBe(raw)
  })
  it('removes active content, tracking resources, sender CSS, IDs and application-facing attributes', () => {
    const {container}=render(<MessageBody bodyText="fallback" bodyHtml={'<style>body{display:none}</style><script>alert(1)</script><form action="https://evil.example.com"><input name="password"><button>Submit</button></form><iframe src="https://evil.example.com"></iframe><svg onload="alert(1)"></svg><p id="root" class="primary" data-testid="evil" style="position:fixed;background:url(https://tracker.example.com)">Hello<img src="https://tracker.example.com/pixel" srcset="https://tracker.example.com/x 2x" onerror="alert(1)" alt="Company logo"></p><a href="https://example.com" onclick="alert(1)" ping="https://tracker.example.com" title="Fake destination">Open</a>'}/>)
    expect(container.querySelector('script,style,form,input,button,iframe,svg,img,object,embed')).toBeNull()
    expect(container.querySelector('[onclick],[onerror],[style],[src],[srcset],[ping],[id],[data-testid]')).toBeNull()
    expect(screen.getByRole('link',{name:'Open'}).getAttribute('title')).toBe('https://example.com/')
    expect(container.textContent).toContain('Hello[Company logo]')
  })
  it('allows only explicit http, https and mailto destinations', () => {
    const schemes=['javascript:alert(1)','data:text/html,evil','vbscript:evil','file:///tmp/private','blob:https://example.com/id','//evil.example.com','/api/app/v1/auth/logout','https://trusted.example.com@evil.example.com']
    const {container}=render(<MessageBody bodyText="" bodyHtml={schemes.map(href=>`<a href="${href}">Unsafe destination</a>`).join('')+'<a href="mailto:help@muditam.in">Help</a>'}/>)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link',{name:'Help'}).getAttribute('href')).toBe('mailto:help@muditam.in')
    expect(container.querySelectorAll('a a')).toHaveLength(0)
  })
  it('does not create nested links and falls back when sanitized HTML has no readable content', () => {
    const first=render(<MessageBody bodyText="fallback" bodyHtml='<a href="https://example.com">https://example.com</a>'/>)
    expect(screen.getAllByRole('link')).toHaveLength(1);first.unmount()
    render(<MessageBody bodyText="Use https://example.com" bodyHtml='<script>evil()</script><style>body{color:red}</style>'/>)
    expect(screen.getByRole('link',{name:'https://example.com'})).toBeTruthy()
  })
  it('keeps HTML-only content available as readable text for replies without scripts', () => {
    expect(messagePlainText('Existing text','<p>Other</p>')).toBe('Existing text')
    const text=messagePlainText('', '<p>Hello<br>team</p><p><strong>Next step</strong></p><script>secret()</script>')
    expect(text).toContain('Hello\nteam\n');expect(text).toContain('Next step');expect(text).not.toContain('secret()');expect(text).not.toContain('<p>')
  })
})
