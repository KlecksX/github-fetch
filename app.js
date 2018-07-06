"use strict";

const express = require('express');
const bodyParser = require('body-parser');

const crypto = require('crypto');
const { exec } = require('child_process');

const GitHubFetcher = require('./GitHubFetcher');

var app = express();
var githubFetcher = new GitHubFetcher();
const PORT = 3000;

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

//Middleware to verify that the signature is valid.
app.use(githubFetcher.signatureCheck);

app.get('/', function(req, res) {
	res.send("The webhook is listening for changes on /payload.");
});

app.get('/payload', function(req, res) {
	res.send("The webhook is listening for changes.");
});

app.post('/payload', githubFetcher.endpoint);

app.listen(PORT);

console.log("GitHub Fetcher is waiting for webhook calls on port " + PORT);