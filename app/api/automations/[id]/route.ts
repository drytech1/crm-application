import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { enabled } = body;
    const id = params.id;

    const { rows } = await sql`
      UPDATE automations
      SET enabled = ${enabled}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await sql`DELETE FROM automations WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 });
  }
}
