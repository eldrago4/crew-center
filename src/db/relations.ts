import { relations } from "drizzle-orm/relations";
import { users, pireps } from "./schema";

export const pirepsRelations = relations(pireps, ({ one }) => ({
	user: one(users, {
		fields: [pireps.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	pireps: many(pireps),
}));