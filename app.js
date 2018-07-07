"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const crypto = require('crypto');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const execSync = require('child_process').execSync;
const spawn = require('child_process').spawn;

const PORT = process.env.PORT || 3000;

const GitHubFetcher = require('./GitHubFetcher');

var app = express();
var githubFetcher = new GitHubFetcher('https://github.com/KlecksX/github-fetch.git', 'test', 'test-secret');

//Start ngrok and
const ngrok = exec('ngrok http 3000', githubFetcher.execCallback);

request('http://localhost:4040/status', function(error, response, body) {
	if (error) {
		console.log('Error occured fetching ngrok url.');

		ngrok.kill();
		console.log('Ngrok has been terminated, please start it manually.');
	}
	var ngrokUrl = body.match(/https:\/\/([a-zA-Z0-9]*).ngrok.io/)[0];
	console.log('Paste this line as a github webhook for your repository:');
	console.log(ngrokUrl + '/payload');
});

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