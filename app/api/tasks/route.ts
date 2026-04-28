import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT * FROM tasks ORDER BY due_date ASC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, due_date, priority, status, linked_to, linked_id } = body;

    const { rows } = await sql`
      INSERT INTO tasks (name, due_date, priority, status, linked_to, linked_id)
      VALUES (${name}, ${due_date}, ${priority}, ${status}, ${linked_to}, ${linked_id})
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
