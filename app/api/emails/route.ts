import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT * FROM emails ORDER BY sent_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contact_id, subject, body: emailBody } = body;

    const { rows } = await sql`
      INSERT INTO emails (contact_id, subject, body)
      VALUES (${contact_id}, ${subject}, ${emailBody})
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating email:', error);
    return NextResponse.json({ error: 'Failed to create email' }, { status: 500 });
  }
}
