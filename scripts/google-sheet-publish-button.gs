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

// One-time setup: creates a formatted tab per website category and moves the products from
// the old single "all products" tab into them. The old tab is kept (hidden) as a backup.
// Run it from the Apps Script editor (select setupCategoryTabs → Run). Tabs that already
// exist are left untouched, so it is safe to run again after adding a category below.
// Category names must match data/site.json in the website code.
const CATEGORIES = [
  { name: 'Cricket', subcategories: ['Bats', 'Balls', 'Pads', 'Gloves', 'Helmets', 'Kits', 'Apparel'] },
  { name: 'Badminton', subcategories: ['Rackets', 'Shuttles', 'Strings', 'Bags', 'Shoes'] },
  { name: 'Football', subcategories: ['Footballs', 'Boots', 'Shin Guards', 'Goalkeeper Gear'] },
  { name: 'Gym and Fitness', subcategories: ['Dumbbells', 'Resistance Bands', 'Mats', 'Gloves', 'Supplements Shakers'] },
  { name: 'Tennis and Table Tennis', subcategories: ['Tennis Rackets', 'Table Tennis Bats', 'Balls'] },
  { name: 'Indoor Games', subcategories: ['Carrom', 'Chess'] },
  { name: 'Athletics and Running', subcategories: ['Running Shoes', 'Apparel', 'Spikes'] },
  { name: 'Footwear', subcategories: ['Cricket Shoes', 'Badminton Shoes', 'Football Boots', 'Running Shoes'] },
  { name: 'Apparel', subcategories: ['Jerseys', 'Shorts', 'Trackpants', 'Socks'] },
  { name: 'Accessories', subcategories: ['Bags', 'Bottles', 'Supports', 'Grips'] },
];

// [header, width in px, help note shown when hovering the header]
const PRODUCT_COLUMNS = [
  ['show', 70, 'yes = shown on the website, no = hidden (row turns grey). Empty also means shown.'],
  ['name', 240, 'Product name as shown on the website.'],
  ['brand', 110, 'Brand, e.g. SG, Yonex, Nivia.'],
  ['subcategory', 150, 'Pick from the list. These match the sub-sections on the website.'],
  ['price', 95, 'Selling price in rupees. Numbers only, e.g. 1299.'],
  ['compare_price', 115, 'Optional. Old price / MRP, shown crossed out next to the price.'],
  ['price_cad', 95, 'Price in Canadian dollars for visitors from Canada.'],
  ['sizes', 150, 'Optional. Sizes or options separated by commas, e.g. S, M, L.'],
  ['tags', 130, 'Optional. new = "New" badge, bestseller = shown on the home page.'],
  ['images', 280, 'Google Drive photo link(s). The photo (or its folder) must be shared as "Anyone with the link". Several links: separate with a space.'],
  ['description', 320, 'Product description shown on the product page.'],
  ['specs', 280, 'Optional. Format: Material: Willow; Weight: 1.2 kg'],
  ['id', 70, 'Internal ID used by the website. Leave as is; empty is fine for new products.'],
];

function setupCategoryTabs() {
  const ss = SpreadsheetApp.getActive();
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // The old layout: one tab holding every product with a "category" column.
  const source = ss.getSheets().find((sh) => {
    const header = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
    return header.map((h) => String(h).trim().toLowerCase()).includes('category');
  });
  const sourceData = source ? source.getDataRange().getValues() : [[]];
  const sourceHeader = sourceData[0].map((h) => String(h).trim().toLowerCase());
  const sourceCol = (name) => sourceHeader.indexOf(name);

  const created = [];
  CATEGORIES.forEach((cat, i) => {
    if (ss.getSheetByName(cat.name)) return;
    const sheet = ss.insertSheet(cat.name, i);
    const rows = sourceData.slice(1)
      .filter((r) => sourceCol('category') !== -1 && slug(r[sourceCol('category')]) === slug(cat.name))
      .map((r) => PRODUCT_COLUMNS.map(([h]) => (sourceCol(h) === -1 ? '' : r[sourceCol(h)])));
    formatProductTab_(sheet, cat, rows);
    created.push(`${cat.name} (${rows.length})`);
  });

  if (source && created.length) {
    source.setName('Backup - old all products');
    source.setTabColor('#9ca3af');
    ss.setActiveSheet(source);
    ss.moveActiveSheet(ss.getNumSheets());
    source.hideSheet();
  }
  const publish = ss.getSheetByName('Publish');
  if (publish) {
    ss.setActiveSheet(publish);
    ss.moveActiveSheet(1);
  }
  console.log(created.length ? `Created tabs: ${created.join(', ')}` : 'All category tabs already exist.');
}

function formatProductTab_(sheet, category, rows) {
  const cols = PRODUCT_COLUMNS.length;
  const maxRows = 500;
  if (sheet.getMaxRows() < maxRows) sheet.insertRowsAfter(sheet.getMaxRows(), maxRows - sheet.getMaxRows());
  if (sheet.getMaxColumns() > cols) sheet.deleteColumns(cols + 1, sheet.getMaxColumns() - cols);
  const col = (name) => PRODUCT_COLUMNS.findIndex(([h]) => h === name) + 1;
  const body = (name) => sheet.getRange(2, col(name), maxRows - 1, 1);

  const header = sheet.getRange(1, 1, 1, cols);
  header.setValues([PRODUCT_COLUMNS.map(([h]) => h)]);
  if (rows.length) sheet.getRange(2, 1, rows.length, cols).setValues(rows);

  sheet.getRange(1, 1, maxRows, cols)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor('#1f2937')
    .setFirstRowColor('#ffffff')
    .setSecondRowColor('#f3f4f6');
  header.setFontColor('#ffffff').setFontWeight('bold').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  sheet.getRange(2, 1, maxRows - 1, cols).setVerticalAlignment('middle').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  PRODUCT_COLUMNS.forEach(([, width, note], i) => {
    sheet.setColumnWidth(i + 1, width);
    sheet.getRange(1, i + 1).setNote(note);
  });

  const list = (values, strict, help) => SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true).setAllowInvalid(!strict).setHelpText(help).build();
  body('show').setDataValidation(list(['yes', 'no'], true, 'Choose yes (show) or no (hide).')).setHorizontalAlignment('center');
  body('subcategory').setDataValidation(list(category.subcategories, false, `Sub-sections of ${category.name} on the website.`));
  body('tags').setDataValidation(list(['new', 'bestseller', 'new, bestseller'], true, 'Leave empty, or choose new / bestseller.'));
  const price = SpreadsheetApp.newDataValidation().requireNumberGreaterThan(0).setAllowInvalid(false)
    .setHelpText('Enter a number only, e.g. 1299').build();
  ['price', 'compare_price', 'price_cad'].forEach((name) => body(name).setDataValidation(price));
  body('price').setNumberFormat('"₹"#,##0');
  body('compare_price').setNumberFormat('"₹"#,##0');
  body('price_cad').setNumberFormat('"CA$"#,##0.00');
  body('id').setFontColor('#9ca3af');
  body('id').protect().setDescription('Website product ID').setWarningOnly(true);

  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$A2="no"')
      .setFontColor('#9ca3af').setStrikethrough(true)
      .setRanges([sheet.getRange(2, 1, maxRows - 1, cols)])
      .build(),
  ]);
  sheet.getRange(1, 1, maxRows, cols).createFilter();
  sheet.setTabColor('#16a34a');
}
