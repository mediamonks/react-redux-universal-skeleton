export default function(server) {
  /* eslint-disable no-unused-vars */
  server.use('/headers', (req, res, next) => {
    res.send(JSON.stringify(req.headers));
  });
  /* eslint-enable */
}
