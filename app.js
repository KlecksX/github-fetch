var express = require('express')
var bodyParser = require('body-parser')

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
	console.log(req.body);
	res.sendStatus(200);
});

app.listen(3000);

console.log("GitHub Fetcher is now waiting for changes to the repo.");