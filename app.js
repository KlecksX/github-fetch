var express = require('express');
var bodyParser = require('body-parser');

const { exec } = require('child_process');

app = express();

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send("The webhook is listening for changes on /payload.");
});

app.get('/payload', function(req, res) {
	res.send("The webhook is listening for changes.");
});

app.post('/payload', function(req, res) {
	
	if (req.body.ref !== "refs/heads/master") {
		return res.send("Push was not to master branch. Will be ignored.");
	}

	if (req.body.pusher && req.body.pusher.name && req.body.pusher.email) {
		console.log(req.body.pusher.name + " (" + req.body.pusher.email + ") has pushed to master branch:");
		if(req.body.commits.length > 0) {
			console.log('"' + req.body.commits[0].message + '"');
		}
		exec("sublime ~/Work/klecksx/capacitor-lock", function(err, stdout, stderr) {
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