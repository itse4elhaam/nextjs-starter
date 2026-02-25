import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const examples = pgTable("examples", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 256 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
