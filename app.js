"use strict";

const express = require('express');
const bodyParser = require('body-parser');

const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;

const GitHubFetcher = require('./GitHubFetcher');

var app = express();
var githubFetcher = new GitHubFetcher('https://github.com/KlecksX/github-fetch.git', 'test', 'test-secret');

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
	})
);

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send("The webhook is listening for changes on /payload.");
});

//Middleware to verify that the signature is valid.
app.use('/payload', githubFetcher.signatureMiddleware().bind(githubFetcher));

app.get('/payload', function(req, res) {
	res.send("The webhook is listening for changes.");
});

githubFetcher.addBuildCommands([
]);

app.post('/payload', githubFetcher.endpoint().bind(githubFetcher));

app.listen(PORT);

console.log("GitHub Fetcher is waiting for webhook calls on port " + PORT);