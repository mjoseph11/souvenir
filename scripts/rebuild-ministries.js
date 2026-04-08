const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const photoBox = (label='Photo / Image') => `
        <div style="width:100%;height:1.4in;background:#f5ede0;border:1px dashed var(--gold);border-radius:4px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:9pt;margin:0.1in 0;">${label}</div>`;

const leaderRow = (name, role) => `
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(201,162,39,0.2);font-size:9pt;">
            <span style="font-weight:bold;color:var(--maroon);">${name}</span>
            <span style="color:#666;">${role}</span>
          </div>`;

const ministryHeader = (title, subtitle) => `
  <div class="page-header">
    <div class="page-header-title">
      <h1>${title}</h1>
    </div>
  </div>
  <div style="background:var(--maroon);text-align:center;padding:4px;color:var(--gold);font-size:8pt;letter-spacing:2px;text-transform:uppercase;">${subtitle}</div>`;

const footer = (pg) => `
  <div class="page-footer">
    <span>St. Gregorios Malankara Orthodox Church</span>
    <span>${pg}</span>
    <span>Golden Jubilee 1976\u20132026</span>
  </div>`;

const ministryPages = `<!-- ════════════════════════════════════════
     PAGE 7 — SUNDAY SCHOOL
════════════════════════════════════════ -->
<div class="page inner-page">
  ${ministryHeader('Sunday School', 'Nurturing Faith in the Next Generation')}
  <div class="page-content">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25in;">
      <div>
        <div class="section-heading" style="text-align:left;margin-bottom:0.12in;">
          <h2 style="font-size:15pt;">About</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <p style="font-size:9.5pt;line-height:1.75;color:#333;">
          The Sunday School of St. Gregorios Malankara Orthodox Church has been the cornerstone
          of faith formation for generations of children and youth. Meeting every Sunday from
          <strong>12:30 PM – 1:30 PM</strong> following Holy Qurbana, the Sunday School imparts
          the rich traditions of the Malankara Orthodox faith through scripture, liturgy, and
          Christian values.
          <br><br>
          [Add history, founding year of Sunday School, number of students, classes, etc.]
        </p>
        <div class="section-heading" style="text-align:left;margin:0.15in 0 0.08in;">
          <h2 style="font-size:13pt;">Leadership</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <div style="background:white;border:1px solid rgba(201,162,39,0.3);border-radius:4px;padding:0.1in;">
          ${leaderRow('Rev. Fr. Shibu Venad Mathai', 'Vicar / Director')}
          ${leaderRow('[Superintendent Name]', 'Sunday School Superintendent')}
          ${leaderRow('[Name]', 'Assistant Superintendent')}
          ${leaderRow('[Name]', 'Secretary')}
          ${leaderRow('[Name]', 'Treasurer')}
        </div>
      </div>
      <div>
        ${photoBox('Class Photo / Group Photo')}
        ${photoBox('Activity / Event Photo')}
      </div>
    </div>
    <div style="margin-top:0.15in;">
      <div class="section-heading" style="text-align:left;margin-bottom:0.08in;">
        <h2 style="font-size:13pt;">Programs &amp; Activities</h2>
        <div class="gold-rule" style="margin:0.05in 0;"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.1in;">
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Weekly Bible Classes</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Annual Bible Quiz</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Vacation Bible School</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Prayer & Liturgy</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Mission Projects</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">[Add Activity]</div>
      </div>
    </div>
  </div>
  ${footer(7)}
</div>


<!-- ════════════════════════════════════════
     PAGE 8 — MGOCSM / YOUTH LEAGUE
════════════════════════════════════════ -->
<div class="page inner-page">
  ${ministryHeader('MGOCSM / Youth League', 'Worship &bull; Study &bull; Service')}
  <div class="page-content">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25in;">
      <div>
        <div class="section-heading" style="text-align:left;margin-bottom:0.12in;">
          <h2 style="font-size:15pt;">About</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <p style="font-size:9.5pt;line-height:1.75;color:#333;">
          The Mar Gregorios Orthodox Christian Student Movement (MGOCSM) is the Youth League
          of St. Gregorios Malankara Orthodox Church. Grounded in the mission of
          <strong>Worship, Study, and Service</strong>, MGOCSM brings together the young
          members of the parish for spiritual growth, Orthodox faith education, and meaningful
          fellowship.
          <br><br>
          [Add history, founding year at SGMOC, notable events, retreats, etc.]
        </p>
        <div class="section-heading" style="text-align:left;margin:0.15in 0 0.08in;">
          <h2 style="font-size:13pt;">Leadership 2026</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <div style="background:white;border:1px solid rgba(201,162,39,0.3);border-radius:4px;padding:0.1in;">
          ${leaderRow('Rev. Fr. Shibu Venad Mathai', 'President')}
          ${leaderRow('Joanna Maret', 'Vice President')}
          ${leaderRow('Sruthy Mammen', 'Secretary')}
          ${leaderRow('Joshua Phillip', 'Joint Secretary')}
          ${leaderRow('Angela Babu', 'Treasurer')}
        </div>
      </div>
      <div>
        ${photoBox('Youth Group Photo')}
        ${photoBox('Event / Retreat Photo')}
      </div>
    </div>
    <div style="margin-top:0.15in;">
      <div class="section-heading" style="text-align:left;margin-bottom:0.08in;">
        <h2 style="font-size:13pt;">Programs &amp; Activities</h2>
        <div class="gold-rule" style="margin:0.05in 0;"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.1in;">
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Youth Retreats</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Bible Study</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Prayer Fellowship</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Community Service</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Diocesan Conferences</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">[Add Activity]</div>
      </div>
    </div>
  </div>
  ${footer(8)}
</div>


<!-- ════════════════════════════════════════
     PAGE 9 — LOGOS MINISTRY
════════════════════════════════════════ -->
<div class="page inner-page">
  ${ministryHeader('Logos Ministry', 'A New Ministry for Young Adults')}
  <div class="page-content">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25in;">
      <div>
        <div class="section-heading" style="text-align:left;margin-bottom:0.12in;">
          <h2 style="font-size:15pt;">About</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <div style="background:var(--maroon);color:var(--gold2);border-radius:4px;padding:0.12in;font-style:italic;font-size:9.5pt;line-height:1.6;margin-bottom:0.12in;">
          "Good News of beginning a new ministry for SGMOC young adults — Logos Ministry!
          Requesting Prayers &amp; Support!"<br>
          <span style="font-size:8pt;color:rgba(255,255,255,0.7);">— Rev. Fr. Shibu Venad Mathai, Vicar</span>
        </div>
        <p style="font-size:9.5pt;line-height:1.75;color:#333;">
          Logos Ministry is a newly launched young adult ministry of St. Gregorios Malankara
          Orthodox Church, rooted in the Word of God. Logos brings together young adults
          for prayer, fellowship, Bible study, and service — equipping them to live and
          proclaim their Orthodox faith in today's world.
          <br><br>
          [Add details: founding date, leadership, first events, vision statement, etc.]
        </p>
        <div class="section-heading" style="text-align:left;margin:0.15in 0 0.08in;">
          <h2 style="font-size:13pt;">Leadership</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <div style="background:white;border:1px solid rgba(201,162,39,0.3);border-radius:4px;padding:0.1in;">
          ${leaderRow('Rev. Fr. Shibu Venad Mathai', 'Spiritual Director')}
          ${leaderRow('[Name]', 'President')}
          ${leaderRow('[Name]', 'Secretary')}
          ${leaderRow('[Name]', 'Treasurer')}
        </div>
      </div>
      <div>
        ${photoBox('Ministry Launch Photo')}
        ${photoBox('Activity / Fellowship Photo')}
      </div>
    </div>
  </div>
  ${footer(9)}
</div>


<!-- ════════════════════════════════════════
     PAGE 10 — GROW
════════════════════════════════════════ -->
<div class="page inner-page">
  ${ministryHeader('GROW', 'God Renewing Orthodox Women')}
  <div class="page-content">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25in;">
      <div>
        <div class="section-heading" style="text-align:left;margin-bottom:0.12in;">
          <h2 style="font-size:15pt;">About</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <p style="font-size:9.5pt;line-height:1.75;color:#333;">
          GROW — <strong>God Renewing Orthodox Women</strong> — is a vibrant women's ministry
          instituted by His Grace Zachariah Mar Nicholovos, Metropolitan of the Northeast
          American Diocese. GROW helps women grow in Christ throughout all stages of life,
          fostering a personal, life-changing relationship with God and providing a faith-filled
          support system for young women.
          <br><br>
          [Add history at SGMOC, notable events, retreats, achievements, etc.]
        </p>
        <div class="section-heading" style="text-align:left;margin:0.15in 0 0.08in;">
          <h2 style="font-size:13pt;">Leadership 2026</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <div style="background:white;border:1px solid rgba(201,162,39,0.3);border-radius:4px;padding:0.1in;">
          ${leaderRow('Rev. Fr. Shibu Venad Mathai', 'Vicar')}
          ${leaderRow('Soumia Varghese', 'Ministry Leader')}
          ${leaderRow('[Name]', 'Secretary')}
          ${leaderRow('[Name]', 'Treasurer')}
        </div>
        <p style="font-size:8pt;color:#888;font-style:italic;margin-top:0.08in;">Instituted by His Grace Zachariah Mar Nicholovos</p>
      </div>
      <div>
        ${photoBox('GROW Group Photo')}
        ${photoBox('Event / Retreat Photo')}
      </div>
    </div>
    <div style="margin-top:0.15in;">
      <div class="section-heading" style="text-align:left;margin-bottom:0.08in;">
        <h2 style="font-size:13pt;">Programs &amp; Activities</h2>
        <div class="gold-rule" style="margin:0.05in 0;"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.1in;">
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Prayer &amp; Fellowship</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Bible Study</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Women's Retreats</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Community Service</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Diocesan Programs</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">[Add Activity]</div>
      </div>
    </div>
  </div>
  ${footer(10)}
</div>


<!-- ════════════════════════════════════════
     PAGE 11 — MARTH MARIAM SAMAJAM
════════════════════════════════════════ -->
<div class="page inner-page">
  ${ministryHeader('Marth Mariam Vanitha Samajam', 'Pray &bull; Act &bull; Illumine')}
  <div class="page-content">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25in;">
      <div>
        <div class="section-heading" style="text-align:left;margin-bottom:0.12in;">
          <h2 style="font-size:15pt;">About</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <p style="font-size:9.5pt;line-height:1.75;color:#333;">
          The Marth Mariam Vanitha Samajam (MMVS) is the historic women's organization of
          the Malankara Orthodox Church, established in <strong>1920</strong>. Recognizing
          St. Mary as its patron saint, the MMVS operates under the inspiring motto
          <em>"Pray, Act and Illumine."</em>
          <br><br>
          The SGMOC unit conducts regular fellowship meetings, Bible studies, and participates
          in diocesan leadership training, retreats, conferences, and Bible quiz competitions.
          The unit also supports charitable projects including women's causes in Kerala.
          <br><br>
          [Add local SGMOC unit history, founding year at SGMOC, notable milestones]
        </p>
        <div class="section-heading" style="text-align:left;margin:0.15in 0 0.08in;">
          <h2 style="font-size:13pt;">Leadership 2026</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <div style="background:white;border:1px solid rgba(201,162,39,0.3);border-radius:4px;padding:0.1in;">
          ${leaderRow('Rev. Fr. Shibu Venad Mathai', 'Vicar')}
          ${leaderRow('Reny Biju', 'Secretary')}
          ${leaderRow('Christeena Poovathoor', 'Joint Secretary')}
          ${leaderRow('Mercy Varkey', 'Treasurer')}
          ${leaderRow('Annamma Samuel', 'Central Committee Member')}
        </div>
      </div>
      <div>
        ${photoBox('MMVS Group Photo')}
        ${photoBox('Event / Gathering Photo')}
      </div>
    </div>
    <div style="margin-top:0.15in;">
      <div class="section-heading" style="text-align:left;margin-bottom:0.08in;">
        <h2 style="font-size:13pt;">Programs &amp; Activities</h2>
        <div class="gold-rule" style="margin:0.05in 0;"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.1in;">
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Saturday Bible Study</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Thursday Fellowship</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Bake Sales &amp; Fundraising</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Diocesan Retreats</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Bible Quiz Competitions</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Charity Projects</div>
      </div>
    </div>
  </div>
  ${footer(11)}
</div>


<!-- ════════════════════════════════════════
     PAGE 12 — GOOD SAMARITAN
════════════════════════════════════════ -->
<div class="page inner-page">
  ${ministryHeader('Good Samaritan Mission', 'Love God in Prayer &bull; Serve God by Caring &amp; Sharing')}
  <div class="page-content">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.25in;">
      <div>
        <div class="section-heading" style="text-align:left;margin-bottom:0.12in;">
          <h2 style="font-size:15pt;">About</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <p style="font-size:9.5pt;line-height:1.75;color:#333;">
          The Good Samaritan Mission (GSM) was established in <strong>2016</strong> under
          the leadership of Rev. Fr. Shibu V. Mathai, with approximately
          <strong>25 active members</strong>. GSM is a fellowship of elderly and retired
          faithful of SGMOC, dedicated to caring for those who are physically isolated,
          emotionally distressed, or spiritually in need.
          <br><br>
          The ministry conducts weekly family visits featuring Bible readings, singing, prayer,
          and shared meals. GSM also leads Lenten prayers, hosts seasonal gatherings including
          Onam feasts and Christmas celebrations, and provides financial assistance to those
          in need.
        </p>
        <div class="section-heading" style="text-align:left;margin:0.15in 0 0.08in;">
          <h2 style="font-size:13pt;">Spiritual Guidance</h2>
          <div class="gold-rule" style="margin:0.05in 0;"></div>
        </div>
        <div style="background:white;border:1px solid rgba(201,162,39,0.3);border-radius:4px;padding:0.1in;">
          ${leaderRow('Rev. Fr. Shibu V. Mathai', 'Vicar')}
          ${leaderRow('Rev. Fr. K. Mathai Cor Episcopos', 'Spiritual Guide')}
          ${leaderRow('Rev. Fr. Eby Paulose', 'Spiritual Guide')}
          ${leaderRow('[Name]', 'Coordinator')}
        </div>
      </div>
      <div>
        ${photoBox('GSM Group / Visit Photo')}
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.15in;margin-top:0.1in;text-align:center;">
          <div style="font-size:22pt;font-weight:bold;color:var(--gold);">25+</div>
          <div style="font-size:8pt;color:rgba(255,255,255,0.8);">Active Members</div>
          <div style="width:1in;height:1px;background:var(--gold);margin:0.08in auto;"></div>
          <div style="font-size:22pt;font-weight:bold;color:var(--gold);">2016</div>
          <div style="font-size:8pt;color:rgba(255,255,255,0.8);">Founded</div>
        </div>
      </div>
    </div>
    <div style="margin-top:0.15in;">
      <div class="section-heading" style="text-align:left;margin-bottom:0.08in;">
        <h2 style="font-size:13pt;">Programs &amp; Activities</h2>
        <div class="gold-rule" style="margin:0.05in 0;"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.1in;">
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Weekly Family Visits</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Lenten Prayer &amp; Devotionals</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Onam Feast &amp; Christmas</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Financial Assistance</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Prayer &amp; Mentoring</div>
        <div style="background:var(--maroon);color:white;border-radius:4px;padding:0.1in;text-align:center;font-size:8.5pt;">Online Prayer Fellowship</div>
      </div>
    </div>
  </div>
  ${footer(12)}
</div>`;

// Replace old single ministries page
html = html.replace(
  /<!-- ════+\s*\n\s*PAGE 5 — MINISTRIES[\s\S]*?<\/div>\n\n\n/,
  ministryPages + '\n\n\n'
);

fs.writeFileSync('index.html', html);
console.log('Done — 6 ministry pages created (pages 7–12)');
