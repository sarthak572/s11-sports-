// Google Apps Script for the product sheet. Adds a "Website" menu with:
//   - Publish changes now: rebuilds the site right away (also usable from a button drawn in the sheet)
//   - Turn on auto-publish: publishes automatically a few minutes after people stop editing
// The site also rebuilds once a day on its own (see .github/workflows/nextjs.yml).
//
// Setup (once): in the sheet open Extensions → Apps Script, paste this file, then
// Project Settings → Script Properties → add GITHUB_TOKEN = a fine-grained GitHub token
// limited to this repository with "Actions: Read and write" permission.

const GITHUB_REPO = 'sarthak572/s11-sports-';
const WORKFLOW_FILE = 'nextjs.yml';
// Auto-publish waits until nobody has edited the sheet for this long, so a burst of edits
// becomes one website update.
const AUTO_PUBLISH_QUIET_MINUTES = 10;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Publish changes now', 'publishWebsite')
    .addSeparator()
    .addItem('Turn on auto-publish', 'enableAutoPublish')
    .addItem('Turn off auto-publish', 'disableAutoPublish')
    .addToUi();
}

function publishWebsite() {
  const result = triggerBuild_();
  SpreadsheetApp.getUi().alert(result.ok
    ? 'Publishing started. The website will show your changes in about 3–5 minutes.'
    : result.message);
}

function triggerBuild_() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  if (!token) {
    return { ok: false, message: 'GITHUB_TOKEN is not set in Project Settings → Script Properties.' };
  }
  const res = UrlFetchApp.fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      payload: JSON.stringify({ ref: 'main' }),
      muteHttpExceptions: true,
    },
  );
  if (res.getResponseCode() !== 204) {
    return { ok: false, message: `Could not publish (error ${res.getResponseCode()}): ${res.getContentText()}` };
  }
  props.setProperty('LAST_PUBLISH', String(Date.now()));
  return { ok: true };
}

// Auto-publish: a change trigger records when the sheet was last edited, and a timer
// publishes once edits have stopped and something changed since the last publish.
const AUTO_PUBLISH_HANDLERS = ['recordSheetChange', 'autoPublishIfChanged'];

function enableAutoPublish() {
  removeAutoPublishTriggers_();
  ScriptApp.newTrigger('recordSheetChange').forSpreadsheet(SpreadsheetApp.getActive()).onChange().create();
  ScriptApp.newTrigger('autoPublishIfChanged').timeBased().everyMinutes(10).create();
  SpreadsheetApp.getUi().alert(
    `Auto-publish is on. The website will update about ${AUTO_PUBLISH_QUIET_MINUTES}–20 minutes after you finish editing.`);
}

function disableAutoPublish() {
  removeAutoPublishTriggers_();
  SpreadsheetApp.getUi().alert('Auto-publish is off. Use Website → Publish changes now, or wait for the daily update.');
}

function removeAutoPublishTriggers_() {
  for (const t of ScriptApp.getProjectTriggers()) {
    if (AUTO_PUBLISH_HANDLERS.includes(t.getHandlerFunction())) ScriptApp.deleteTrigger(t);
  }
}

function recordSheetChange() {
  PropertiesService.getScriptProperties().setProperty('LAST_EDIT', String(Date.now()));
}

function autoPublishIfChanged() {
  const props = PropertiesService.getScriptProperties();
  const lastEdit = Number(props.getProperty('LAST_EDIT') || 0);
  const lastPublish = Number(props.getProperty('LAST_PUBLISH') || 0);
  if (lastEdit <= lastPublish) return; // nothing changed since the last publish
  if (Date.now() - lastEdit < AUTO_PUBLISH_QUIET_MINUTES * 60 * 1000) return; // still being edited
  const result = triggerBuild_();
  if (!result.ok) console.error(result.message);
}
