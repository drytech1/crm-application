import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, contact_id, status, start_date, due_date, notes, charges } = body;

    const { rows } = await sql`
      UPDATE projects
      SET name = ${name}, contact_id = ${contact_id}, status = ${status}, 
          start_date = ${start_date}, due_date = ${due_date}, notes = ${notes}
      WHERE id = ${id}
      RETURNING *
    `;

    // Delete existing line items
    await sql`DELETE FROM line_items WHERE project_id = ${id}`;

    // Insert new line items
    if (charges && charges.length > 0) {
      for (const charge of charges) {
        await sql`
          INSERT INTO line_items (project_id, description, quantity, rate)
          VALUES (${id}, ${charge.description}, ${charge.quantity}, ${charge.rate})
        `;
      }
    }

    // Fetch the complete project with charges
    const { rows: chargeRows } = await sql`
      SELECT * FROM line_items WHERE project_id = ${id}
    `;

    return NextResponse.json({ ...rows[0], charges: chargeRows });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sql`DELETE FROM line_items WHERE project_id = ${id}`;
    await sql`DELETE FROM projects WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
