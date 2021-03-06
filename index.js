var express = require('express');
var http = require('http');
var path = require('path');
var url = require('url');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var multer = require('multer');
var ECT = require('ect');
var env = process.env.NODE_ENV || "development";
var serverConfig = require(__dirname + "/config/server.json")[env];
var Random = require(__dirname + "/util/random");
var TimerTaskWorker = require(__dirname + "/util/TimerTaskWorker");
var db = require('./models');
var ectRenderer = ECT({
	watch : true,
	root : __dirname + '/views'
});
var app = express();
app.engine('ect', ectRenderer.render);
app.set('view engine', 'ect');
app.set('port', process.env.PORT || 3030);
app.set('views', path.join(__dirname, 'views'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
	extended : false,
	limit : '100mb'
}));
app.use("/api/bots/events/webhook", bodyParser());// limit parse url for
// security reason that
// sequelize where accept
// object
app.use(multer({
	// storage : multer.memoryStorage()
	storage : multer.diskStorage({
		destination : function(req, file, cb) {
			cb(null, '/tmp')
		},
		filename : function(req, file, cb) {
			Random.createRandomBase62().then(function(random) {
				cb(null, file.fieldname + '-' + Date.now() + "-" + random)
			})
		}
	})
}).fields([ {
	name : "imageFile",
	maxCount : 1
} ]));
app.use(express.static(path.join(__dirname, 'public')));
db.sequelize.sync().done(function(param) {
	var server = http.Server(app);
	var io = require('socket.io').listen(server);
	if (serverConfig.redis) {
		var redis = require('socket.io-redis');
		io.adapter(redis(serverConfig.redis));
	}
	global.socket = new require('./socket')(io);
	TimerTaskWorker.start(serverConfig.redis);
	require('./routes')(app);
	server.listen(app.get('port'), function() {
		http.createServer(function(req, res) {
			var path = url.parse(req.url, true).pathname;
			if ("" == path || "/" == path) {
				res.writeHead(200, {
					'Content-Type' : 'text/plain'
				});
				console.log("====shutdown called...====");
				res.write('shutdowning.');
				TimerTaskWorker.stop();
				server.close(function() {
					console.log("====server closed...====");
					res.write('.');
				});
				setTimeout(function() {
					res.write('.');
					res.end('complete\n');
					console.log("====shutdown====");
					process.exit();
				}, 10000);
			} else if (path == "/updated") {
				io.emit('event', {
					"type" : 'systemUpdated'
				});
				res.end('update called\n');
			}
		}).listen(parseInt(app.get('port')) + 10000, '127.0.0.1', function() {
			console.log('Slite server listening on port ' + app.get('port') + " and manage port " + (parseInt(app.get('port')) + 10000))
		});
	});
});