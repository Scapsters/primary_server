import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const makePath = (relativePath: string) => path.join(__dirname, relativePath);

// SSL certificates (HTTPS)
const options = {
    key: fs.readFileSync(makePath("../scrapstack_certs/scrapstack.net-key.pem")),
    cert: fs.readFileSync(makePath("../scrapstack_certs/scrapstack.net-crt.pem")),
};

const app = express()
    .use("*", (req, res, next) => {
        console.log(
            `[${new Date().toLocaleString()}] ${req.method} ${req.url}, host: ${
                req.headers.host
            }`
        );
        next();
    })
    .use(
        createProxyMiddleware({
            router: {
                "scrapstack.net": "http://localhost:1000",
                "www.scrapstack.net": "http://localhost:1000",
            },
            changeOrigin: true,
        })
    );

https.createServer(options, app).listen(443, "0.0.0.0", () => {
    console.log(`Server is running on port 443 (HTTPS)`);
});

// Redirect to HTTPS
http.createServer((req, res) => {
    const host = req.headers.host ?? "";
    res.writeHead(301, {
        Location: `https://${host.replace(/^www\./, "")}${req.url}`,
    }).end();
}).listen(80, () => {
    console.log("HTTP server is redirecting to HTTPS");
});
