"""Render parsed organization docx elements into hand-built souvenir pages.

CLI: orggen.py <parsed.json> <header title> <out prefix> <img dir> <splits csv | auto> [comment]
  splits = start index of each page, or "auto" to measure every block in headless
  Chrome and pack pages greedily (headings never left at the bottom of a page; a long
  paragraph is split across two pages rather than leaving a gap at the foot of one).
Each element is wrapped in <div class="org-el"> (display:flow-root) so its
measured height is exactly what it takes on the page."""
import html, json, re, subprocess, sys, os, pathlib

CHROME = r'C:/Program Files/Google/Chrome/Application/chrome.exe'
ROOT = pathlib.Path(r'C:/Users/matjo/projects/souvenir')


def e(s):
    return html.escape(s, quote=False)


def runs(p):
    out = []
    for t, b, i in p['runs']:
        t = e(t).replace('\n', '<br>')
        if b: t = f'<strong>{t}</strong>'
        if i: t = f'<em>{t}</em>'
        out.append(t)
    return ''.join(out).strip()


class R:
    def __init__(self, media, imgdir):
        self.media, self.imgdir = media, imgdir

    def era(self, text):
        parts = [x.strip() for x in re.split(r'\s+\|\s+', text)]
        if len(parts) == 2:
            return f'{e(parts[0].replace("-", "–"))}<span class="sep">|</span>{e(parts[1])}'
        return e(text)

    def img(self, rid, style=''):
        return f'<img class="org-photo" src="{self.imgdir}/{self.media[rid]}" alt=""{style}>'

    def para(self, p):
        s, t = p['style'], runs(p)
        if p['imgs']:
            mh = p.get('imgMax', '3.1in')  # a taller cap can be set per photo in the parsed JSON
            return '\n'.join(self.img(r, f' style="width:100%;max-height:{mh};"') for r in p['imgs'])
        if s == 'MinistryTitle': return f'<h2 class="org-title">{t}</h2>'
        if s == 'EraTitle': return f'<h2 class="org-era">{self.era(p["text"])}</h2>'
        if s == 'EraSubtitle': return f'<p class="org-sub">{t}</p>\n<div class="org-rule"></div>'
        if s == 'Motto': return f'<p class="org-motto">{t}</p>'
        if s == 'Byline': return f'<p class="org-byline">{t}</p>'
        if s == 'Caption': return f'<p class="org-caption">{t}</p>'
        if s.startswith('SectionHead'): return f'<h4 class="org-h">{t}</h4>'
        if s.startswith('SmallHead'): return f'<h5 class="org-h5">{t}</h5>'
        return f'<p class="org-body">{t}</p>'

    def table(self, t):
        rows = t['rows']
        if len(rows) > 1:
            trs = []
            for r in rows:
                yrs = e(''.join(x[0] for x in r[0][0]['runs']).strip()) if r[0] else ''
                right = '\n'.join(''.join(x[0] for x in p['runs']).strip() for p in r[1] if p['text'])
                m = re.match(r'(.*?)\s+—\s+(.*)', right, re.S)
                right = (f'<strong>{e(m.group(1).strip())}</strong> <span class="role">— {e(m.group(2).strip())}</span>'
                         if m else e(right)).replace('\n', '<br>')
                trs.append(f'<tr><td>{yrs.replace("-", "–")}</td><td>{right}</td></tr>')
            return '<table class="org-table">\n' + '\n'.join(trs) + '\n</table>'
        a, b = rows[0][0], rows[0][1]
        ia = [r for p in a for r in p['imgs']]; ib = [r for p in b for r in p['imgs']]
        ta = [p for p in a if p['text']]; tb = [p for p in b if p['text']]
        imgs, cap, body = (ia, ta, tb) if ia else (ib, tb, ta)
        fig = ('<div class="org-fig">' + ''.join(self.img(r) for r in imgs)
               + ''.join(f'<p class="org-caption">{runs(p)}</p>' for p in cap) + '</div>')
        if t.get('after'):
            # magazine layout: the photo floats at the side and the writing after it (the
            # pair's own text, then the next paragraphs and headings) wraps round and under it
            side = 'left' if ia else 'right'
            if t.get('imgH'):
                fig = ('<div class="org-fig">' + ''.join(self.img(r, f' style="height:{t["imgH"]:.0f}px"') for r in imgs)
                       + ''.join(f'<p class="org-caption">{runs(p)}</p>' for p in cap) + '</div>')
            return (f'<div class="org-float {side}">' + fig + ''.join(self.para(p) for p in body)
                    + ''.join(self.para(p) for p in t['after']) + '</div>')
        txt = '<div class="org-text">' + ''.join(self.para(p) for p in body) + '</div>'
        return '<div class="org-pair">' + (fig + txt if ia else txt + fig) + '</div>'

    def el(self, x, i=None):
        inner = x['html'] if x['kind'] == 'raw' else self.para(x) if x['kind'] == 'p' else self.table(x)
        if x.get('scale'):  # a photo row made smaller to fit its page (see pack)
            inner = re.sub(r'max-width:([\d.]+)in',
                           lambda m: f'max-width:{min(float(m.group(1)) * 96, CONTENT_W) * x["scale"]:.0f}px', inner, count=1)
        di = f' data-i="{i}"' if i is not None else ''
        return f'<div class="org-el"{di}>\n{inner}\n</div>'


