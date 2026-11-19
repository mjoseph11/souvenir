"""Make clergy titles the same across the souvenir (Mathew, 18 Nov 2026):
Very Rev. / Rev. Fr. / Remban / Cor-Episcopa. Case-sensitive so file names
(mathai-cor-episcopa.jpg, ramban.jpg) are never touched."""
import glob, re, sys

RULES = [
    # Cor-Episcopa, every spelling
    (r'\bCor[- ]?[Ee]piscop(?:a|os)\b', 'Cor-Episcopa'),
    (r'\bCorepiscop(?:a|os)\b', 'Cor-Episcopa'),
    (r'\bCOR[- ]?EPISCOP(?:A|OS)\b', 'COR-EPISCOPA'),
    # a Cor-Episcopa is Very Rev., without "Fr."
    (r'\bVery Rev Fr K Mathai\b', 'Very Rev. K. Mathai'),
    (r'(?<!Very )(?<!V\. )\bRev\. Fr\. K\. Mathai Cor-Episcopa','Very Rev. K. Mathai Cor-Episcopa'),
    (r'(?<!Very )(?<!Rev\. )\bFr\. Mathai Cor-Episcopa', 'Very Rev. K. Mathai Cor-Episcopa'),
    (r'\bVery Reverend Fr\. ', 'Very Rev. '),
    (r'\bV\. Rev\. Fr\. ', 'Very Rev. '),
    (r'\bVery Rev\. Fr\. ', 'Very Rev. '),
    (r'\bV\. Rev\. ', 'Very Rev. '),
    (r'\bV\. REV\. ', 'VERY REV. '),
    (r'\bRev Fr\. ', 'Rev. Fr. '),
    # Remban, as in the Metropolitan's letter
    (r'\bRamban\b', 'Remban'),
]

files = sorted(set(glob.glob('src/pages/**/*.html', recursive=True)) | {'data/members.json', 'data/outline.json', 'data/status.json', 'data/sponsors.json'})
total = 0
for f in files:
    s = open(f, encoding='utf-8').read()
    n0 = s
    for pat, rep in RULES:
        s, k = re.subn(pat, rep, s)
        if k:
            print(f'{f}: {k} x {pat!r}')
            total += k
    if s != n0 and '--apply' in sys.argv:
        open(f, 'w', encoding='utf-8').write(s)
print('total', total, '(applied)' if '--apply' in sys.argv else '(dry run)')
