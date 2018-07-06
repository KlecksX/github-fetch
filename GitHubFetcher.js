'use strict';

const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');

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
	 * Setup function for the endpoint handler
	 */
	endpoint (options) {

		if (typeof options == 'undefined') options = {};
		if (!options.repoAddress) throw new Exception('No repoAddress defined.');
		if (!options.buildCommands) options.buildCommands = new Array();
		if (!options.localRepoTarget) options.localRepoTarget = 'test';

		var execCallback = function (error, stdout, stderr) {
			if (error) {
		    console.error(`exec error: ${error}`);
		    return;
		  }
		  if (stdout) console.log(`stdout: ${stdout}`);
		  if (stderr) console.log(`stderr: ${stderr}`);
		}

		console.log('Trying to clone the repo. This will fail if the repo has already exists on this machine.')
		console.log('Executing: git clone ' + options.repoAddress + ' ~/' + options.localRepoTarget);
		exec('git clone ' + options.repoAddress + ' ~/' + options.localRepoTarget, execCallback);
		
		//Execute user defined commands
		console.log('Executing user defined commands.');
		for (var i=0; i<options.buildCommands.length; i++) {
			exec(options.buildCommands[i], execCallback);
		}
		
		/**
	 	 * This function validates the request body, clones the current master branch, executes custom commands added by the user.
	 	 */
		return function(req, res) {
			//We only do something on pushes to master.
			if (req.body.ref !== 'refs/heads/master') {
				return res.send('Push was not to master branch. Will be ignored.');
			}

			//If the pusher is known.
			if (req.body.pusher && req.body.pusher.name && req.body.pusher.email) {
				console.log(req.body.pusher.name + ' (' + req.body.pusher.email + ') has pushed to master branch:');
				
				//Log the commit message if available
				if (req.body.commits.length > 0) {
					console.log('Commit: "' + req.body.commits[0].message + '"');
				}

				// reset any changes that have been made locally
				exec('git -C ~/' + options.localRepoTarget + ' reset --hard', execCallback);

				// and ditch any files that have been added locally too
				exec('git -C ~/' + options.localRepoTarget + ' clean -df', execCallback);

				// now pull down the latest
				exec('git -C ~/' + options.localRepoTarget + ' pull -f', execCallback);

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