TOP = '''<div class="page inner-page org-page">
  <div class="page-header">
    <div class="page-header-title">
      <h1>{title}</h1>
    </div>
  </div>

  <div class="page-content">
'''
FOOT = '''  </div>
  <div class="page-footer">
    <span>St. Gregorios Malankara Orthodox Church</span>
    <span>@@PAGE@@</span>
    <span>Golden Jubilee 1976 &ndash; 2026</span>
  </div>
</div>
'''
HEADINGS = ('MinistryTitle', 'EraTitle', 'EraSubtitle', 'SectionHeading', 'SmallHeading', 'Byline')


def measure(els, r, title):
    """Return (heights in px, available px per page) measured in headless Chrome."""
    src = (ROOT / 'index.html').read_text(encoding='utf-8')
    head = src[:src.index('<body')] + '<body>\n'
    body = TOP.format(title=e(title)) + '\n'.join(r.el(x, i) for i, x in enumerate(els)) + FOOT
    probe = TOP.format(title=e(title)) + '<div class="org-el" id="probe"><p class="org-body">x</p></div>' + FOOT
    script = '''<script>addEventListener('load',function(){Promise.all(['400 13px','italic 400 13px','600 13px','700 13px','italic 700 13px'].map(function(f){return document.fonts.load(f+' "EB Garamond"')})).then(function(){return document.fonts.ready}).then(function(){setTimeout(function(){
var els=[].slice.call(document.querySelectorAll('[data-i]'));
var hs=els.map(function(d){return d.getBoundingClientRect().height});
var lines={},fl={};
els.forEach(function(d){var f=d.querySelector(':scope > .org-float');if(!f)return;var g=f.querySelector('.org-fig'),im=g.querySelector('img');
 var gb=g.getBoundingClientRect().bottom,sp=0;[].slice.call(f.children).forEach(function(c){if(c===g)return;var b=c.getBoundingClientRect();if(b.top<gb-2&&b.bottom>gb)sp=b.bottom-gb;});
 fl[d.getAttribute('data-i')]={spill:sp,img:im.getBoundingClientRect().height};});
var lines={};
els.forEach(function(d){var p=d.querySelector(':scope > p.org-body');if(!p||d.children.length!==1)return;
 var pt=p.getBoundingClientRect().top,out=[],off=0,w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),n;
 while((n=w.nextNode())){var re=/\\S+/g,m;while((m=re.exec(n.data))){var r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);
  var b=r.getClientRects()[0];if(!b)continue;var last=out[out.length-1];
  if(!last||b.top-pt>last.top+3)out.push({off:off+m.index,top:b.top-pt,bottom:b.bottom-pt});else last.bottom=Math.max(last.bottom,b.bottom-pt);}
  off+=n.data.length;}
 lines[d.getAttribute('data-i')]={text:p.textContent,lines:out};});
var tb={};els.forEach(function(d){var t=d.querySelector('table.mb-table');if(!t||!t.tHead)return;var db=d.getBoundingClientRect(),b=t.getBoundingClientRect();
 tb[d.getAttribute('data-i')]={top:b.top-db.top,head:t.tHead.getBoundingClientRect().height,bottom:db.bottom-b.bottom,
  rows:[].map.call(t.tBodies[0].rows,function(r){return r.getBoundingClientRect().height}),
  cols:[].map.call(t.tHead.rows[0].cells,function(c){return c.getBoundingClientRect().width})};});
var pr=document.getElementById('probe').getBoundingClientRect();
var ft=document.querySelectorAll('.page-footer')[1].getBoundingClientRect();
var pg=document.querySelectorAll('.page')[1].getBoundingClientRect();
var pc=document.querySelectorAll('.page-content')[1].getBoundingClientRect();
var o=document.createElement('pre');o.id='measure-out';
o.textContent=JSON.stringify({tb:tb,fl:fl,pcH:ft.top-pc.top,lines:lines,hs:hs,avail:ft.top-pr.top,pageH:pg.height,fonts:document.fonts.status});document.body.appendChild(o);},1500)})});</script>'''
    tmp = ROOT / '_measure_tmp.html'
    # The whole book follows the measured pages, so the text is set exactly as in the book.
    # In the full document Chrome renders bold wider than in a small one (16 Nov: a stale
    # font cache it keeps for large pages), and the layout check measures the full book.
    book = src[src.index('>', src.index('<body')) + 1:src.rindex('</body>')]
    tmp.write_text(head + body + probe + book + script + '</body></html>', encoding='utf-8')
    try:
        dom = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--allow-file-access-from-files',
                              '--window-size=1100,1400', '--virtual-time-budget=30000', '--dump-dom',
                              tmp.as_uri()], capture_output=True, text=True, encoding='utf-8', timeout=180).stdout
    finally:
        tmp.unlink(missing_ok=True)
    m = re.search(r'<pre id="measure-out">(.*?)</pre>', dom, re.S)
    data = json.loads(html.unescape(m.group(1)))
    print('fonts:', data.get('fonts'), 'page height px:', data.get('pageH'), 'sum of blocks px: %.0f' % sum(data['hs']), file=sys.stderr)
    measure.floats = {int(k): v for k, v in data['fl'].items()}
    measure.tables = {int(k): v for k, v in data['tb'].items()}
    return data['hs'], data['avail'], {int(k): v for k, v in data['lines'].items()}, data['pcH']


