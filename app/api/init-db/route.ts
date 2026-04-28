import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Create contacts table
    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create deals table
    await sql`
      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        value DECIMAL(10, 2) NOT NULL,
        stage VARCHAR(50) NOT NULL,
        expected_close_date DATE,
        notes TEXT,
        days_in_stage INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        start_date DATE,
        due_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create line_items table
    await sql`
      CREATE TABLE IF NOT EXISTS line_items (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        rate DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        due_date DATE NOT NULL,
        priority VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        linked_to VARCHAR(50) NOT NULL,
        linked_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create emails table
    await sql`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create automations table
    await sql`
      CREATE TABLE IF NOT EXISTS automations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        trigger VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_contact_id ON projects(contact_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_line_items_project_id ON line_items(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_contact_id ON emails(contact_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_linked_id ON tasks(linked_id)`;

    return NextResponse.json({ 
      message: 'Database initialized successfully',
      tables: ['contacts', 'deals', 'projects', 'line_items', 'tasks', 'emails', 'automations']
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
