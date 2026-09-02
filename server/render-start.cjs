const http = require("node:http");

const originalListen = http.Server.prototype.listen;

http.Server.prototype.listen = function (...args) {
  const server = originalListen.apply(this, args);
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 125000;
  server.requestTimeout = 120000;
  return server;
};

console.log(`[MKUU AI] Render startup: PORT=${process.env.PORT || "10000"}`);
require("../../dist/server.cjs");