MARGIN = 7.2  # .org-body margin-bottom (0.075in) in px
DEFER_MAX = 3  # paragraphs a block that does not fit may move below
SHRINK_MIN = 0.6  # a photo row may be made this small (of its height) to fit a page
SHRINK_PREV = 0.75  # ...or this small to let the block after it fit
CONTENT_W = 708  # px: width of an article page's text
GAP_CAP = 4.0  # most extra space added between two blocks, px


def split_table(h, k, cols):
    """Split a raw <table> (thead + tbody) after body row k into two tables with the same header.
    Both keep the whole table's column widths, so their rows wrap (and measure) as they did."""
    total = sum(cols)
    cg = '<colgroup>' + ''.join(f'<col style="width:{100 * c / total:.2f}%">' for c in cols) + '</colgroup>'
    h = re.sub(r'<table class="([^"]*)">', lambda m: f'<table class="{m.group(1)}" style="table-layout:fixed">' + cg, h, count=1)
    pre, rest = h.split('<tbody>', 1)
    body, post = rest.split('</tbody>', 1)
    rows = re.findall(r'<tr>.*?</tr>', body, re.S)
    return (pre + '<tbody>' + ''.join(rows[:k]) + '</tbody>' + post,
            pre + '<tbody>' + ''.join(rows[k:]) + '</tbody>' + post)


