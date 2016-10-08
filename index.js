
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');

var fs = require("fs");
var listOfMoves = [];
var n = 0;



app.use(express.static(__dirname + '/public')); //добавляет доступ к файлам в папке public. var express = require('express');
app.get('/', function(req, res) {
	// res.send('<h1>Hello world</h1>');
	// res.sendFile(__dirname + '/folder/index.html'); 
	res.sendFile(__dirname + '/index.html');
	// res.sendFile(__dirname + '/folder/style.css'); 
	// res.sendFile('index.html'); TypeError: path must be absolute or specify root to res.sendFile

});

io.on('connection', function(socket) {
	console.log('a user connected');
	socket.on('message', function(msg) {
		console.log('Message to server: ' + msg);
		var b = JSON.parse(msg);

		if (b == 'save') {
			console.log('SAVE...');

			save(listOfMoves, function(err) {
				if (err) {
					console.log('Error not saved');
					return;
				};
				console.log('Done.');
			});
		};

		

		if (b == 'load') {
			console.log('LOAD from server HDD...');
			fs.readFile('./public/listOfMoves.json', 'utf8', (err, data) => {
				if (err) throw err;
				// console.log('listOfMoves:', listOfMoves);
				// console.log('data:', JSON.parse(data));
				listOfMoves = [].concat(JSON.parse(data)); // загрузили из файла, обновили массив
				// console.log('listOfMoves = [].concat(data):', listOfMoves);
				// console.log('listOfMoves[0]:', listOfMoves[0]);
				console.log('Load ', listOfMoves);
				console.log('Load ', listOfMoves.length, ' dots to array. Done.');
			});
			n = 0;
			// io.emit('message', data);

		};

		if (b == 'restore') {
			console.log('RESTORE from server RAM...');
			n = 0;
			io.emit('message', JSON.stringify('clear all'));

		};

		if (b == 'new') {
			console.log('NEW...');
			n = 0;
			listOfMoves.length = 0;
			io.emit('message', JSON.stringify('clear all'));

		};

		// if (b == 'load nn') {
		// 	console.log('next nn...');
		// 	console.log('n:', n);
		// 	console.log('listOfMoves.length:', listOfMoves.length);

		// 	var toSend = {};
		// 	toSend.nn = listOfMoves[n][0];
		// 	toSend.color = listOfMoves[n][1];
		// 	n++;
		// 	if (listOfMoves.length == n) {
		// 		io.emit('message', JSON.stringify('load end'));
		// 		console.log('Done.');

		// io.emit('message', JSON.stringify(toSend));
		// };



		// };

		// io.emit('message', msg);
	});

	socket.on('myData', function(msg) {
		// io.emit('message', msg); //проверка!!!!!

		var a = JSON.parse(msg);


		if (typeof(a) == "object") {
			console.log('Json data: ' + msg);
			if (n > 0) {
				listOfMoves.length = n;
			};
			listOfMoves.push([a.nn, a.color]);
			console.log('listOfMoves: ' + listOfMoves);
			console.log('last: ' + listOfMoves[listOfMoves.length - 1]);
			io.emit('myData', msg);
			n++;

		};


		if (a == "load nn") {
			if (listOfMoves.length == n) {
				io.emit('myData', JSON.stringify('load end'));
				console.log('load nn end. Done.');

			} else {
				console.log('load nn...');
				console.log('n:', n);
				// console.log('listOfMoves:', listOfMoves);
				console.log('listOfMoves.length:', listOfMoves.length);

				var toSend = {};
				toSend.nn = listOfMoves[n][0];
				toSend.color = listOfMoves[n][1];

				io.emit('myData', JSON.stringify(toSend));
				console.log('listOfMoves:[', n, '] ', listOfMoves[n]);

				n++;
			}



		};
	});

	socket.on('disconnect', function() {
		console.log('user disconnected');
	});


});


http.listen(3000, function() {
	console.log('listening on *:3000');
});

console.log("module");



function save(list, callback) {
	var a = './public/listOfMoves.json';

	console.log("Предидущий файл удалили", fs.unlinkSync(a));
	fs.writeFile(a, JSON.stringify(list), callback);

};