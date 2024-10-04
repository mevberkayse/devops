const https = require("https");
const fs = require("fs");
const path = require("path");

const express = require('express');
const bodyParser = require('body-parser');

const PORT = 8443;
const SECRET = "s3cr3t!";

// initialize the express application
const app = express();

app.use(bodyParser.json());

app.get("/", (request, response) => {
	console.log("HealthCheck!");
	response.end("HealthCheck!");
});

app.post("/application/push", (request, response) => {
    let branch = request.body.ref.split("/")[2];
    console.log(branch);
response.end("ok");
})

const options = {
    key: fs.readFileSync(path.join(__dirname, "localhost-key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "localhost.pem")),
}


// Create HTTPS server
const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`App listening on https://localhost:${PORT}`);
});