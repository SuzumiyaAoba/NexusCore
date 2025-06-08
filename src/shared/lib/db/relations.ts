// Foreign key relations for the database schema
import { sql } from "drizzle-orm";

// Add foreign key constraints after table definitions to avoid circular references
interface DatabaseConnection {
  run(query: unknown): Promise<unknown>;
}

export const addForeignKeyConstraints = async (db: DatabaseConnection) => {
  // Add self-referencing foreign key for tasks.parentId
  await db.run(sql`
    PRAGMA foreign_keys = ON;
  `);

  // Create indexes for foreign keys
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
  `);

  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
  `);
};

// Export constraint SQL for migrations
export const parentTaskConstraint = sql`
  ALTER TABLE tasks ADD CONSTRAINT fk_tasks_parent_id 
  FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE;
`;

export const taskTagsConstraints = [
  sql`
    ALTER TABLE task_tags ADD CONSTRAINT fk_task_tags_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  `,
  sql`
    ALTER TABLE task_tags ADD CONSTRAINT fk_task_tags_tag_id 
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;
  `,
  sql`
    ALTER TABLE task_assignments ADD CONSTRAINT fk_task_assignments_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  `,
  sql`
    ALTER TABLE task_history ADD CONSTRAINT fk_task_history_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  `,
];
