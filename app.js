const express = require('express');
const bodyParser = require('body-parser');

const crypto = require('crypto');
const { exec } = require('child_process');

app = express();

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

//Middleware to verify that the signature is valid.
app.use(function(req, res, next) {
	//TODO: Add proper secret from an Environment Variable
	hmac = crypto.createHmac('sha1', 'test-secret');
	hmac.update(JSON.stringify(req.body));
	calculatedSignature = 'sha1=' + hmac.digest('hex');

	if (crypto.timingSafeEqual(Buffer.from(req.headers['x-hub-signature']), Buffer.from(calculatedSignature))) {
		next();
	} else {
		console.log("Bad singature on this request: " + req.headers['x-hub-signature']);
		res.status(403).send("Bad signature.");
	}
});

app.get('/', function(req, res) {
	res.send("The webhook is listening for changes on /payload.");
});

app.get('/payload', function(req, res) {
	res.send("The webhook is listening for changes.");
});

app.post('/payload', function(req, res) {
	
	//We only do something on pushes to master.
	if (req.body.ref !== "refs/heads/master") {
		return res.send("Push was not to master branch. Will be ignored.");
	}

	//If the pusher is known.
	if (req.body.pusher && req.body.pusher.name && req.body.pusher.email) {
		console.log(req.body.pusher.name + " (" + req.body.pusher.email + ") has pushed to master branch:");
		if(req.body.commits.length > 0) {
			console.log('"' + req.body.commits[0].message + '"');
		}
		//Fetch, Build and run the project
		exec("sublime ~/Work/klecksx/capacitor-lock", function(error, stdout, stderr) {
			if (error) {
		    console.error(`exec error: ${error}`);
		    return;
		  }
		  console.log(`stdout: ${stdout}`);
		  console.log(`stderr: ${stderr}`);
		});
		return res.sendStatus(200);
	}

	res.status(400).send("Request body is lacking the pusher object or it's name or email attribute.");

});

app.listen(3000);

console.log("GitHub Fetcher is now waiting for changes to the repo.");