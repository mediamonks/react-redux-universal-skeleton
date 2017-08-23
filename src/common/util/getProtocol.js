export default req =>
  req.headers['x-forwarded-proto'] || // CDN's and frameworks will set this
  (req.headers['x-iisnode-https'] === 'on' ? 'https' : 'http') || // iisnode will set this
  (req.connection && req.connection.encrypted ? 'https' : 'http');
