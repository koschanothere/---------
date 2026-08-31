const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const AdmZip = require("adm-zip");
const Database = require("better-sqlite3");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

const APPROVAL_STATUSES = ["na", "approved", "pending", "not_sent"];
const PAYMENT_STATUSES = ["paid", "partial", "unpaid"];
const COMMENT_COLORS = ["pink", "violet"];
const DOC_TYPES = ["act", "invoice", "invoice_facture", "report", "outgoing_letter", "order", "waybill"];
const TABLE_COLUMNS = {
  objects: ["id", "name", "comment", "folder_created_date", "created_at"],
  contracts: ["id", "object_id", "number", "date", "amount", "status", "payment_status", "comment", "comment_color", "file_path", "original_filename", "created_at"],
  annexes: ["id", "contract_id", "date", "amount", "status", "payment_status", "file_path", "original_filename", "created_at"],
  secondary_documents: ["id", "parent_type", "parent_id", "doc_type", "date", "amount", "status", "payment_status", "file_path", "original_filename", "created_at"],
};
const FILE_TABLES = ["contracts", "annexes", "secondary_documents"];

function createStore(userDataPath) {
  const dataDir = path.join(userDataPath, "data");
  const filesDir = path.join(userDataPath, "files");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(filesDir, { recursive: true });

  const db = new Database(path.join(dataDir, "gureevdoc.sqlite"));
  db.pragma("foreign_keys = ON");
  migrate(db);

  const now = () => new Date().toISOString();

  function tableRows(table) {
    return db.prepare(`SELECT ${TABLE_COLUMNS[table].join(", ")} FROM ${table} ORDER BY id`).all();
  }

  function csvFor(table, rows) {
    const columns = FILE_TABLES.includes(table)
      ? [...TABLE_COLUMNS[table], "archive_file_path"]
      : TABLE_COLUMNS[table];
    return stringify(rows, { header: true, columns, bom: true });
  }

  function parseCsvEntry(zip, entryName) {
    const entry = zip.getEntry(entryName);
    if (!entry) return [];
    const content = entry.getData().toString("utf8");
    if (!content.trim()) return [];
    return parse(content, {
      columns: true,
      bom: true,
      skip_empty_lines: true,
    });
  }

  function sanitizeArchiveName(value) {
    return String(value || "file")
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140) || "file";
  }

  function makeArchiveFilePath(table, row) {
    const baseName = sanitizeArchiveName(row.original_filename || path.basename(row.file_path || ""));
    return `files/${table}/${row.id}-${baseName}`;
  }

  function copyImportedFile(zip, archiveFilePath, originalFilename) {
    if (!archiveFilePath) return null;
    const normalized = String(archiveFilePath).replace(/\\/g, "/");
    const entry = zip.getEntry(normalized);
    if (!entry || entry.isDirectory) return null;

    const extension = path.extname(originalFilename || normalized);
    const targetPath = path.join(filesDir, `${crypto.randomUUID()}${extension}`);
    fs.writeFileSync(targetPath, entry.getData());
    return targetPath;
  }

  function clearFilesDir() {
    fs.mkdirSync(filesDir, { recursive: true });
    for (const entry of fs.readdirSync(filesDir)) {
      fs.rmSync(path.join(filesDir, entry), { recursive: true, force: true });
    }
  }

  function normalizeImportedRow(row, table, zip) {
    const result = {};
    for (const column of TABLE_COLUMNS[table]) {
      if (column === "amount") {
        result[column] = normalizeMoney(row[column]);
      } else if (column.endsWith("_id") || column === "id" || column === "parent_id") {
        result[column] = Number(row[column]);
      } else {
        result[column] = row[column] === "" ? null : row[column];
      }
    }

    if (FILE_TABLES.includes(table)) {
      result.file_path = copyImportedFile(zip, row.archive_file_path, row.original_filename) || null;
    }

    if (table === "objects") {
      result.name = result.name || "";
      result.comment = result.comment || "";
    }

    if (table === "contracts") {
      result.number = result.number || "";
      result.comment = result.comment || "";
      result.comment_color = result.comment_color || "pink";
    }

    return result;
  }

  function insertRows(table, rows) {
    if (rows.length === 0) return;
    const columns = TABLE_COLUMNS[table];
    const placeholders = columns.map((column) => `@${column}`).join(", ");
    const statement = db.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`);
    for (const row of rows) {
      statement.run(row);
    }
  }

  function assertEnum(value, allowed, field) {
    if (!allowed.includes(value)) {
      throw new Error(`Некорректное значение ${field}: ${value}`);
    }
  }

  function normalizeMoney(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    if (Number.isNaN(number)) throw new Error("Сумма должна быть числом");
    return number;
  }

  function storeFile(sourceFilePath, originalFilename) {
    if (!sourceFilePath) {
      return { file_path: null, original_filename: originalFilename || null };
    }

    const extension = path.extname(originalFilename || sourceFilePath);
    const targetName = `${crypto.randomUUID()}${extension}`;
    const targetPath = path.join(filesDir, targetName);
    fs.copyFileSync(sourceFilePath, targetPath);
    return {
      file_path: targetPath,
      original_filename: originalFilename || path.basename(sourceFilePath),
    };
  }

  function listObjects() {
    return db.prepare(`
      SELECT
        o.*,
        COUNT(DISTINCT c.id) AS contracts_count,
        COUNT(DISTINCT a.id) AS annexes_count,
        COUNT(DISTINCT sd.id) AS secondary_count
      FROM objects o
      LEFT JOIN contracts c ON c.object_id = o.id
      LEFT JOIN annexes a ON a.contract_id = c.id
      LEFT JOIN secondary_documents sd ON
        (sd.parent_type = 'contract' AND sd.parent_id = c.id)
        OR (sd.parent_type = 'annex' AND sd.parent_id = a.id)
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all();
  }

  function createObject(payload) {
    const stmt = db.prepare(`
      INSERT INTO objects (name, comment, folder_created_date, created_at)
      VALUES (@name, @comment, @folder_created_date, @created_at)
    `);
    const info = stmt.run({
      name: String(payload.name || "").trim(),
      comment: payload.comment || "",
      folder_created_date: payload.folder_created_date || null,
      created_at: now(),
    });
    return getObjectDetails(info.lastInsertRowid);
  }

  function updateObject(payload) {
    db.prepare(`
      UPDATE objects
      SET name = @name, comment = @comment, folder_created_date = @folder_created_date
      WHERE id = @id
    `).run({
      id: payload.id,
      name: String(payload.name || "").trim(),
      comment: payload.comment || "",
      folder_created_date: payload.folder_created_date || null,
    });
    return getObjectDetails(payload.id);
  }

  function deleteObject(id) {
    db.prepare("DELETE FROM objects WHERE id = ?").run(id);
    return { ok: true };
  }

  function createContract(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.payment_status, PAYMENT_STATUSES, "payment_status");
    assertEnum(payload.comment_color || "pink", COMMENT_COLORS, "comment_color");
    const file = storeFile(payload.sourceFilePath, payload.original_filename);
    const info = db.prepare(`
      INSERT INTO contracts
        (object_id, number, date, amount, status, payment_status, comment, comment_color, file_path, original_filename, created_at)
      VALUES
        (@object_id, @number, @date, @amount, @status, @payment_status, @comment, @comment_color, @file_path, @original_filename, @created_at)
    `).run({
      object_id: payload.object_id,
      number: payload.number || "",
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      payment_status: payload.payment_status,
      comment: payload.comment || "",
      comment_color: payload.comment_color || "pink",
      file_path: file.file_path,
      original_filename: file.original_filename,
      created_at: now(),
    });
    return getContract(info.lastInsertRowid);
  }

  function updateContract(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.payment_status, PAYMENT_STATUSES, "payment_status");
    assertEnum(payload.comment_color || "pink", COMMENT_COLORS, "comment_color");
    db.prepare(`
      UPDATE contracts
      SET number = @number,
          date = @date,
          amount = @amount,
          status = @status,
          payment_status = @payment_status,
          comment = @comment,
          comment_color = @comment_color
      WHERE id = @id
    `).run({
      id: payload.id,
      number: payload.number || "",
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      payment_status: payload.payment_status,
      comment: payload.comment || "",
      comment_color: payload.comment_color || "pink",
    });
    return getContract(payload.id);
  }

  function deleteContract(id) {
    db.prepare("DELETE FROM contracts WHERE id = ?").run(id);
    return { ok: true };
  }

  function createAnnex(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.payment_status, PAYMENT_STATUSES, "payment_status");
    const file = storeFile(payload.sourceFilePath, payload.original_filename);
    const info = db.prepare(`
      INSERT INTO annexes
        (contract_id, date, amount, status, payment_status, file_path, original_filename, created_at)
      VALUES
        (@contract_id, @date, @amount, @status, @payment_status, @file_path, @original_filename, @created_at)
    `).run({
      contract_id: payload.contract_id,
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      payment_status: payload.payment_status,
      file_path: file.file_path,
      original_filename: file.original_filename,
      created_at: now(),
    });
    return getAnnex(info.lastInsertRowid);
  }

  function updateAnnex(payload) {
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.payment_status, PAYMENT_STATUSES, "payment_status");
    db.prepare(`
      UPDATE annexes
      SET date = @date, amount = @amount, status = @status, payment_status = @payment_status
      WHERE id = @id
    `).run({
      id: payload.id,
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      payment_status: payload.payment_status,
    });
    return getAnnex(payload.id);
  }

  function deleteAnnex(id) {
    db.prepare("DELETE FROM annexes WHERE id = ?").run(id);
    return { ok: true };
  }

  function createSecondaryDocument(payload) {
    assertEnum(payload.parent_type, ["contract", "annex"], "parent_type");
    assertEnum(payload.doc_type, DOC_TYPES, "doc_type");
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.payment_status, PAYMENT_STATUSES, "payment_status");
    const file = storeFile(payload.sourceFilePath, payload.original_filename);
    const info = db.prepare(`
      INSERT INTO secondary_documents
        (parent_type, parent_id, doc_type, date, amount, status, payment_status, file_path, original_filename, created_at)
      VALUES
        (@parent_type, @parent_id, @doc_type, @date, @amount, @status, @payment_status, @file_path, @original_filename, @created_at)
    `).run({
      parent_type: payload.parent_type,
      parent_id: payload.parent_id,
      doc_type: payload.doc_type,
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      payment_status: payload.payment_status,
      file_path: file.file_path,
      original_filename: file.original_filename,
      created_at: now(),
    });
    return getSecondaryDocument(info.lastInsertRowid);
  }

  function updateSecondaryDocument(payload) {
    assertEnum(payload.doc_type, DOC_TYPES, "doc_type");
    assertEnum(payload.status, APPROVAL_STATUSES, "status");
    assertEnum(payload.payment_status, PAYMENT_STATUSES, "payment_status");
    db.prepare(`
      UPDATE secondary_documents
      SET doc_type = @doc_type, date = @date, amount = @amount, status = @status, payment_status = @payment_status
      WHERE id = @id
    `).run({
      id: payload.id,
      doc_type: payload.doc_type,
      date: payload.date || null,
      amount: normalizeMoney(payload.amount),
      status: payload.status,
      payment_status: payload.payment_status,
    });
    return getSecondaryDocument(payload.id);
  }

  function deleteSecondaryDocument(id) {
    db.prepare("DELETE FROM secondary_documents WHERE id = ?").run(id);
    return { ok: true };
  }

  function exportAllData(targetPath) {
    const zip = new AdmZip();
    const counts = {};

    zip.addFile("manifest.json", Buffer.from(JSON.stringify({
      app: "GureevDoc",
      version: 1,
      exported_at: now(),
      metadata: Object.keys(TABLE_COLUMNS).map((table) => `metadata/${table}.csv`),
    }, null, 2), "utf8"));

    for (const table of Object.keys(TABLE_COLUMNS)) {
      const rows = tableRows(table).map((row) => ({ ...row }));
      counts[table] = rows.length;

      if (FILE_TABLES.includes(table)) {
        for (const row of rows) {
          row.archive_file_path = "";
          if (row.file_path && fs.existsSync(row.file_path)) {
            row.archive_file_path = makeArchiveFilePath(table, row);
            zip.addFile(row.archive_file_path, fs.readFileSync(row.file_path));
          }
        }
      }

      zip.addFile(`metadata/${table}.csv`, Buffer.from(csvFor(table, rows), "utf8"));
    }

    zip.writeZip(targetPath);
    return { ok: true, path: targetPath, counts };
  }

  function importAllData(sourcePath) {
    const zip = new AdmZip(sourcePath);
    const rawRows = {
      objects: parseCsvEntry(zip, "metadata/objects.csv"),
      contracts: parseCsvEntry(zip, "metadata/contracts.csv"),
      annexes: parseCsvEntry(zip, "metadata/annexes.csv"),
      secondary_documents: parseCsvEntry(zip, "metadata/secondary_documents.csv"),
    };

    let counts = {};

    const applyImport = db.transaction(() => {
      db.prepare("DELETE FROM secondary_documents").run();
      db.prepare("DELETE FROM annexes").run();
      db.prepare("DELETE FROM contracts").run();
      db.prepare("DELETE FROM objects").run();
      clearFilesDir();

      const objects = rawRows.objects.map((row) => normalizeImportedRow(row, "objects", zip));
      const contracts = rawRows.contracts.map((row) => normalizeImportedRow(row, "contracts", zip));
      const annexes = rawRows.annexes.map((row) => normalizeImportedRow(row, "annexes", zip));
      const secondaryDocuments = rawRows.secondary_documents.map((row) => normalizeImportedRow(row, "secondary_documents", zip));

      insertRows("objects", objects);
      insertRows("contracts", contracts);
      insertRows("annexes", annexes);
      insertRows("secondary_documents", secondaryDocuments);

      counts = {
        objects: objects.length,
        contracts: contracts.length,
        annexes: annexes.length,
        secondary_documents: secondaryDocuments.length,
      };
    });

    applyImport();

    return { ok: true, counts };
  }

  function getContract(id) {
    return db.prepare("SELECT * FROM contracts WHERE id = ?").get(id);
  }

  function getAnnex(id) {
    return db.prepare("SELECT * FROM annexes WHERE id = ?").get(id);
  }

  function getSecondaryDocument(id) {
    return db.prepare("SELECT * FROM secondary_documents WHERE id = ?").get(id);
  }

  function getObjectDetails(id) {
    const object = db.prepare("SELECT * FROM objects WHERE id = ?").get(id);
    if (!object) return null;

    const contracts = db.prepare("SELECT * FROM contracts WHERE object_id = ? ORDER BY date DESC, created_at DESC").all(id);
    const annexStmt = db.prepare("SELECT * FROM annexes WHERE contract_id = ? ORDER BY date DESC, created_at DESC");
    const docsForContract = db.prepare("SELECT * FROM secondary_documents WHERE parent_type = 'contract' AND parent_id = ? ORDER BY date DESC, created_at DESC");
    const docsForAnnex = db.prepare("SELECT * FROM secondary_documents WHERE parent_type = 'annex' AND parent_id = ? ORDER BY date DESC, created_at DESC");

    object.contracts = contracts.map((contract) => {
      const annexes = annexStmt.all(contract.id).map((annex) => ({
        ...annex,
        documents: docsForAnnex.all(annex.id),
      }));

      return {
        ...contract,
        annexes,
        documents: docsForContract.all(contract.id),
      };
    });

    return object;
  }

  function listRegistryDocuments() {
    return db.prepare(`
      SELECT * FROM (
        SELECT
          'contract' AS source_type,
          c.id AS source_id,
          o.id AS object_id,
          o.name AS object_name,
          c.id AS contract_id,
          c.number AS contract_number,
          NULL AS annex_id,
          NULL AS annex_label,
          'contract' AS doc_type,
          'primary' AS category,
          c.date,
          c.amount,
          c.status,
          c.payment_status,
          c.file_path,
          c.original_filename
        FROM contracts c
        JOIN objects o ON o.id = c.object_id

        UNION ALL

        SELECT
          'annex' AS source_type,
          a.id AS source_id,
          o.id AS object_id,
          o.name AS object_name,
          c.id AS contract_id,
          c.number AS contract_number,
          a.id AS annex_id,
          'ДС ' || a.id AS annex_label,
          'annex' AS doc_type,
          'primary' AS category,
          a.date,
          a.amount,
          a.status,
          a.payment_status,
          a.file_path,
          a.original_filename
        FROM annexes a
        JOIN contracts c ON c.id = a.contract_id
        JOIN objects o ON o.id = c.object_id

        UNION ALL

        SELECT
          'secondary' AS source_type,
          sd.id AS source_id,
          o.id AS object_id,
          o.name AS object_name,
          c.id AS contract_id,
          c.number AS contract_number,
          NULL AS annex_id,
          NULL AS annex_label,
          sd.doc_type,
          'secondary' AS category,
          sd.date,
          sd.amount,
          sd.status,
          sd.payment_status,
          sd.file_path,
          sd.original_filename
        FROM secondary_documents sd
        JOIN contracts c ON sd.parent_type = 'contract' AND sd.parent_id = c.id
        JOIN objects o ON o.id = c.object_id

        UNION ALL

        SELECT
          'secondary' AS source_type,
          sd.id AS source_id,
          o.id AS object_id,
          o.name AS object_name,
          c.id AS contract_id,
          c.number AS contract_number,
          a.id AS annex_id,
          'ДС ' || a.id AS annex_label,
          sd.doc_type,
          'secondary' AS category,
          sd.date,
          sd.amount,
          sd.status,
          sd.payment_status,
          sd.file_path,
          sd.original_filename
        FROM secondary_documents sd
        JOIN annexes a ON sd.parent_type = 'annex' AND sd.parent_id = a.id
        JOIN contracts c ON c.id = a.contract_id
        JOIN objects o ON o.id = c.object_id
      )
      ORDER BY date DESC, source_id DESC
    `).all();
  }

  return {
    listObjects,
    getObjectDetails,
    createObject,
    updateObject,
    deleteObject,
    createContract,
    updateContract,
    deleteContract,
    createAnnex,
    updateAnnex,
    deleteAnnex,
    createSecondaryDocument,
    updateSecondaryDocument,
    deleteSecondaryDocument,
    listRegistryDocuments,
    exportAllData,
    importAllData,
  };
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS objects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      folder_created_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      object_id INTEGER NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
      number TEXT NOT NULL DEFAULT '',
      date TEXT,
      amount REAL,
      status TEXT NOT NULL CHECK (status IN ('na', 'approved', 'pending', 'not_sent')),
      payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
      comment TEXT NOT NULL DEFAULT '',
      comment_color TEXT NOT NULL DEFAULT 'pink' CHECK (comment_color IN ('pink', 'violet')),
      file_path TEXT,
      original_filename TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS annexes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      date TEXT,
      amount REAL,
      status TEXT NOT NULL CHECK (status IN ('na', 'approved', 'pending', 'not_sent')),
      payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
      file_path TEXT,
      original_filename TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS secondary_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_type TEXT NOT NULL CHECK (parent_type IN ('contract', 'annex')),
      parent_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL CHECK (doc_type IN ('act', 'invoice', 'invoice_facture', 'report', 'outgoing_letter', 'order', 'waybill')),
      date TEXT,
      amount REAL,
      status TEXT NOT NULL CHECK (status IN ('na', 'approved', 'pending', 'not_sent')),
      payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
      file_path TEXT,
      original_filename TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_contracts_object ON contracts(object_id);
    CREATE INDEX IF NOT EXISTS idx_annexes_contract ON annexes(contract_id);
    CREATE INDEX IF NOT EXISTS idx_secondary_parent ON secondary_documents(parent_type, parent_id);
  `);
}

module.exports = { createStore };
