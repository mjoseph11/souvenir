const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const photoStyle = 'width:0.7in;height:0.7in;border-radius:50%;object-fit:cover;object-position:top;border:2px solid var(--gold);display:block;margin:0 auto 0.05in;';
const cardStyle = 'text-align:center;border:1px solid rgba(201,162,39,0.3);border-radius:4px;padding:0.08in 0.05in;background:white;';
const nameStyle = 'font-size:7.5pt;font-weight:bold;color:var(--maroon);';
const roleStyle = 'font-size:6.5pt;color:#666;';
const blankPhoto = `<div style="width:0.7in;height:0.7in;border-radius:50%;background:#e8d5b7;border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;margin:0 auto 0.05in;font-size:6pt;color:#888;">Photo</div>`;
const sectionLabel = (t) => `<p style="color:var(--maroon);font-size:9pt;font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin-bottom:0.08in;border-bottom:1px solid var(--gold);padding-bottom:2px;">${t}</p>`;

const card = (img, name, role='') => `
      <div style="${cardStyle}">
        ${img ? `<img src="committee/${img}" style="${photoStyle}">` : blankPhoto}
        <div style="${nameStyle}">${name}</div>
        ${role ? `<div style="${roleStyle}">${role}</div>` : ''}
      </div>`;

const grid5 = (cards) => `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.1in;margin-bottom:0.12in;">${cards}</div>`;

const execCards = [
  card('mathew-kurian.jpg',  'Mathew Kurian',   'Secretary'),
  card('santosh-ninan.png',  'Santosh Ninan',   'Joint Secretary'),
  card('reji-ninan.png',     'Reji Ninan',      'Treasurer'),
  card('manoj-chacko.jpeg',  'Manoj Chacko',    'Joint Treasurer'),
].join('');

const boardCards = [
  card('jessy-mathai.png',    'Jessy Mathai'),
  card('joseph-abraham.png',  'Joseph Abraham'),
  card('lee-george.png',      'Lee K. George'),
  card('raju-varghese.png',   'Raju Varghese'),
  card('thomas-joseph.png',   'Thomas Joseph'),
  card(null,                  'Yohannan Mathai'),
].join('');

const committeeCards = [
  card('ajo-maret.png',       'Ajo Maret'),
  card('alex-thankachan.jpg', 'Alex Thankachan'),
  card('arun-philip.png',     'Arun Philip'),
  card('biju-mani.jpeg',      'Biju Mani'),
  card('nithin-maret.png',    'Nithin Maret'),
  card('paul-maret.png',      'Paul J. Maret'),
  card('shainey-jacob.png',   'Shainey Jacob'),
  card('suchin-thompson.png', 'Suchin Thompson'),
  card('sumod-abraham.png',   'Sumod Abraham'),
  card(null,                  'Thomas Paul'),
].join('');

const newPage = `<!-- ════════════════════════════════════════
     PAGE 6 — EXECUTIVE COMMITTEE
════════════════════════════════════════ -->
<div class="page inner-page">
  <div class="page-header">
    <div class="page-header-title">
      <h1>Executive Committee</h1>
    </div>
  </div>

  <div class="page-content" style="padding-top:0.2in;">
    <div class="section-heading" style="margin-bottom:0.15in;">
      <h2>Leadership 2026</h2>
      <div class="gold-rule"></div>
      <p>Serving the Parish with Dedication</p>
    </div>

    <!-- Vicar -->
    <div style="text-align:center;margin-bottom:0.15in;padding:0.12in;background:white;border:1px solid rgba(201,162,39,0.4);border-radius:4px;">
      <img src="vicar.jpg" style="width:0.9in;height:0.9in;border-radius:50%;object-fit:cover;object-position:top;border:3px solid var(--gold);display:block;margin:0 auto 0.07in;">
      <h3 style="color:var(--maroon);font-size:12pt;">Rev. Fr. Shibu Venad Mathai</h3>
      <p style="color:#666;font-size:8pt;letter-spacing:1px;">VICAR</p>
    </div>

    ${sectionLabel('Executive Committee')}
    ${grid5(execCards)}

    ${sectionLabel('Board of Directors')}
    ${grid5(boardCards)}

    ${sectionLabel('Committee Members')}
    ${grid5(committeeCards)}
  </div>
  <div class="page-footer">
    <span>St. Gregorios Malankara Orthodox Church</span>
    <span>6</span>
    <span>Golden Jubilee 1976\u20132026</span>
  </div>
</div>`;

html = html.replace(
  /<!-- ════+\s*\n\s*PAGE 4 — EXECUTIVE COMMITTEE[\s\S]*?<\/div>\n\n\n/,
  newPage + '\n\n\n'
);

fs.writeFileSync('index.html', html);
console.log('Done — committee page rebuilt');
