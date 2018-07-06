"use strict";

const express = require('express');
const bodyParser = require('body-parser');

const crypto = require('crypto');
const { exec } = require('child_process');

const GitHubFetcher = require('./GitHubFetcher');

var app = express();
var githubFetcher = new GitHubFetcher('https://github.com/KlecksX/github-fetch.git');
const PORT = process.env.PORT || 3000;

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send("The webhook is listening for changes on /payload.");
});

//Middleware to verify that the signature is valid.
app.use('/payload', githubFetcher.signatureCheck);

app.get('/payload', function(req, res) {
	res.send("The webhook is listening for changes.");
});

app.post('/payload', function(req, res) {
	githubFetcher.endpoint(req, res);
});

app.listen(PORT);

console.log("GitHub Fetcher is waiting for webhook calls on port " + PORT);