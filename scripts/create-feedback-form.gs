/**
 * SGMOC Golden Jubilee Souvenir — Feedback Form Creator
 * Run this once in Google Apps Script (script.google.com)
 * It will create a fully configured Google Form in your Drive.
 */
function createSouvenirFeedbackForm() {

  var form = FormApp.create('SGMOC Golden Jubilee Souvenir — Feedback Form');

  form.setDescription(
    'Thank you for reviewing the SGMOC Golden Jubilee Souvenir draft.\n' +
    'Please share your feedback, corrections, and suggestions below.\n\n' +
    'Preview the souvenir at: https://mjoseph11.github.io/souvenir/'
  );

  form.setConfirmationMessage(
    'Thank you for your feedback! We will review your suggestions and update the souvenir accordingly.\n' +
    'May God bless you. 🙏'
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
      roleItem.createChoice('Executive Committee'),
      roleItem.createChoice('Vicar / Clergy'),
      roleItem.createChoice('Sunday School Teacher'),
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

  // ── Section 3: Content Corrections ───────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Content Corrections')
    .setHelpText('Help us get the facts right.');

  form.addTextItem()
    .setTitle('What is the correct founding year of SGMOC?')
    .setHelpText('e.g. 1975 — please correct if wrong')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Church Address (full)')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Any errors in the History section?')
    .setHelpText('List any factual errors or missing milestones')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Any corrections to the Executive Committee names / roles?')
    .setRequired(false);

  // ── Section 4: Missing Content ────────────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Missing Content')
    .setHelpText('What should be added to the souvenir?');

  var missingItem = form.addCheckboxItem();
  missingItem.setTitle('What content is missing from the souvenir?')
    .setChoices([
      missingItem.createChoice('Photo Gallery'),
      missingItem.createChoice('Past Vicars list'),
      missingItem.createChoice('Past Presidents list'),
      missingItem.createChoice('Founding members section'),
      missingItem.createChoice('Bishop / Metropolitan message'),
      missingItem.createChoice('Scripture / Prayer page'),
      missingItem.createChoice('Special Events / Programs page'),
      missingItem.createChoice('Donor / Sponsor acknowledgment'),
      missingItem.createChoice('Family directory'),
    ])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Any other content you would like to see added?')
    .setRequired(false);

  // ── Section 5: Specific Page Feedback ────────────────────────────
  form.addSectionHeaderItem()
    .setTitle('Page-by-Page Feedback')
    .setHelpText('Optional — give feedback on specific pages.');

  form.addParagraphTextItem()
    .setTitle('Cover Page feedback')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Messages Page feedback')
    .setHelpText('Metropolitan message, Vicar message')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('History & Milestones Page feedback')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Ministries Page feedback')
    .setRequired(false);

  // ── Section 6: Your Family Greeting ──────────────────────────────
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

  // ── Section 7: Advertisements ─────────────────────────────────────
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

  // ── Done ──────────────────────────────────────────────────────────
  var formUrl = form.getPublishedUrl();
  var editUrl = form.getEditUrl();

  Logger.log('✅ Form created successfully!');
  Logger.log('📋 Share this link: ' + formUrl);
  Logger.log('✏️  Edit form here: ' + editUrl);

  // Show a popup with the links
  var ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null;

  Browser.msgBox(
    'Form Created!',
    '✅ Your feedback form is ready.\n\n' +
    '📋 Share link:\n' + formUrl + '\n\n' +
    '✏️ Edit link:\n' + editUrl,
    Browser.Buttons.OK
  );
}
