'use strict';

const crypto = require('crypto');
const { exec } = require('child_process');

module.exports = class GitHubFetcher {

	constructor () {}

	/**
	 * The signatureCheck middleware validates the signature in the request sent by GitHub
	 */
	signatureMiddleware (options) { 

		if (typeof options == 'undefined') options = {};

		if (typeof options.secret == 'undefined') {
			options.secret = 'test-secret';
		}

		return function (req, res, next) {
			var hmac = crypto.createHmac('sha1', options.secret);
			hmac.update(JSON.stringify(req.body));
			var calculatedSignature = 'sha1=' + hmac.digest('hex');

			if (crypto.timingSafeEqual(Buffer.from(req.headers['x-hub-signature']), Buffer.from(calculatedSignature))) {
				next();
			} else {
				console.log('Bad singature on this request: ' + req.headers['x-hub-signature']);
				res.status(403).send('Bad signature.');
			}
		}
	}

	/**
	 * The endpoint function validates the request body, clones the current master branch, executes custom commands added by the user.
	 */
	endpoint (options) {

		if (typeof options == 'undefined') options = {};
		if (!options.repoAddress) throw new Exception('No repoAddress defined.');
		if (!options.buildCommands) options.buildCommands = new Array();

		var execCallback = function (error, stdout, stderr) {
			if (error) {
		    console.error(`exec error: ${error}`);
		    return;
		  }
		  console.log(`stdout: ${stdout}`);
		  console.log(`stderr: ${stderr}`);
		}

		return function(req, res) {
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

				//Clone the project to this.localRepoTarget
				exec('git clone ' + options.repoAddress + ' ' + options.localRepoTarget, execCallback);

				//Execute user defined commands
				for (var i=0; i<options.buildCommands.length; i++) {
					exec(options.buildCommands[i], execCallback);
				}

				return res.sendStatus(200);
			}
		}

		res.status(400).send('Request body is lacking a valid pusher object.');
	}

	addBuildCommand(buildCommand) {
		this.buildCommands.push(buildCommand);
	}

	addBuildCommands(buildCommands) {
		this.buildCommands.concat(buildCommands);
	}
};
