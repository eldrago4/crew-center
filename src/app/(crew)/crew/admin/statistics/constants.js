// Shared by the server queries and the client table, so it lives outside
// queries.js — that file is server-only and importing it from a client component
// would pull the database client into the browser bundle.

// The Akasharatha Club threshold. Note this sits above the Chhatrapati rank itself
// (2000h, a generated column on users.rank); the club is the 2500h tier described
// on the public /ranks page.
export const AKASHARATHA_HOURS = 2500;
