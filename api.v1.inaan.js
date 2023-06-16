const http = require('http');

const server = http.createServer((req, res) => {
  const urlParts = req.url.split('/');
  const lastSegment = urlParts[urlParts.length - 1];

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(`Concept: ${lastSegment}`);
});

const port = 3028;

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
