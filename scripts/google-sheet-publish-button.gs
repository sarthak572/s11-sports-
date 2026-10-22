// Google Apps Script for the product sheet: adds a "Website → Publish changes" menu
// that rebuilds the site right away instead of waiting for the hourly update.
//
// Setup (once): in the sheet open Extensions → Apps Script, paste this file, then
// Project Settings → Script Properties → add GITHUB_TOKEN = a fine-grained GitHub token
// limited to this repository with "Actions: Read and write" permission.

const GITHUB_REPO = 'sarthak572/s11-sports-';
const WORKFLOW_FILE = 'nextjs.yml';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Publish changes', 'publishWebsite')
    .addToUi();
}

function publishWebsite() {
  const ui = SpreadsheetApp.getUi();
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    ui.alert('GITHUB_TOKEN is not set in Project Settings → Script Properties.');
    return;
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
  if (res.getResponseCode() === 204) {
    ui.alert('Publishing started. The website will show your changes in about 3–5 minutes.');
  } else {
    ui.alert(`Could not publish (error ${res.getResponseCode()}): ${res.getContentText()}`);
  }
}
