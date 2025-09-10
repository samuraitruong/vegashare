import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const url = process.env.NEXT_PUBLIC_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
const authToken = process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

function getDb() {
  if (!url || !authToken) {
    throw new Error('Missing Turso credentials');
  }
  return createClient({ url, authToken });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12', 10)));
    const offset = (page - 1) * pageSize;

    const db = getDb();

    const totalRes = await db.execute(`SELECT COUNT(*) as c FROM tournament`);
    // libsql returns rows as objects
    const total = Number((totalRes.rows?.[0] as any)?.c ?? 0);

    const res = await db.execute({
      sql: `SELECT id, name, start_date, end_date, rounds, arbiter, location, folder_path, federation, created_at
            FROM tournament
            ORDER BY datetime(created_at) DESC
            LIMIT ? OFFSET ?`,
      args: [pageSize, offset]
    });

    const items = (res.rows || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      category: null,
      createdAt: r.created_at,
      data: {
        'Tournament Name': r.name,
        'Date Begin': r.start_date || '',
        'Date End': r.end_date || '',
        'Arbiter(s)': r.arbiter || '',
        'Place': r.location || '',
        'Rounds': r.rounds ?? '',
        'Federation': r.federation || ''
      },
      path: `www${r.folder_path ? '/' + r.folder_path : ''}/data.json`
    }));

    return NextResponse.json({ page, pageSize, total, items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


