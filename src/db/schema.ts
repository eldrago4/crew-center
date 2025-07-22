import { pgTable, text, time, index, foreignKey, integer, timestamp, numeric, jsonb, char, varchar, bigint, interval, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const rankenum = pgEnum("rankenum", ['Yuvraj', 'Rajkumar', 'Rajvanshi', 'Rajdhiraj', 'Maharaja', 'Samrat', 'Chhatrapati'])


export const routes = pgTable("routes", {
	flightNumber: text().primaryKey().notNull(),
	departureIcao: text().notNull(),
	arrivalIcao: text().notNull(),
	flightTime: time(),
	aircraft: text().notNull(),
});

export const pireps = pgTable("pireps", {
	pirepId: integer().primaryKey().generatedAlwaysAsIdentity({ name: "pireps_pirep_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	flightNumber: text().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	flightTime: time().notNull(),
	departureIcao: text().notNull(),
	arrivalIcao: text().notNull(),
	operator: text().default('Indian Virtual').notNull(),
	aircraft: text().notNull(),
	multiplier: numeric(),
	comments: text(),
	userId: text().notNull(),
	valid: boolean(),
	updatedAt: timestamp({ mode: 'string' }),
}, (table) => [
	index("index_user").using("hash", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.flightNumber],
		foreignColumns: [routes.flightNumber],
		name: "flight_number"
	}),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_id"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const events = pgTable("events", {
	eventId: integer().primaryKey().generatedAlwaysAsIdentity({ name: "events_eventId_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647 }),
	time: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	flightTime: time().notNull(),
	departureIcao: text().notNull(),
	arrivalIcao: text().notNull(),
	aircraft: text().notNull(),
	multiplier: numeric().notNull(),
	interestedUsers: jsonb(),
});

export const users = pgTable("users", {
	id: char({ length: 7 }).primaryKey().notNull(),
	ifcName: varchar({ length: 20 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	discordId: bigint({ mode: "number" }),
	flightTime: interval().default('00:00:00'),
	careerMode: boolean().default(false),
	lastActive: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	rank: rankenum().default('Yuvraj'),
	updatedAt: timestamp({ mode: 'string' }),
}, (table) => [
	index("index_name").using("btree", table.ifcName.asc().nullsLast().op("text_ops")),
]);

export const notams = pgTable("notams", {
	issued: timestamp({ mode: 'string' }).defaultNow().primaryKey().notNull(),
	desc: text().notNull(),
	expiresOn: timestamp({ mode: 'string' }),
});