def split_runs(runs, at):
    """Split [text, bold, italic] runs at character offset `at` of the paragraph's textContent."""
    a, b, pos = [], [], 0
    for t, bo, it in runs:
        flat = t.replace('\n', '')  # <br> adds no text
        if pos + len(flat) <= at:
            a.append([t, bo, it])
        elif pos >= at:
            b.append([t, bo, it])
        else:
            k, seen = 0, 0
            while seen < at - pos:
                if t[k] != '\n':
                    seen += 1
                k += 1
            a.append([t[:k], bo, it])
            b.append([t[k:], bo, it])
        pos += len(flat)
    if a:
        a[-1][0] = a[-1][0].rstrip()
    if b:
        b[0][0] = b[0][0].lstrip()
    return a, b


def pack(els, hs, avail, slack, lines=None):
    """Greedy page fill. Returns pages, each a list of (index, part): part is None (whole
    element) or ('head'|'tail', runs) for a paragraph split across two pages. A paragraph of
    4+ lines is split when at least 2 lines fit and 2 go over; headings stay with their text."""
    lines = lines or {}
    cap = avail - slack
    pages, used, i = [[]], 0.0, 0
    pack.used = []  # height of what is on each page, px
    while i < len(els):
        need, j = hs[i], i
        while j + 1 < len(els) and els[j]['kind'] == 'p' and els[j]['style'] in HEADINGS:
            j += 1
            need += hs[j]
        if (used > 0 and used + need > cap and els[i]['kind'] == 'raw' and i + 1 < len(els)
                and els[i + 1]['kind'] == 'p' and els[i + 1]['style'] not in HEADINGS
                and not els[i + 1]['imgs'] and els[i].get('deferred', 0) < DEFER_MAX):
            # A photo row, quote box or table that does not fit swaps places with the paragraph
            # after it (never past a heading), so the writing fills the page and the block
            # opens the next one, as a typesetter floats a figure (Mission Board, 16 Nov).
            els[i], els[i + 1] = els[i + 1], dict(els[i], deferred=els[i].get('deferred', 0) + 1)
            hs[i], hs[i + 1] = hs[i + 1], hs[i]
            li, lj = lines.pop(i, None), lines.pop(i + 1, None)
            if lj is not None: lines[i] = lj
            if li is not None: lines[i + 1] = li
            continue
        room = cap - used
        if (used > 0 and need > room and els[i]['kind'] == 'raw' and 'mb-row' in els[i]['html']
                and room >= max(SHRINK_MIN * need, 150)):
            # A photo row that still does not fit (a heading follows it) is made smaller to
            # fit the room left, rather than leave a hole at the foot of the page. The pictures
            # shrink with the row's width; captions keep their size, so allow them a margin.
            s = (room - 24) / need
            els[i] = dict(els[i], scale=s)
            hs[i] = need = need * s + 24
        if used > 0 and need > room and j == i and els[i]['kind'] == 'raw':
            # A block that just misses: make a photo row already on this page a little
            # smaller (to no less than SHRINK_PREV of its height) so the block fits.
            short = need - room
            for x, part in reversed(pages[-1]):
                if part is None and els[x]['kind'] == 'raw' and 'mb-row' in els[x]['html'] and not els[x].get('scale'):
                    h = hs[x]
                    s_ = (h - short - 24) / h
                    if s_ >= SHRINK_PREV:
                        els[x] = dict(els[x], scale=s_)
                        hs[x] = h * s_ + 24
                        used -= h - hs[x]
                        room = cap - used
                    break
        T = els[j].get('rowsH') if els[j]['kind'] == 'raw' else None
        if used > 0 and need > room and T:
            # A long table that does not fit breaks between rows (with any heading before it
            # on this page); the header row is repeated at the top of the next page. At
            # least two rows on each side.
            acc, k = sum(hs[i:j]) + T['top'] + T['head'] + T['bottom'], 0
            while k < len(T['rows']) and acc + T['rows'][k] <= room:
                acc += T['rows'][k]; k += 1
            if k >= 2 and len(T['rows']) - k >= 2:
                a, b = split_table(els[j]['html'], k, T['cols'])
                pages[-1] += [(x, None) for x in range(i, j)] + [(j, ('raw', a))]
                pack.used.append(used + acc)
                pages.append([(j, ('raw', b))])
                used = T['top'] + T['head'] + T['bottom'] + sum(T['rows'][k:])
                i = j + 1
                continue
        if used > 0 and used + need > cap:
            info = lines.get(j)
            if info and len(info['lines']) >= 4:
                ls, room = info['lines'], cap - used - sum(hs[i:j])
                k = max((k for k in range(2, len(ls) - 1) if ls[k - 1]['bottom'] + MARGIN <= room), default=0)
                if k:
                    off = ls[k]['off']
                    head, tail = split_runs(els[j]['runs'], off)
                    got = ''.join(x[0] for x in tail).replace('\n', '')
                    assert got[:30] == info['text'][off:].lstrip()[:30], (j, got[:30], info['text'][off:off + 30])
                    pages[-1] += [(x, None) for x in range(i, j)] + [(j, ('head', head))]
                    pack.used.append(used + sum(hs[i:j]) + ls[k - 1]['bottom'] + MARGIN)
                    pages.append([(j, ('tail', tail))])
                    used = hs[j] - ls[k]['top']
                    i = j + 1
                    continue
            pages.append([])
            pack.used.append(used)
            used = 0.0
        pages[-1].append((i, None))
        used += hs[i]
        i += 1
    pack.used.append(used)
    return pages


