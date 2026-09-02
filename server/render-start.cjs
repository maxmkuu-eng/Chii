const http = require("node:http");

const originalListen = http.Server.prototype.listen;

http.Server.prototype.listen = function (...args) {
  const server = originalListen.apply(this, args);

  // Render terminates TLS at its edge and proxies HTTP to this Node server.
  // Keep the upstream connection alive and avoid Node closing slow connections.
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 125000;
  server.requestTimeout = 120000;
  server.timeout = 120000;

  server.on("request", (req, res) => {
    console.log(`[MKUU AI] ${req.method} ${req.url}`);
    res.on("finish", () => {
      console.log(`[MKUU AI] ${req.method} ${req.url} -> ${res.statusCode}`);
    });
  });

  return server;
};

console.log(`[MKUU AI] Render startup: PORT=${process.env.PORT || "10000"}`);
require("../dist/server.cjs");
