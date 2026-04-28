import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, address, city, state, zip_code } = body;

    const { rows } = await sql`
      UPDATE contacts
      SET name = ${name}, email = ${email}, phone = ${phone}, 
          address = ${address}, city = ${city}, state = ${state}, zip_code = ${zip_code}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sql`DELETE FROM contacts WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
