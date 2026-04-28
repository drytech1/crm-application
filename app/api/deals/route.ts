import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT * FROM deals ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact_id, value, stage, expected_close_date, notes } = body;

    const { rows } = await sql`
      INSERT INTO deals (name, contact_id, value, stage, expected_close_date, notes, days_in_stage)
      VALUES (${name}, ${contact_id}, ${value}, ${stage}, ${expected_close_date}, ${notes}, 0)
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
