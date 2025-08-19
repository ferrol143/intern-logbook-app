const next = require('next');
const url = require('url');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Passenger requires exporting a function instead of listening on a port
app.prepare().then(() => {
  module.exports = (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Custom routes (you can add more if needed)
      if (pathname === '/a') {
        app.render(req, res, '/a', query);
      } else if (pathname === '/b') {
        app.render(req, res, '/b', query);
      } else {
        handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  };
});