FLOAT_CHARS = 900  # about as much writing as fits beside a floated photo
RUNT = 42  # px: up to two lines (18.5px each) under a floated photo
MAX_IMG = 230  # px (2.4in): tallest a floated photo is made
FLOAT_GAP = 60  # px: a floated block leaving more than this at the foot of a page goes plain
NO_WRAP = ('MinistryTitle', 'EraTitle', 'EraSubtitle', 'Byline')


def merge_floats(els):
    """A photo beside a short text leaves a gap under the text. Give each photo pair the
    paragraphs (and small headings) that follow it, so they wrap round the photo, until
    there is about FLOAT_CHARS of writing; never end on a heading."""
    out, i = [], 0
    while i < len(els):
        x = els[i]
        if x['kind'] == 'table' and len(x['rows']) == 1:
            n = sum(len(p.get('text') or '') for c in x['rows'][0] for p in c)
            after, k = [], i + 1
            while (k < len(els) and n < FLOAT_CHARS and els[k]['kind'] == 'p' and not els[k]['imgs']
                   and els[k]['style'] not in NO_WRAP):
                after.append(els[k]); n += len(els[k].get('text') or ''); k += 1
            while after and after[-1]['style'] in HEADINGS:
                after.pop()
            if after:
                x = dict(x, after=after)
            out.append(dict(x, span=(i, i + 1 + len(after))))
            i += 1 + len(after)
            continue
        out.append(dict(x, span=(i, i + 1)))
        i += 1
    return out


def pack_floats(plain, merged, hu, lu, hm, lm, avail, slack):
    """Pack with the photos floated, except a floated block that would leave a gap of more
    than FLOAT_GAP px at the foot of the page before it: that one goes back to the plain
    layout (photo beside its own text, the paragraphs after it on their own), which can
    break across the page. Returns (els, pages)."""
    plain_ix = set()
    while True:
        els, hs, lines = [], [], {}
        for mi, x in enumerate(merged):
            if x.get('after') and mi not in plain_ix:
                if mi in lm:
                    lines[len(els)] = lm[mi]
                els.append(x); hs.append(hm[mi])
            else:
                for k in range(*x['span']):
                    if k in lu:
                        lines[len(els)] = lu[k]
                    els.append(dict(plain[k], mi=mi)); hs.append(hu[k])
        pages = pack(els, hs, avail, slack, lines)
        used = pack.used
        bad = {merged.index(els[pg[0][0]]) for n, pg in enumerate(pages)
               if n and els[pg[0][0]].get('after') and avail - slack - used[n - 1] > FLOAT_GAP}
        if not bad:
            return els, pages
        plain_ix |= bad


