const crypto = require('crypto');
const { exec } = require('child_process');

module.exports = class GitHubFetcher {

	constructor(repoAddress) {
		this.repoAddress = repoAddress;
	}

	signatureCheck (req, res, next) {
		//TODO: Add proper secret from an Environment Variable
		hmac = crypto.createHmac('sha1', 'test-secret');
		hmac.update(JSON.stringify(req.body));
		calculatedSignature = 'sha1=' + hmac.digest('hex');

		if (crypto.timingSafeEqual(Buffer.from(req.headers['x-hub-signature']), Buffer.from(calculatedSignature))) {
			next();
		} else {
			console.log('Bad singature on this request: ' + req.headers['x-hub-signature']);
			res.status(403).send('Bad signature.');
		}
	}


	endpoint (req, res) {
		//We only do something on pushes to master.
		if (req.body.ref !== 'refs/heads/master') {
			return res.send('Push was not to master branch. Will be ignored.');
		}

		//If the pusher is known.
		if (req.body.pusher && req.body.pusher.name && req.body.pusher.email) {
			console.log(req.body.pusher.name + ' (' + req.body.pusher.email + ') has pushed to master branch:');
			
			//Log the commit message if available
			if(req.body.commits.length > 0) {
				console.log('Commit: "' + req.body.commits[0].message + '"');
			}
			
			//Fetch, Build and run the project
			exec(`git clone ${this.repoAddress} test`, execCallback);

			return res.sendStatus(200);
		}

		res.status(400).send('Request body is lacking a valid pusher object.');
	}

	execCallback(error, stdout, stderr) {
		if (error) {
	    console.error(`exec error: ${error}`);
	    return;
	  }
	  console.log(`stdout: ${stdout}`);
	  console.log(`stderr: ${stderr}`);
	}
};