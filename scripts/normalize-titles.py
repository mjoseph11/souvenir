"""Make clergy titles the same across the souvenir (Mathew, 18 Nov 2026):
Very Rev. / Rev. Fr. / Ramban / Cor Episcopos (Eby Achen, 19 Nov 9:23 PM:
"V Rev Geevarghese Ramban & V Rev Mathai Cor Episcopos"). Case-sensitive so file names
(mathai-cor-episcopa.jpg, ramban.jpg) are never touched."""
import glob, re, sys

RULES = [
    # Cor Episcopos, every spelling
    (r'\bC(?:h)?or[- ]?[Ee]piscop(?:a|os)\b', 'Cor Episcopos'),
    (r'\bCorepiscop(?:a|os)\b', 'Cor Episcopos'),
    (r'\bCOR[- ]?EPISCOP(?:A|OS)\b', 'COR EPISCOPOS'),
    # a Cor Episcopos is Very Rev., without "Fr."
    (r'\bVery Rev Fr K Mathai\b', 'Very Rev. K. Mathai'),
    (r'(?<!Very )(?<!V\. )\bRev\. Fr\. K\. Mathai Cor Episcopos','Very Rev. K. Mathai Cor Episcopos'),
    (r'(?<!Very )(?<!Rev\. )\bFr\. Mathai Cor Episcopos', 'Very Rev. K. Mathai Cor Episcopos'),
    (r'\bVery Reverend Fr\. ', 'Very Rev. '),
    (r'\bV\. Rev\. Fr\. ', 'Very Rev. '),
    (r'\bVery Rev\. Fr\. ', 'Very Rev. '),
    (r'\bV\. Rev\. ', 'Very Rev. '),
    (r'\bV\. REV\. ', 'VERY REV. '),
    (r'\bRev Fr\. ', 'Rev. Fr. '),
    # a priest is "Rev. Fr." even where the text says just "Fr." (18 Nov). Member
    # "sort" keys are left alone (see below) so no page moves in the A-Z order.
    (r'(?<!Rev\. )(?<!Rev )\bFr\. ?(?=[A-Z])', 'Rev. Fr. '),
    # Ramban (Eby Achen, 19 Nov)
    (r'\bRemban\b', 'Ramban'),
    # Metropolitan-designate (Eby Achen, 19 Nov 11:47 PM: "Designate")
    (r'\bMetropolitan[- ][Ee]lect\b', 'Metropolitan-designate'),
]

files = sorted(set(glob.glob('src/pages/**/*.html', recursive=True)) | {'data/members.json', 'data/outline.json', 'data/sponsors.json'})
total = 0
for f in files:
    s = open(f, encoding='utf-8').read()
    n0 = s
    for pat, rep in RULES:
        # member "sort" keys keep their wording so pages don't move in the A-Z order
        lines = s.split('\n')
        k = 0
        for i, ln in enumerate(lines):
            if '"sort":' in ln:
                continue
            lines[i], kk = re.subn(pat, rep, ln)
            k += kk
        s = '\n'.join(lines)
        if k:
            print(f'{f}: {k} x {pat!r}')
            total += k
    if s != n0 and '--apply' in sys.argv:
        open(f, 'w', encoding='utf-8').write(s)
print('total', total, '(applied)' if '--apply' in sys.argv else '(dry run)')