def main():
    j = json.load(open(sys.argv[1], encoding='utf-8'))
    title, prefix, imgdir, splits = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
    comment = sys.argv[6] if len(sys.argv) > 6 else ''
    plain, r = j['els'], R(j['media'], sys.argv[4])
    els = merge_floats(plain)
    if splits.startswith('auto'):
        slack = float(splits.split(':')[1]) if ':' in splits else 10.0
        hu, avail, lu, _ = measure(plain, r, title)
        for ti, tv in measure.tables.items():
            plain[ti] = dict(plain[ti], rowsH=tv)
        hm, _, lm, _ = measure(els, r, title)
        # One or two lines of a paragraph left alone under a floated photo look stranded:
        # make the photo that much taller (cropped) so they sit beside it. The block keeps its
        # height, since those lines only move up beside the photo.
        for mi, f in measure.floats.items():
            spill = f['spill']  # the part of a paragraph that runs on below the photo
            if 1 < spill <= RUNT and f['img'] + spill + 2 <= MAX_IMG:
                els[mi] = dict(els[mi], imgH=f['img'] + spill + 2)
        if any(x.get('imgH') for x in els):
            hm, _, lm, _ = measure(els, r, title)  # heights with the taller photos
        els, pages = pack_floats(plain, els, hu, lu, hm, lm, avail, slack)
        print('floated photos: %d of %d' % (sum(1 for x in els if x.get('after')),
                                             sum(1 for x in merge_floats(plain) if x.get('after'))), file=sys.stderr)
        print('measured avail %.0fpx; %d pages; paragraphs split at page ends: %s' % (
            avail, len(pages), [pg[0][0] for pg in pages if pg[0][1]]), file=sys.stderr)
    else:
        starts = [int(x) for x in splits.split(',')] + [len(els)]
        pages = [[(x, None) for x in range(starts[n], starts[n + 1])] for n in range(len(starts) - 1)]
        avail = None
    for old in pathlib.Path(prefix).parent.glob(pathlib.Path(prefix).name + '-*.html'):
        old.unlink()
    files = []
    for n, page in enumerate(pages):
        # Pages but the last share a little of their leftover space between blocks, at most
        # GAP_CAP px a break, so the foot of the page is evener; the rest stays at the bottom.
        # (Spreading all of it, as on 15 Nov, opened gaps that looked unprofessional - 16 Nov.)
        gap = 0.0
        if avail is not None and n < len(pages) - 1 and len(page) > 1:
            gap = max(0.0, min((avail - 4 - pack.used[n]) / (len(page) - 1), GAP_CAP))
        parts = []
        for k, (x, part) in enumerate(page):
            if part is None:
                parts.append(r.el(els[x]))
            else:
                kind, rs = part
                if kind == 'raw':  # part of a table split across pages
                    parts.append(f'<div class="org-el">\n{rs}\n</div>')
                    continue
                parts.append(f'<div class="org-el">\n<p class="org-body split-{kind}">{runs({"runs": rs})}</p>\n</div>')
        inner = '\n'.join('    ' + line for line in '\n'.join(parts).split('\n'))
        note = (f'    <!-- {comment} Page {n + 1} of {len(pages)}; generated from the Word document, text as written. -->\n'
                if comment else '')
        f = f'{prefix}-{n + 1:02d}.html'
        top = TOP.format(title=e(title))
        if gap >= 0.5:
            top = top.replace('<div class="page-content">', f'<div class="page-content" style="--g:{gap:.1f}px">')
        open(f, 'w', encoding='utf-8', newline='\n').write(top + note + inner + '\n' + FOOT)
        files.append(f)
    print('\n'.join(files))


if __name__ == '__main__':
    main()
