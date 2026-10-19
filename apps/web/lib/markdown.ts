import 'server-only';
import { Marked, type Tokens } from 'marked';
import { slugifyVi } from '@kitfix/ui';

export interface TocItem {
  id: string;
  text: string;
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s: string) => s.replace(/[*_`~[\]]|\(.*?\)/g, '').trim();

/**
 * Markdown bài viết → HTML cho thân bài. HTML thô trong Markdown bị escape (không chèn script/style);
 * H2 có id để mục lục nhảy tới; bảng được bọc khung cuộn ngang cho mobile; link ngoài mở tab mới.
 */
export function renderArticle(md: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();

  const marked = new Marked({
    gfm: true,
    renderer: {
      html({ text }: Tokens.HTML | Tokens.Tag) {
        return escapeHtml(text);
      },
      heading({ tokens, depth, text }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        if (depth !== 2 && depth !== 3) return `<h${Math.min(depth + 1, 4)}>${inner}</h${Math.min(depth + 1, 4)}>\n`;
        const label = plain(text);
        const base = slugifyVi(label) || 'muc';
        const n = used.get(base) ?? 0;
        used.set(base, n + 1);
        const id = n ? `${base}-${n + 1}` : base;
        if (depth === 2) toc.push({ id, text: label });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      link({ href, title, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens);
        const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : '#';
        const ext = /^https?:/i.test(safe) ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(safe)}"${title ? ` title="${escapeHtml(title)}"` : ''}${ext}>${inner}</a>`;
      },
      image({ href, title, text }: Tokens.Image) {
        if (!/^(https?:|\/)/i.test(href)) return escapeHtml(text);
        return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy">`;
      },
    },
  });

  const html = (marked.parse(md ?? '', { async: false }) as string)
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>');
  return { html, toc };
}
