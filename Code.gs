/*************************************************
 * UCAPAN RSVP - Melia & Titok
 * Spreadsheet: https://docs.google.com/spreadsheets/d/13wOjnCuSVgoQw6m4Qyx318MZ_l_Ku5YlvasJYge5GdI/edit?gid=0#gid=0
 * Sheet: Sheet1
 * Kolom: 1 timestamp | 2 nama tamu | 3 ucapan | 4 konfirmasi kehadiran | 5 jumlah tamu
 *
 * CARA PAKAI:
 * 1. Buka https://script.google.com -> New project -> paste file ini
 * 2. Jalankan setupSheet() sekali (Run) untuk buat header
 * 3. Deploy -> New deployment -> type Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy URL Web App (https://script.google.com/macros/s/.../exec)
 *    -> paste ke GS_URL di index.html (cari const GS_URL)
 *************************************************/

var SPREADSHEET_ID = '13wOjnCuSVgoQw6m4Qyx318MZ_l_Ku5YlvasJYge5GdI';
var SHEET_NAME = 'Sheet1';
var HEADERS = ['timestamp', 'nama tamu', 'ucapan', 'konfirmasi kehadiran', 'jumlah tamu'];

function setupSheet() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else {
    var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    var empty = firstRow.every(function (v) { return v === ''; });
    if (empty) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || 'list';
  if (action === 'add') {
    return addUcapan(p);
  }
  if (action === 'list') {
    return listUcapan();
  }
  if (action === 'info') {
    var sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    return jsonOut({ result: 'success', spreadsheetId: SPREADSHEET_ID, sheet: SHEET_NAME, lastRow: sh ? sh.getLastRow() : -1 });
  }
  return jsonOut({ result: 'ok', action: action });
}

function addUcapan(obj) {
  var nama = String(obj.nama || obj.author || '').trim();
  var ucapan = String(obj.ucapan || obj.comment || '').trim();
  var kehadiran = String(obj.kehadiran || obj.attendance || '').trim();
  var jumlah = String(obj.jumlah || obj.guest || '').trim();

  if (nama.length < 2) return jsonOut({ result: 'error', message: 'Nama minimal 2 karakter' });
  if (ucapan.length < 2) return jsonOut({ result: 'error', message: 'Ucapan minimal 2 karakter' });

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(SHEET_NAME);
  sheet.appendRow([new Date(), nama, ucapan, kehadiran, jumlah]);
  return jsonOut({ result: 'success', message: 'Terima kasih atas ucapan Anda!' });
}

function listUcapan() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return jsonOut({ result: 'success', data: [] });
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonOut({ result: 'success', data: [] });
  var values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var data = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (!r[1] && !r[2]) continue; // lewati baris kosong
    data.push({
      timestamp: r[0] instanceof Date ? Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : String(r[0] || ''),
      nama: String(r[1] || ''),
      ucapan: String(r[2] || ''),
      kehadiran: String(r[3] || ''),
      jumlah: String(r[4] || '')
    });
  }
  data.reverse(); // terbaru di atas
  return jsonOut({ result: 'success', data: data });
}

function doPost(e) {
  try {
    var obj = {};
    if (e && e.postData && e.postData.contents) {
      obj = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      obj = e.parameter;
    }
    return addUcapan(obj);
  } catch (err) {
    return jsonOut({ result: 'error', message: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
