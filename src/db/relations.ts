import { relations } from "drizzle-orm/relations";
import { routes, pireps, users } from "./schema";

export const pirepsRelations = relations(pireps, ({one}) => ({
	route: one(routes, {
		fields: [pireps.flightNumber],
		references: [routes.flightNumber]
	}),
	user: one(users, {
		fields: [pireps.userId],
		references: [users.id]
	}),
}));

export const routesRelations = relations(routes, ({many}) => ({
	pireps: many(pireps),
}));

export const usersRelations = relations(users, ({many}) => ({
	pireps: many(pireps),
}));