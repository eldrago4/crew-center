import { pgTable, index, foreignKey, integer, text, timestamp, time, numeric, boolean, jsonb, char, varchar, bigint, interval, pgEnum, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const rankenum = pgEnum("rankenum", ['Yuvraj', 'Rajkumar', 'Rajvanshi', 'Rajdhiraj', 'Maharaja', 'Samrat', 'Chhatrapati'])


export const pireps = pgTable("pireps", {
	pirepId: integer().primaryKey().generatedAlwaysAsIdentity({ name: "pireps_pirep_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	flightNumber: text().notNull(),
	date: date().notNull(),
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
	adminComments: text(),
}, (table) => [
	index("index_user").using("hash", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_id"
	}).onUpdate("cascade").onDelete("cascade"),
]);

export const routes = pgTable("routes", {
	flightNumber: text().primaryKey().notNull(),
	departureIcao: text().notNull(),
	arrivalIcao: text().notNull(),
	flightTime: time(),
	aircraft: text().notNull(),
});

export const users = pgTable("users", {
	id: char({ length: 7 }).primaryKey().notNull(),
	ifcName: varchar({ length: 20 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	discordId: bigint({ mode: "bigint" }),
	careerMode: boolean().default(false),
	lastActive: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp({ mode: 'string' }),
	flightTime: interval({ precision: 0 }),
	rank: rankenum().generatedAlwaysAs(sql`
CASE
	WHEN ("flightTime" >= '2000:00:00'::interval) THEN 'Chhatrapati'::rankenum
	WHEN ("flightTime" >= '1500:00:00'::interval) THEN 'Samrat'::rankenum
	WHEN ("flightTime" >= '900:00:00'::interval) THEN 'Maharaja'::rankenum
	WHEN ("flightTime" >= '450:00:00'::interval) THEN 'Rajdhiraj'::rankenum
	WHEN ("flightTime" >= '160:00:00'::interval) THEN 'Rajvanshi'::rankenum
	WHEN ("flightTime" >= '80:00:00'::interval) THEN 'Rajkumar'::rankenum
	ELSE 'Yuvraj'::rankenum
END`),
}, (table) => [
	index("index_name").using("btree", table.ifcName.asc().nullsLast().op("text_ops")),
]);

export const notams = pgTable("notams", {
	issued: timestamp({ mode: 'string' }).defaultNow().primaryKey().notNull(),
	desc: text().notNull(),
	expiresOn: timestamp({ mode: 'string' }),
});


export const crewcenter = pgTable("crewcenter", {
	module: text().primaryKey().notNull(),
	value: jsonb(),
});

export const applicants = pgTable("applicants", {
	id: char({ length: 7 }).primaryKey().notNull(),
	ifcName: varchar({ length: 20 }),
	discordId: bigint({ mode: "bigint" }),
	passedAt: timestamp({ mode: 'string' }),
});
