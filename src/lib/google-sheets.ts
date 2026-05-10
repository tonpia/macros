import { google, sheets_v4 } from "googleapis";

function getAuth() {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64) throw new Error("GOOGLE_SERVICE_ACCOUNT_BASE64 not set");

  const credentials = JSON.parse(
    Buffer.from(base64, "base64").toString("utf-8")
  );

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets(): sheets_v4.Sheets {
  return google.sheets({ version: "v4", auth: getAuth() });
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SPREADSHEET_ID not set");
  return id;
}

function quoteTab(tab: string): string {
  return `'${tab}'`;
}

// ─── Generic CRUD operations ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRows<T = any>(
  tab: string,
  filter?: { date?: string }
): Promise<T[]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${quoteTab(tab)}!A:Z`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0] as string[];
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const val = row[i] ?? "";
      // Try to parse numbers
      if (val !== "" && !isNaN(Number(val))) {
        obj[h] = Number(val);
      } else {
        obj[h] = val;
      }
    });
    return obj as T;
  });

  if (filter?.date) {
    return data.filter((row) => (row as Record<string, unknown>).date === filter.date);
  }

  return data;
}

export async function appendRow(
  tab: string,
  data: Record<string, unknown>
): Promise<void> {
  const sheets = getSheets();

  // Get headers first
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${quoteTab(tab)}!1:1`,
  });

  const headers = headerRes.data.values?.[0] as string[];
  if (!headers) throw new Error(`No headers found in tab "${tab}"`);

  const row = headers.map((h) => {
    const val = data[h];
    return val !== undefined && val !== null ? String(val) : "";
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${quoteTab(tab)}!A:Z`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}

export async function updateRow(
  tab: string,
  id: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${quoteTab(tab)}!A:Z`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return false;

  const headers = rows[0] as string[];
  const idCol = headers.indexOf("id");
  if (idCol === -1) return false;

  const rowIndex = rows.findIndex((r, i) => i > 0 && r[idCol] === id);
  if (rowIndex === -1) return false;

  // Merge existing values with updates
  const existing: Record<string, unknown> = {};
  headers.forEach((h, i) => {
    existing[h] = rows[rowIndex][i] ?? "";
  });
  const merged = { ...existing, ...data };

  const updatedRow = headers.map((h) => {
    const val = merged[h];
    return val !== undefined && val !== null ? String(val) : "";
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${quoteTab(tab)}!A${rowIndex + 1}:Z${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [updatedRow] },
  });

  return true;
}

export async function deleteRow(tab: string, id: string): Promise<boolean> {
  const sheets = getSheets();
  const spreadsheetId = getSpreadsheetId();

  // Get all data to find the row
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteTab(tab)}!A:Z`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return false;

  const headers = rows[0] as string[];
  const idCol = headers.indexOf("id");
  if (idCol === -1) return false;

  const rowIndex = rows.findIndex((r, i) => i > 0 && r[idCol] === id);
  if (rowIndex === -1) return false;

  // Get sheet ID for the tab
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === tab
  );
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0)
    return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });

  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getLatestRow<T = any>(
  tab: string
): Promise<T | null> {
  const rows = await getRows<T>(tab);
  return rows.length > 0 ? rows[rows.length - 1] : null;
}
