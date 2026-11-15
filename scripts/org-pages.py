"""Render parsed organization docx elements into hand-built souvenir pages.

CLI: orggen.py <parsed.json> <header title> <out prefix> <img dir> <splits csv | auto> [comment]
  splits = start index of each page, or "auto" to measure every block in headless
  Chrome and pack pages greedily (headings never left at the bottom of a page).
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
            return '\n'.join(self.img(r, ' style="width:100%;max-height:3.1in;"') for r in p['imgs'])
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
        txt = '<div class="org-text">' + ''.join(self.para(p) for p in body) + '</div>'
        return '<div class="org-pair">' + (fig + txt if ia else txt + fig) + '</div>'

    def el(self, x, i=None):
        inner = self.para(x) if x['kind'] == 'p' else self.table(x)
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
    script = '''<script>addEventListener('load',function(){document.fonts.ready.then(function(){setTimeout(function(){
var els=[].slice.call(document.querySelectorAll('[data-i]'));
var hs=els.map(function(d){return d.getBoundingClientRect().height});
var pr=document.getElementById('probe').getBoundingClientRect();
var ft=document.querySelectorAll('.page-footer')[1].getBoundingClientRect();
var pg=document.querySelectorAll('.page')[1].getBoundingClientRect();
var o=document.createElement('pre');o.id='measure-out';
o.textContent=JSON.stringify({hs:hs,avail:ft.top-pr.top,pageH:pg.height,fonts:document.fonts.status});document.body.appendChild(o);},1500)})});</script>'''
    tmp = ROOT / '_measure_tmp.html'
    tmp.write_text(head + body + probe + script + '</body></html>', encoding='utf-8')
    try:
        dom = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--allow-file-access-from-files',
                              '--window-size=1100,1400', '--virtual-time-budget=30000', '--dump-dom',
                              tmp.as_uri()], capture_output=True, text=True, encoding='utf-8', timeout=180).stdout
    finally:
        tmp.unlink(missing_ok=True)
    m = re.search(r'<pre id="measure-out">(.*?)</pre>', dom, re.S)
    data = json.loads(html.unescape(m.group(1)))
    print('fonts:', data.get('fonts'), 'page height px:', data.get('pageH'), 'sum of blocks px: %.0f' % sum(data['hs']), file=sys.stderr)
    return data['hs'], data['avail']


def pack(els, hs, avail, slack):
    cap = avail - slack
    starts, used = [0], 0.0
    for i, h in enumerate(hs):
        need = h
        # keep a heading with what follows it
        j = i
        while j + 1 < len(els) and els[j]['kind'] == 'p' and els[j]['style'] in HEADINGS:
            j += 1; need += hs[j]
        if used > 0 and used + need > cap:
            starts.append(i); used = 0.0
        used += h
    return starts


def main():
    j = json.load(open(sys.argv[1], encoding='utf-8'))
    title, prefix, imgdir, splits = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
    comment = sys.argv[6] if len(sys.argv) > 6 else ''
    els, r = j['els'], R(j['media'], sys.argv[4])
    if splits.startswith('auto'):
        slack = float(splits.split(':')[1]) if ':' in splits else 10.0
        hs, avail = measure(els, r, title)
        starts = pack(els, hs, avail, slack)
        print('measured avail %.0fpx; page starts %s' % (avail, starts), file=sys.stderr)
    else:
        starts = [int(s) for s in splits.split(',')]
    for old in pathlib.Path(prefix).parent.glob(pathlib.Path(prefix).name + '-*.html'):
        old.unlink()
    bounds = starts + [len(els)]
    files = []
    for n in range(len(starts)):
        inner = '\n'.join(r.el(x) for x in els[bounds[n]:bounds[n + 1]])
        inner = '\n'.join('    ' + line for line in inner.split('\n'))
        note = (f'    <!-- {comment} Page {n + 1} of {len(starts)}; generated from the Word document, text as written. -->\n'
                if comment else '')
        f = f'{prefix}-{n + 1:02d}.html'
        open(f, 'w', encoding='utf-8', newline='\n').write(TOP.format(title=e(title)) + note + inner + '\n' + FOOT)
        files.append(f)
    print('\n'.join(files))


if __name__ == '__main__':
    main()
