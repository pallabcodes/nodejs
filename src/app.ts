import express, { Application, Request, Response } from 'express';
import { connectDB } from './core/connect';
import { runQuery } from './core/runQuery';
import { loadSchema } from './core/schemaLoader';

const app: Application = express();
app.use(express.json());

// Get database schema
app.get('/schema', async (_req: Request, res: Response) => {
  try {
    const client = await connectDB();
    const schema = await loadSchema(client);
    await client.end();
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Run queries
app.post('/query', async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    const client = await connectDB();
    const result = await runQuery(client, sql);
    await client.end();
    return res.json(result);  // Add explicit return here
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });  // Add explicit return here
  }
});

export default app;