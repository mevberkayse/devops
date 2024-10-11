const https = require("https");
const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const PORT = 8443;
const SECRET = "s3cr3t!";

const { exec } = require("child_process");

// initialize the express application
const app = express();

app.use(bodyParser.json());
let encoder = new TextEncoder();

async function verifySignature(secret, header, payload) {
    let parts = header.split("=");
    let sigHex = parts[1];

    let algorithm = { name: "HMAC", hash: { name: 'SHA-256' } };

    let keyBytes = encoder.encode(secret);
    let extractable = false;
    let key = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        algorithm,
        extractable,
        [ "sign", "verify" ],
    );

    let sigBytes = hexToBytes(sigHex);
    let dataBytes = encoder.encode(payload);
    let equal = await crypto.subtle.verify(
        algorithm.name,
        key,
        sigBytes,
        dataBytes,
    );

    return equal;
}

function hexToBytes(hex) {
    let len = hex.length / 2;
    let bytes = new Uint8Array(len);

    let index = 0;
    for (let i = 0; i < hex.length; i += 2) {
        let c = hex.slice(i, i + 2);
        let b = parseInt(c, 16);
        bytes[index] = b;
        index += 1;
    }

    return bytes;
}
/*
app.use("*", (request, response, next) => {
	let signature = request.headers["x-hub-signature-256"];
	let payload = JSON.stringify(request.body);

	verifySignature(SECRET, signature, payload).then((equal) => {
		if (equal) {
			next();
		} else {
			response.status(403).end("Forbidden");
		}
	});
})*/
app.get("/", (request, response) => {
  console.log("HealthCheck!");
  response.end("HealthCheck!");
});

app.post("/application/push", (request, response) => {
  let branch = request.body.ref.split("/")[2];

  if (
    branch !== "main" ||
    branch !== "master" ||
    branch !== "dev" ||
    branch !== "test"
  ) {
    response.end("unknown branch");
  }
  exec(
    `cd C:\\inetpub\\wwwroot\\${branch}\\ && git pull && composer install && npm install && npm run build`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        response.end("error");
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        response.end("error");
        return;
      }
      console.log(`stdout: ${stdout}`);
      response.end("ok");
    }
  );

  response.end("ok");
});

const options = {
  key: fs.readFileSync(path.join(__dirname, "localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "localhost.pem"))
};

// Create HTTPS server
const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`App listening on https://localhost:${PORT}`);
});
