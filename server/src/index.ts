import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadRAGIndex } from './rag/ragIndex.js';
import apiRouter from './routes/api.js';
import aiRouter from './routes/aiEndpoints.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);
app.use('/api', aiRouter);

const PORT = process.env.PORT ?? 3001;

// Load RAG index into memory before accepting connections
const ragPath = path.resolve(__dirname, '../../data/regulations-embedded.json');
loadRAGIndex(ragPath);

app.listen(Number(PORT), () => {
  console.log(`Sierra API server ready on port ${PORT}`);
});
