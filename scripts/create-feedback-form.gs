/**
 * SGMOC Golden Jubilee Souvenir — Feedback Form Updater (v2)
 * Edits the EXISTING form in place (clears all items, rebuilds with new content).
 * Updated to reflect current 15-page souvenir structure and
 * incorporate feedback from Manoj and other early reviewers.
 *
 * Run updateSouvenirFeedbackForm() in Google Apps Script (script.google.com)
 */
var FORM_ID = '16b7Bv-fb2OqMXXPcCeoxa35940_c0lQNVbxPE7J1cos';

function updateSouvenirFeedbackForm() {

  var form = FormApp.openById(FORM_ID);

  // Clear all existing items so we can rebuild cleanly
  var items = form.getItems();
  for (var i = items.length - 1; i >= 0; i--) {
    form.deleteItem(items[i]);
  }

  form.setTitle('SGMOC Golden Jubilee Souvenir — Feedback Form');
  form.setDescription(
    'Thank you for reviewing the SGMOC Golden Jubilee Souvenir draft.\n' +
    'Please share your feedback, corrections, and suggestions below.\n\n' +
    'Preview the souvenir at: https://mjoseph11.github.io/souvenir/\n\n' +
    'The souvenir covers 50 years of St. Gregorios Malankara Orthodox Church, Bensalem PA (1976–2026).'
  );
  form.setConfirmationMessage(
    'Thank you for your feedback! We will review your suggestions and update the souvenir accordingly.\n' +
    'May God bless you.'
  );

  // Keep existing settings
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(false);
  form.setShowLinkToRespondAgain(true);

  form.setDescription(
    'Thank you for reviewing the SGMOC Golden Jubilee Souvenir draft.\n' +
    'Please share your feedback, corrections, and suggestions below.\n\n' +
    'Preview the souvenir at: https://mjoseph11.github.io/souvenir/\n\n' +
    'The souvenir covers 50 years of St. Gregorios Malankara Orthodox Church, Bensalem PA (1976–2026).'
  );

  form.setConfirmationMessage(
    'Thank you for your feedback! We will review your suggestions and update the souvenir accordingly.\n' +
    'May God bless you.'
  );

  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(false);
  form.setShowLinkToRespondAgain(true);

  // ── Section 1: About You ──────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('About You')
    .setHelpText('Help us know who is giving feedback.');

  form.addTextItem()
    .setTitle('Your Full Name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Phone / WhatsApp Number')
    .setRequired(false);

  var roleItem = form.addMultipleChoiceItem();
  roleItem.setTitle('Your Role in SGMOC')
    .setChoices([
      roleItem.createChoice('Parish Member'),
      roleItem.createChoice('Executive Committee Member'),
      roleItem.createChoice('Vicar / Clergy'),
      roleItem.createChoice('Sunday School Teacher / Staff'),
      roleItem.createChoice('Ministry Leader'),
      roleItem.createChoice('Golden Jubilee Committee'),
      roleItem.createChoice('Other'),
    ])
    .setRequired(true);

  // ── Section 2: Overall Impression ────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Overall Impression')
    .setHelpText('Your general feedback on the souvenir draft.');

  var ratingItem = form.addScaleItem();
  ratingItem.setTitle('Overall Rating of the Draft')
    .setBounds(1, 5)
    .setLabels('Needs Major Work', 'Excellent')
    .setRequired(true);

  var themeItem = form.addMultipleChoiceItem();
  themeItem.setTitle('How do you like the Maroon & Gold theme?')
    .setChoices([
      themeItem.createChoice('Love it — keep as is'),
      themeItem.createChoice('Good, minor tweaks needed'),
      themeItem.createChoice('Needs significant changes'),
      themeItem.createChoice('Suggest a different theme'),
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('General comments on design / layout')
    .setRequired(false);

  // ── Section 3: Cover & Header ─────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Cover Page & Page Headers')
    .setHelpText('Feedback on the cover design and the repeating page header.');

  var coverItem = form.addMultipleChoiceItem();
  coverItem.setTitle('What is your overall impression of the cover page?')
    .setChoices([
      coverItem.createChoice('Excellent — no changes needed'),
      coverItem.createChoice('Good — minor tweaks'),
      coverItem.createChoice('Needs redesign'),
    ])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Cover page — specific suggestions')
    .setHelpText('e.g. logo placement, title text, background, fonts, Golden Jubilee logo')
    .setRequired(false);

  var headerItem = form.addMultipleChoiceItem();
  headerItem.setTitle('Page headers (appear on every page) — are they appropriate?')
    .setChoices([
      headerItem.createChoice('Yes, looks good'),
      headerItem.createChoice('Too prominent / too much space'),
      headerItem.createChoice('Not prominent enough'),
      headerItem.createChoice('Content in header needs correction'),
    ])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Any corrections to the header content?')
    .setHelpText('e.g. church name, diocese name, year range, logo')
    .setRequired(false);

  // ── Section 4: Message Pages ──────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Message Pages (Pages 2–4)')
    .setHelpText('His Holiness the Catholicos, His Grace the Metropolitan, and the Vicar\'s message.');

  form.addParagraphTextItem()
    .setTitle('Any corrections to the Catholicos message page (Page 2)?')
    .setHelpText('Title, name (His Holiness Baselios Marthoma Mathews III), photo, message text')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Any corrections to the Metropolitan message page (Page 3)?')
    .setHelpText('Title, name (His Grace Alexios Mar Eusebius), photo, message text')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Any corrections to the Vicar\'s message page (Page 4)?')
    .setHelpText('Title, name (V. Rev. Shibu Cherian Vazheparambil), photo, message text')
    .setRequired(false);

  // ── Section 5: In Memoriam ────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('In Memoriam — V. Rev. K. Mathai Cor Episcopa (Page 5)')
    .setHelpText('This page honors the founding vicar of SGMOC.');

  form.addParagraphTextItem()
    .setTitle('Any corrections or additions to the In Memoriam page?')
    .setHelpText('e.g. dates, personal details, biography, accomplishments, additional tribute text')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Do you have a photo of V. Rev. K. Mathai Cor Episcopa we could use?')
    .setHelpText('If yes, please share a contact name or WhatsApp number where we can request the photo')
    .setRequired(false);

  // ── Section 6: History Page ───────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Church History & Milestones (Page 6)')
    .setHelpText('Timeline of key events from 1976 to today.');

  form.addParagraphTextItem()
    .setTitle('Any errors or missing milestones in the History timeline?')
    .setHelpText('List the year and what happened. We especially need: property purchase, building consecrations, major clergy events.')
    .setRequired(false);

  var foundingYearItem = form.addMultipleChoiceItem();
  foundingYearItem.setTitle('Confirm: was the church founded in 1976?')
    .setChoices([
      foundingYearItem.createChoice('Yes — 1976 is correct'),
      foundingYearItem.createChoice('No — the correct year is different (please specify below)'),
      foundingYearItem.createChoice('I\'m not sure'),
    ])
    .setRequired(false);

  form.addTextItem()
    .setTitle('If the founding year is wrong, what is the correct year?')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Any notable past Presidents, Secretaries, or lay leaders we should mention?')
    .setRequired(false);

  // ── Section 7: Executive Committee ───────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Executive Committee Page (Page 7)')
    .setHelpText('The 2026 parish executive committee roster with photos.');

  form.addParagraphTextItem()
    .setTitle('Any corrections to the Executive Committee names or titles?')
    .setHelpText('Please provide the correct name and their exact title/role')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Is anyone missing from the Executive Committee list?')
    .setRequired(false);

  // ── Section 8: Ministry Pages ─────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Ministry Pages (Pages 8–14)')
    .setHelpText('Each ministry has its own page(s). Please provide corrections for any ministry you are familiar with.');

  // Sunday School
  form.addSectionHeaderItem()
    .setTitle('Sunday School (Pages 8–9)')
    .setHelpText('');

  form.addParagraphTextItem()
    .setTitle('Sunday School — corrections to leadership names or titles?')
    .setHelpText('Current: Principal – Dr. Sherrin Kurien, Registrar – [name needed], Dean – [name needed]. Please provide any corrections.')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Sunday School — what additional content should be included?')
    .setHelpText('e.g. enrollment numbers, grade structure, key programs, notable alumni, history of Sunday School at SGMOC')
    .setRequired(false);

  // Logos Ministry
  form.addSectionHeaderItem()
    .setTitle('Logos Ministry')
    .setHelpText('');

  form.addParagraphTextItem()
    .setTitle('Logos Ministry — corrections to leadership names or titles?')
    .setHelpText('Current: President – Vicar, Vice President – [needed], Secretary – [needed], Treasurer – [needed]')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Logos Ministry — additional content or corrections?')
    .setRequired(false);

  // MGOCSM / Youth League
  form.addSectionHeaderItem()
    .setTitle('MGOCSM / Youth League')
    .setHelpText('');

  form.addParagraphTextItem()
    .setTitle('MGOCSM/Youth — corrections to leadership names or titles?')
    .setHelpText('Please confirm 2026 President, Vice President, Secretary, Treasurer names')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('MGOCSM/Youth — additional content or corrections?')
    .setRequired(false);

  // GROW
  form.addSectionHeaderItem()
    .setTitle('GROW (Girls / Women Ministry)')
    .setHelpText('');

  form.addParagraphTextItem()
    .setTitle('GROW — corrections to leadership names or titles?')
    .setHelpText('Current: President – Annamma Chacko. Secretary and Treasurer names needed.')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('GROW — additional content or corrections?')
    .setRequired(false);

  // Marth Mariam Samajam
  form.addSectionHeaderItem()
    .setTitle('Marth Mariam Samajam')
    .setHelpText('');

  form.addParagraphTextItem()
    .setTitle('MMS — corrections to leadership names or titles?')
    .setHelpText('Please confirm 2026 President, Vice President, Secretary, Treasurer names')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('MMS — additional content or corrections?')
    .setRequired(false);

  // Good Samaritan
  form.addSectionHeaderItem()
    .setTitle('Good Samaritan Ministry')
    .setHelpText('');

  form.addParagraphTextItem()
    .setTitle('Good Samaritan — corrections to leadership or program details?')
    .setHelpText('Coordinator name needed. Please also list key outreach programs.')
    .setRequired(false);

  // ── Section 9: Photos ─────────────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Photos & Images')
    .setHelpText('The souvenir needs good-quality photos for all sections.');

  var photoItem = form.addCheckboxItem();
  photoItem.setTitle('Can you provide or help source photos for any of these?')
    .setChoices([
      photoItem.createChoice('Church exterior / interior'),
      photoItem.createChoice('Sunday School group / events'),
      photoItem.createChoice('Logos Ministry events'),
      photoItem.createChoice('MGOCSM / Youth events'),
      photoItem.createChoice('GROW events'),
      photoItem.createChoice('MMS events'),
      photoItem.createChoice('Good Samaritan outreach'),
      photoItem.createChoice('Historical photos (founding era, old building)'),
      photoItem.createChoice('V. Rev. K. Mathai Cor Episcopa'),
      photoItem.createChoice('Past clergy / leadership'),
    ])
    .setRequired(false);

  form.addTextItem()
    .setTitle('WhatsApp or email to coordinate photo submission')
    .setRequired(false);

  // ── Section 10: Missing Content ───────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Missing Content')
    .setHelpText('What should be added to the souvenir?');

  var missingItem = form.addCheckboxItem();
  missingItem.setTitle('What content is missing or should be expanded?')
    .setChoices([
      missingItem.createChoice('Photo gallery section'),
      missingItem.createChoice('Past Vicars chronological list'),
      missingItem.createChoice('Past Presidents / Secretary list'),
      missingItem.createChoice('Founding members tribute'),
      missingItem.createChoice('Jubilee celebration events / programs'),
      missingItem.createChoice('More detail on Sunday School history'),
      missingItem.createChoice('More detail on ministry histories'),
      missingItem.createChoice('Parish statistics / growth over 50 years'),
      missingItem.createChoice('Acknowledgements / thank-you page'),
      missingItem.createChoice('Index or table of contents'),
    ])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Any other content you would like to see added?')
    .setRequired(false);

  // ── Section 11: Your Family Greeting ─────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Submit Your Family Greeting')
    .setHelpText('Add your family\'s congratulatory message to the souvenir.');

  form.addTextItem()
    .setTitle('Family Name (as it should appear in the souvenir)')
    .setHelpText('e.g. "The Joseph Family" or "John & Mary Thomas"')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Your family greeting message')
    .setHelpText('2–3 sentences. Will be printed in the Family Greetings section.')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Short quote or blessing (optional)')
    .setHelpText('e.g. "To God be the Glory!" — appears below your message')
    .setRequired(false);

  // ── Section 12: Advertisements / Sponsorship ──────────────────────
  form.addSectionHeaderItem()
    .setTitle('Advertisement / Sponsorship')
    .setHelpText('Support the Golden Jubilee souvenir with an ad.');

  var adItem = form.addMultipleChoiceItem();
  adItem.setTitle('Are you interested in placing an advertisement?')
    .setChoices([
      adItem.createChoice('Yes — Full Page (Platinum)'),
      adItem.createChoice('Yes — Half Page (Gold)'),
      adItem.createChoice('Yes — Quarter Page'),
      adItem.createChoice('No, not at this time'),
    ])
    .setRequired(false);

  form.addTextItem()
    .setTitle('Business / Family name for the ad')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Contact name / number for ad coordination')
    .setRequired(false);

  // ── Done ──────────────────────────────────────────────────────────
  var formUrl = form.getPublishedUrl();
  var editUrl = form.getEditUrl();

  Logger.log('Form updated successfully!');
  Logger.log('Share this link: ' + formUrl);
  Logger.log('Edit form here: ' + editUrl);

}
