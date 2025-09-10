import { readFile } from 'fs/promises';
import { createClient } from '@libsql/client';
import { join, isAbsolute } from 'path';

function resolvePath(p) {
  if (isAbsolute(p)) return p;
  if (process.cwd().endsWith('/cli/vega-cli')) {
    return join(process.cwd(), '..', '..', p);
  }
  return join(process.cwd(), p);
}

async function ensureSchema(db, verbose) {
  // Fresh, simple schema; idempotent via IF NOT EXISTS
  await db.execute(`CREATE TABLE IF NOT EXISTS tournament (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    rounds INTEGER,
    arbiter TEXT,
    location TEXT,
    folder_path TEXT,
    federation TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );`);

  // Players are a master list; no tournament linkage
  await db.execute(`CREATE TABLE IF NOT EXISTS player (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    fide_id TEXT,
    national_id TEXT
  );`);
  if (verbose) console.log('✅ Ensured database schema');
}

function extractTournament(json) {
  const t = json?.tournament || {};
  const m = t?.metadata || {};
  const name = t?.name || m['Tournament Name'] || '';

  // prefer normalized fields if present; fallback to raw strings
  const startDate = t?.metadata?.dateBegin || m['Date Begin'] || m['dateBegin'] || null;
  const endDate = t?.metadata?.dateEnd || m['Date End'] || m['dateEnd'] || null;
  const rounds = Number(t?.metadata?.rounds || m['Rounds'] || 0) || null;
  const arbiter = t?.metadata?.arbiters || m['Arbiter(s)'] || m['arbiters'] || null;
  const location = m['Place'] || m['Location'] || null;
  const federation = t?.metadata?.federation || m['Federation'] || null;
  const folderPath = t?.folder || null;
  const id = t?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return { id, name, startDate, endDate, rounds, arbiter, location, federation, folderPath };
}

function extractPlayers(json) {
  // Expect json.players or fall back to pages['standings.html'] table rows
  const players = Array.isArray(json?.players) ? json.players : [];
  if (players.length > 0) return players.map(toPlayerShape);

  const standingsRows = json?.page?.['standings.html']?.tables?.[0]?.rows || [];
  return standingsRows.map(toPlayerShape);
}

function toPlayerShape(row) {
  // row could be normalized player or a row with nested Player object
  const nameRaw = row?.name || row?.playerName || row?.Player?.playerName || row?.Player || row?.Name || '';
  const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
  const fideId = String(row?.fideId || row?.Player?.fideId || row?.FideId || row?.FIDEID || '').replace(/[^0-9]/g, '') || null;
  const nationalId = String(row?.nationalId || row?.Player?.nationalId || row?.AUSID || row?.NatID || '').replace(/[^0-9]/g, '') || null;
  // Row id is based solely on name for now
  const id = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
  return { id, name, fideId, nationalId };
}

async function upsertTournament(db, t) {
  await db.execute({
    sql: `INSERT INTO tournament (id, name, start_date, end_date, rounds, arbiter, location, folder_path, federation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            start_date=excluded.start_date,
            end_date=excluded.end_date,
            rounds=excluded.rounds,
            arbiter=excluded.arbiter,
            location=excluded.location,
            folder_path=excluded.folder_path,
            federation=excluded.federation`,
    args: [t.id, t.name, t.startDate, t.endDate, t.rounds, t.arbiter, t.location, t.folderPath, t.federation]
  });
}

async function upsertPlayers(db, players) {
  const filtered = players.filter(p => p?.name);
  if (filtered.length === 0) return;

  // Batch in chunks to reduce round-trips
  const CHUNK_SIZE = 100;
  const tx = await db.transaction();
  try {
    for (let i = 0; i < filtered.length; i += CHUNK_SIZE) {
      const chunk = filtered.slice(i, i + CHUNK_SIZE);
      const valuesPlaceholders = chunk.map(() => '(?, ?, ?, ?)').join(',');
      const sql = `INSERT INTO player (id, name, fide_id, national_id)
                   VALUES ${valuesPlaceholders}
                   ON CONFLICT(id) DO UPDATE SET
                     name=excluded.name,
                     fide_id=excluded.fide_id,
                     national_id=excluded.national_id`;
      const args = [];
      for (const p of chunk) {
        args.push(p.id, p.name, p.fideId, p.nationalId);
      }
      await tx.execute({ sql, args });
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

export async function upsertDb({ file, verbose = false }) {
  const dbUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
  const dbAuth = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
  if (!dbUrl || !dbAuth) {
    throw new Error('Missing Turso credentials. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN');
  }

  const filePath = resolvePath(file);
  if (verbose) console.log(`📄 Reading JSON from: ${filePath}`);
  const raw = await readFile(filePath, 'utf-8');
  const json = JSON.parse(raw);

  const t = extractTournament(json);
  const players = extractPlayers(json);
  if (verbose) console.log(`📊 Tournament: ${t.name} (${t.id}), Players: ${players.length}`);

  const db = createClient({ url: dbUrl, authToken: dbAuth });
  await ensureSchema(db, verbose);
  await upsertTournament(db, t);
  await upsertPlayers(db, players);
  if (verbose) console.log('✅ Upsert completed');
}

export const commandConfig = {
  command: 'upsert-db',
  describe: 'Upsert tournament and player data to Turso from a JSON file',
  builder: (yargs) =>
    yargs
      .option('file', {
        alias: 'f',
        type: 'string',
        demandOption: true,
        describe: 'Path to JSON file (e.g., www/xxx/data_clean.json)'
      })
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        default: false,
        describe: 'Verbose logging'
      }),
  handler: async (argv) => {
    try {
      await upsertDb({ file: argv.file, verbose: argv.verbose });
    } catch (e) {
      console.error(`❌ Upsert failed: ${e.message}`);
      process.exit(1);
    }
  }
};


