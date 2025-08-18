import { createServer, IncomingMessage, ServerResponse } from 'http';
import next, { NextApiRequest, NextApiResponse } from 'next';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req: IncomingMessage, res: ServerResponse) => {
    handle(req, res).catch((err) => {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
  }).listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
  });
});