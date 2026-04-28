import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, contact_id, value, stage, expected_close_date, notes, days_in_stage } = body;
    const id = params.id;

    const { rows } = await sql`
      UPDATE deals
      SET name = ${name}, contact_id = ${contact_id}, value = ${value}, 
          stage = ${stage}, expected_close_date = ${expected_close_date}, 
          notes = ${notes}, days_in_stage = ${days_in_stage || 0}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await sql`DELETE FROM deals WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
