

## Prerequisites

- Node.js (version 22 or higher recommended)
- npm (comes with Node.js)

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd crew-center
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open your browser and navigate to:

```
http://localhost:3000
```

## Project Structure

- `src/app/(xxx)`: logical page groups
- `src/app/api/users/route.js`: API route for user data.
- `src/components/`: Reusable UI components.
- `src/db/`: Database schema and client setup.

## Build

To build the project for production(NOT NEEDED BEFORE DEPLOYING,use `npm run dev` rather):

```bash
npm run build
```

## Environment Variables

create a `.env` file in the root directory and add the necessary variables. you'd need discord app secrets and nextauth 32 bit secret.

### Drizzle Setup

This project uses Drizzle ORM for database interactions. To set up Drizzle, ensure you have the following environment variables declared in your `.env` file:

```
DATABASE_URL=your_database_connection_string
```

Make sure to install Drizzle dependencies if not already installed:

```bash
npm install drizzle-orm drizzle-kit
```

```bash
npx drizzle-kit pull
```
Pulls database schema and generates output into drizzle folder. move it to src/db (schema and relations)

## License

MIT
