var myApp = angular.module('dotsApp', []);

var nn, n;
var dotsCounter;

var dotColor = ["transparent", "red", "green", "yellow", "white"];
var fillColor = ["transparent", "rgba(255,0,0,.3)", "rgba(0, 128, 0, .3)", "rgba(255,255,128,.3)", "white"];
var myColor = 1;
var enemyColor = 2; // вражеский цвет
var canvas = document.getElementById('myCanvas');

var c = canvas.getContext('2d');

n = 21; //количество клеток, пересечений (n-1)
x = canvas.width = 600; //400px ширина canvas
y = canvas.height = 600; //400px высота canvas

var step = x / n; //шаг сетки px
var dotRadius = step / 8;

gird(canvas);


var MyDotsData = [];
var dtl = [];
var freeContoursList = [];
var areasList = [];
var blockedDots = [];
var totalOccupiedArea = matrixArray(n - 1, n - 1);
var listOfContoursNumberByNN = Array(n * n).fill(0); //  сделать в виде цикла (!)
var areas = [];
var enemyDots = [];

var blocked = false; // блокировка передачи точки если предидущая еще не отработана
var onclickSpeed = [];
var refreshSpeed = [];
var watcherSpeed = [];
var serverSpeed = [];

var isNew = false; //костыль для обновления номера хода nOfTurn в $scope.$watch
var load = false;


myApp.factory('socket', function($rootScope) {
	var socket = io.connect();
	return {
		on: function(eventName, callback) {
			socket.on(eventName, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					callback.apply(socket, args);
				});
			});
		},
		emit: function(eventName, data, callback) {
			socket.emit(eventName, data, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			});
		}
	};
});



myApp.controller('textController', function($scope, socket) {

	// var phonesTest = ['1blalba', 2, "fedf", 'fdffd'];

	// socket.emit('message', angular.toJson(phonesTest));

	socket.on('message', function(msgData) {
		var msg = angular.fromJson(msgData);
		// $scope.chat = msg;

		if (msg == 'clear all') {
			clearAll($scope);
			socket.emit('myData', angular.toJson('load nn'));
		}


		// if (typeof(msg) === 'object') {

		// 	alert('bingo');
		// 	alert(msg);
		// };

	});


	$scope.buttonSave = function(e) {
		console.log('SAVE');
		socket.emit('message', angular.toJson('save'));
	};
	$scope.buttonLoad = function(e) {
		console.log('LOAD');
		load = true;
		socket.emit('message', angular.toJson('load'));
		socket.emit('message', angular.toJson('restore'));

	};
	$scope.buttonRestore = function(e) {
		console.log('RESTORE from server RAM');
		load = true;
		socket.emit('message', angular.toJson('restore'));
	};

	$scope.buttonPlay = function(e) {
		console.log('buttonPlay');
		load = true;
		socket.emit('myData', angular.toJson('load nn'));
	};

	$scope.buttonPushOneDot = function(e) {
		console.log('buttonPushOneDot');
		load = false;
		socket.emit('myData', angular.toJson('load nn'));


	};

	$scope.buttonStop = function(e) {
		console.log('buttonStop');
		load = false;

	};

	$scope.buttonNew = function(e) {
		console.log('buttonNew');
		load = false;
		socket.emit('message', angular.toJson('new'));

	};



});


myApp.controller('dotsController', function($scope, socket) {

	$scope.dotColor = dotColor;

	$scope.nnHelper = -1;
	$scope.nOfTurn = 0;
	$scope.myColor = myColor;
	$scope.occupiedArea = 0;
	$scope.enemyOccupiedArea = 0;

	$scope.capturedDots = 0;
	$scope.enemyCapturedDots = 0;



	$scope.helperStyle = {
		"top": "$scope.x" + "px",
		"left": "$scope.y" + "px"
	};

	MyDotsDataCreator(); // создаем массив MyDotsData[][]

	//# console.log('MyDotsData : ' + MyDotsData.length);


	// var phonesTest = 'Nothing';

	// socket.emit('myData', angular.toJson(phonesTest));



	$scope.refresh = function() { // кнопка "обновить" на странице

		// CanvasClear();
		// gird(canvas);
		// AllDotsDrawing();
		// AreaDraw();
		refresh();

	};



	$scope.canvasNgHover = function(e) {
		$scope.nnHelper = PositionDetect(e, $scope);

		if ($scope.nnHelper !== -1) {
			$scope.ab = [MyDotsData[$scope.nnHelper][0], MyDotsData[$scope.nnHelper][1]]
		};

		$scope.x = e.pageX + 20;
		$scope.y = e.pageY + 10;
	};

	$scope.canvasNgMousedown = function(e) {
		// var d = Date.now();


		var nn = PositionDetect(e);
		if (nn === -1) {
			return
		};
		if (MyDotsData[nn][2] !== 0) { // если точка занятая => выход
			return

		};
		if (MyDotsData[nn][3] >= 10) { // блокированная точка в BlockOccupiedArea
			return
		};
		OneDotDraw($scope, nn); //точку сначала нарисовали, а потом все остальные операции
		// OneDotDraw($scope, nn) <= MyDotsData[nn][2] = myColor <- отмечается точка
		var toSend = {};
		toSend.nn = nn;
		toSend.color = myColor;


		socket.emit('myData', angular.toJson(toSend));
		// onclickSpeed.push(Date.now() - d);
		// serverSpeed.push(Date.now());
	};

	socket.on('myData', function(msgData) {

		if (angular.fromJson(msgData) == 'load end') {
			load = false;
		} else {
			var received = {};
			received = angular.fromJson(msgData)

			// while (blocked) {
			// 	setTimeout("console.log('БЛОКИРОВКА НА 500МС');", 500);
			// };
			$scope.myColor = received.color;
			$scope.nn = received.nn;
			// console.log('received', received);
			// console.log('received.nn', received.nn);
			// console.log('$scope.nn', $scope.nn);

			serverSpeed.push(Date.now() - serverSpeed.pop());
		};
	});

	$scope.$watch("nn", function(nn) {
		var d = Date.now();

		if (nn === undefined) {
			return;
		};

		if (isNew) { //костыль для обновления nOfTurn
			$scope.nOfTurn = 0;
			isNew = false;
		};

		$scope.nOfTurn++;
		myColor = $scope.myColor; // временно. пока переключаю цвета вручную (!)
		OneDotDraw($scope, nn); //еще раз нарисовали, костыль
		OccupiedAreaCalculation($scope); // временно. пока переключаю цвета вручную (!) отбражения для статистики


		if (MyDotsData[nn][2] == enemyColor) { // обрабатываем точку противника
			// ...
		};



		//первичная проверкиа точки (по соседним точкам):
		if (dotFastCheckup($scope, nn) === false) {
			if (load) {
				socket.emit('myData', angular.toJson('load nn'));

				console.log('load nn dotFastCheckup ');
			};
			console.log('load', load);

			return; //если false завершаем обработку клика
		};

		//поиск всех рядом стоящих точек:

		dtl.length = 0; //обнулили список рядом стоящих точек
		//# console.log(' dtl перед AllNearDotsSearch : ', dtl);

		AllNearDotsSearch($scope, nn);
		//поиск всех рядом стоящих точек: dtl
		// все точки были помечены - MyDotsData[nn][3] = myColor; <= блокированне точки не затрагиваются MyDotsData[nn][3] = myColor*10
		console.log('AllNearDotsSearch по соседним точкам готово. dtl : ', dtl);


		//сниманм метки MyDotsData[nn][3] = myColor => 0
		for (var i = 0; i < dtl.length; i++) { // <= блокированне точки не затрагиваются MyDotsData[nn][3] = myColor*10
			MyDotsData[dtl[i]][3] = 0;
		};


		minMaxMatrix($scope); // мин и макс (по x и y) точки из списка dtl
		// создали матрицу $scope.matrix[a][b]
		//  заполнили из dtl $scope.matrix[a][b] = 8



		contoursSeparate($scope); // удаляем лишние точки, поиск контуров
		console.log('END contoursSeparate END');
		// все найденные контуры (4+ точек), занесли в массив areas[[]]

		console.log('количество areas: ', areas.length);
		if (areas[0].length > 0) { //если массив не пустой
			for (var i = areas.length - 1; i >= 0; i--) { // обрабатываем каждый контур c конца
				//# console.log('areas : ', areas);
				console.log('Обрабатываем с конца areas[', i, ']  : ', areas[i]);

				// dtl = [];
				// for (var q = 0; q < areas[i].length; q++) {

				//# console.log('areas[', i, ']  : ', areas[i]);
				//# console.log('dtl: ', dtl);

				// убирает лишние точки находящиеся вблизи с обводимым контуром: 
				// и находит пустые контуры
				areasCleaner($scope, i); // i - номер контура в массиве

				// };
				dtl = areas[i];


				//# console.log('dtl = areas[', i, '] обновили(в цикле) : ', dtl);

				minMaxMatrix($scope); // создали матрицу
				fillFromOutside($scope); //заливка снаружи
				findEnemyfindFreeDots($scope); // посчитали вражеские и пустые точки. enemyDots, $scope.freeDots
				//enemyDots - список вражеских точек 
				//$scope.freeDots - список пустых точек 
				//$scope.myDots - список своих точек

				console.log('enemyDots : ', enemyDots.length, enemyDots);
				console.log('$scope.freeDots : ', $scope.freeDots.length, $scope.freeDots);


				if ((enemyDots.length === 0) && ($scope.freeDots.length > 0)) { // если вражеских точек нет, но есть пустые => в список пустых контуров

					freeContoursList.push([$scope.freeDots, dtl]); //в список пустых контуров

					//# console.log('НЕТ вражеских точек , но есть пустые => в список пустых контуров : ', freeContoursList[freeContoursList.length - 1], '  ВЫХОД');
					continue;
				};

				if (enemyDots.length === 0) { // если вражеских точек нет => след. контур
					//# console.log('НЕТ вражеских точек , в контуре  dtl : ', dtl, '  ВЫХОД');
					//# console.log('enemyDots.length == ', enemyDots.length);
					// dtl.length = 0;
					continue;
				};
				//# console.log('enemyDots.length > 0?? ', enemyDots.length);
				//# console.log('enemyDots : ', enemyDots);

				OccupiedAreaWrite($scope); // заносим в MyDotsData[nn][3] = myColor * 10; и totalOccupiedArea[][] = myColor
				OccupiedAreaCalculation($scope); // считаем занятую площадь 

				// BlockOccupiedArea переместил в OccupiedArea. помечаем блокированные точки в MyDotsData[n][3] = myColor * 10
				//# console.log('areasList.length= ', areasList.length);

				// если контур не пустой:
				if (enemyDots.length > 0) {
					areasList.length === undefined ? $scope.k = 0 : $scope.k = areasList.length;
					areasList[$scope.k] = [
						[],
						[],
						[],
						[]
					];

					//# console.log('Сработал areasList: ', areasList);
					//# console.log('$scope.k= ', $scope.k);
					//# console.log('areasList.length= ', areasList.length);


					var fillColor = myColor;
					areasList[$scope.k][0].push(myColor, fillColor); // заносим контуры в areasList:

					for (var m = 0; m < areas[i].length; m++) {
						var t = areas[i][m];
						MyDotsData[t][4] = 1; //пометил как точку границы 
						listOfContoursNumberByNN[t] = $scope.k; // запишем в отдельный nn массив номер контура (в точки границы)  
						areasList[$scope.k][1].push(areas[i][m]);
					};
					areasList[$scope.k][3].push(enemyDots.length); // сколько вражеских точек в этом контуре

					//# console.log('dtl: ', dtl);
				};

			};
			//# console.log('Цикл по areas закончился. areasList[', $scope.k, ']: ', areasList[$scope.k]);
			//# console.log('freeContoursList элементов : ', freeContoursList.length);
		};
		areas.length = 0; //на всякий случай

		CanvasClear();
		gird(canvas);
		AllDotsDrawing();
		AreaDraw();
		watcherSpeed.push(Date.now() - d);
		// console.log('onclickSpeed: ', onclickSpeed, 'serverSpeed: ', serverSpeed, 'watcherSpeed: ', watcherSpeed, 'refreshSpeed: ', refreshSpeed);
		console.log('watcherSpeed: ', watcherSpeed, ' last: ', watcherSpeed[watcherSpeed.length - 1]);


		if (load) {
			socket.emit('myData', angular.toJson('load nn'));
			console.log('load nn (END of $watch function)');
		};


		console.log('-----------------------');
	}); //$scope.$watch("nn"..)  end

});


// Меняем цвет точки вручную:
document.getElementById('greenCol').onclick = function(e) { //зеленый
	myColor = 2;
	enemyColor = 1;
};

document.getElementById('redCol').onclick = function(e) { //красный
	myColor = 1;
	enemyColor = 2;
};


// document.getElementById('cleanArea').onclick = function(e) { //красный
// 	// area = canvas.getContext('2d');

// 	if (dtl == undefined) {
// 		return
// 	};
// 	c.clearRect(0, 0, x, y);
// 	gird(step, x, y, n);

// 	AllDotsDrawing();

// 	AreaDraw(dtl);

// };

function AnyColorDotDraw(color, m, n) {

	// var x = MyDotsData[nValue][0] * step + step;
	// var y = MyDotsData[nValue][1] * step + step;
	var x = m * step + step;
	var y = n * step + step;



	var c = canvas.getContext('2d');
	c.beginPath();
	c.arc(x, y, dotRadius * 2, 0, 2 * Math.PI);
	c.fillStyle = color;
	c.fill();
	c.closePath();
};


function gird(canvas) {

	var lines = canvas.getContext('2d');
	lines.beginPath();
	lines.lineWidth = 2;
	lines.strokeStyle = "lightgray";
	for (var a = 1; a < n; a++) {
		lines.moveTo(a * step, 0);
		lines.lineTo(a * step, y);
		lines.moveTo(0, a * step);
		lines.lineTo(x, a * step);
	}

	lines.stroke();
	lines.closePath();
}

function OneDotDraw($scope, nValue) {

	MyDotsData[nValue][2] = myColor;

	var x = MyDotsData[nValue][0] * step + step;
	var y = MyDotsData[nValue][1] * step + step;
	var c = canvas.getContext('2d');
	c.beginPath();
	c.arc(x, y, dotRadius, 0, 2 * Math.PI);
	c.fillStyle = dotColor[myColor];
	c.fill();
	c.closePath();
}


function dotFastCheckup($scope, nn) {
	var counter = 0;
	var startA, startB, endA, endB, xx;
	var myLittleStack = [];
	myLittleStack.length = 0;
	// //# console.log("клеток: " + n);

	startA = startB = -1;
	endA = endB = 1;

	if (MyDotsData[nn][0] === 0) {
		startA = 0;
	};
	if (MyDotsData[nn][1] === 0) {
		startB = 0
	};

	if (MyDotsData[nn][0] === (n - 2)) {
		endA = 0
	};
	if (MyDotsData[nn][1] === (n - 2)) {
		endB = 0
	};


	for (var b = startB; b <= endB; b++) { //находим все точки в зоне "видимости":
		for (var a = startA; a <= endA; a++) {
			xx = (nn + a + b * (n - 1));
			if (xx == nn) { //пропускаем центральную точку
				continue;
			};
			if (MyDotsData[xx][3] >= 10) { //блокированная точка, пропуск
				continue;
			};
			counter++;
			if (MyDotsData[xx][2] == myColor) { //если свой цвет
				myLittleStack.push(xx); //создаем список номеров "своих" точек
			};
		};
	};


	//предпроверка точки на возможность создания контура:
	var lastDot = myLittleStack.pop();
	var myAa = 0, //если есть две несмежные точки возле проверяемой, то return true
		myBb = 0;
	for (var i = 0; i < myLittleStack.length; i++) { //меряем рассояние каждой точки до остальных
		myAa = Math.abs(MyDotsData[lastDot][0] - MyDotsData[myLittleStack[i]][0]); //по модулю
		myBb = Math.abs(MyDotsData[lastDot][1] - MyDotsData[myLittleStack[i]][1]);
		// //# console.log("myAa: " + myAa + " myBb: " + myBb);
		if ((myAa == 2) || (myBb == 2)) {
			console.log('dotFastCheckup - return true');
			return true;
		};
	};
	console.log('dotFastCheckup - return false');
	return false;
};

function AllNearDotsSearch($scope, nn) { // ищем все соседние точки 
	var startA, startB, endA, endB, xx;
	startA = startB = -1;
	endA = endB = 1;

	//если точка возле границы корректируем 
	//цикл поиска по точкам:
	if (MyDotsData[nn][0] === 0) {
		startA = 0
	};
	if (MyDotsData[nn][1] === 0) {
		startB = 0;
	};

	if (MyDotsData[nn][0] == (n - 2)) {
		endA = 0
	};
	if (MyDotsData[nn][1] == (n - 2)) {
		endB = 0
	};


	if (MyDotsData[nn][3] === 0) { //проверка что точка не помечена 
		MyDotsData[nn][3] = myColor //помечаем точку (своим цветом), пишем в MyDotsData[nn][3]
	};

	dtl.push(nn); // добавляем точку в список (контур)
	// //# console.log('AllNearDotsSearch dtl: ', dtl);


	for (var b = startB; b <= endB; b++) { //цикл по соседним точкам
		for (var a = startA; a <= endA; a++) {
			xx = (nn + a + b * (n - 1)); //порядковый номер точки			
			if (xx == nn) { //пропускаем центральную точку
				continue;
			};

			if (MyDotsData[xx][3] === 0) { //если точка не помечена. Точки контуров не помечали
				if (MyDotsData[xx][2] === myColor) { //если свой цвет
					AllNearDotsSearch($scope, xx);
				};
			};
		};
	};
};

function minMaxMatrix($scope) {
	var theObj = [];
	//# console.log('должен быть 0 theObj ', theObj);
	if (dtl[0] == undefined) {
		return;
	};
	var maxA, maxB;
	var minA = maxA = MyDotsData[dtl[0]][0]; // задаем стартовое значение, с чем сравнивать
	var minB = maxB = MyDotsData[dtl[0]][1];

	//найдем мин и макс координаты точек:
	for (var i = 1; i < dtl.length; i++) {

		if (MyDotsData[dtl[i]][0] > maxA) {
			maxA = MyDotsData[dtl[i]][0]
		};
		if (MyDotsData[dtl[i]][0] < minA) {
			minA = MyDotsData[dtl[i]][0]
		};
		if (MyDotsData[dtl[i]][1] > maxB) {
			maxB = MyDotsData[dtl[i]][1]
		};
		if (MyDotsData[dtl[i]][1] < minB) {
			minB = MyDotsData[dtl[i]][1]
		};


	}; // найдем мин и макс координаты точек. end
	//# console.log('должен быть 0 theObj (попытка вторая) ', theObj);

	theObj.push(minA, minB, maxA, maxB); //запишем значения 
	$scope.minAndMax = theObj;
	var matrixA = maxA - minA + 3; // размер +1px с каждой стороны для алгоритма заливки снаружи  
	var matrixB = maxB - minB + 3;
	$scope.matrixA = matrixA;
	$scope.matrixB = matrixB;
	//# console.log('$scope.matrixA, $scope.matrixB :', $scope.matrixA, $scope.matrixB); // min и max каждого контура
	//# console.log('minA, minB, maxA, maxB :', $scope.minAndMax); // min и max каждого контура

	$scope.matrix = matrixArray(matrixA, matrixB); // (rows, columns), заполнение 0



	//заполним матрицу данными:
	for (var i = 0; i < dtl.length; i++) {
		var a = MyDotsData[dtl[i]][0] - minA + 1; // смещаем на 1px
		var b = MyDotsData[dtl[i]][1] - minB + 1; // смещаем на 1px
		$scope.matrix[a][b] = 8; //точки контура запишем как цифру 8
	};
	//заполним матрицу данными
	console.log('minMaxMatrix Создали и заполнили матрицу $scope.matrix из dtl: ', dtl);

	// вывели матрицу в консоль:
	var tmp = []
	for (var i = 0; i < matrixB; i++) {
		for (var j = 0; j < matrixA; j++) {
			tmp.push($scope.matrix[j][i]);
		};
		console.log(tmp);
		tmp.length = 0;
	};
	// вывели матрицу в консоль END
};

function contoursSeparate($scope) {
	console.log('START contoursSeparate START');
	// поиск первой точки сверху-слева
	for (var ar = 1; ar < $scope.matrixA - 1; ar++) {
		for (var br = 1; br < $scope.matrixB - 1; br++) {
			if ($scope.matrix[ar][br] == 8) {
				var a = ar;
				var b = br; //нашли координаты a, b

				ar = $scope.matrixA; // выход из цикла
				br = $scope.matrixB;
			}
		}
	}; //нашли a, b

	var startA, startB, endA, endB;
	startA = startB = -1;
	endA = endB = 1;
	var x, y, i = 0;
	var piNa4 = Math.PI / 4;
	var rStart = 4;
	dtl = [];
	var outPoint;
	var minA = $scope.minAndMax[0];
	var minB = $scope.minAndMax[1];
	//# console.log('$scope minA=', $scope.minAndMax[0]);
	//# console.log('$scope minB=', $scope.minAndMax[1]);
	areas = [];
	areas[0] = [];
	var k = 0;

	outPoint = minA + a - 1 + (minB + b - 1) * (n - 1);
	dtl.push(outPoint);
	$scope.matrix[a][b] = 9; //пометили


	while (i < 1000) {
		if (i == 999) {
			alert('contoursSeparate (i < 1000) i=', i) // на всякий случай (!)
		};
		i++
		for (var r = 0; r < 8; r++) { //цикл по соседним точкам

			x = Math.round(Math.cos(piNa4 * (r + rStart)) - Math.sin(piNa4 * (r + rStart))); //по часовой
			y = Math.round(Math.sin(piNa4 * (r + rStart)) + Math.cos(piNa4 * (r + rStart)));
			var abc = minA + a + x - 1 + (minB + b + y - 1) * (n - 1); //порядковый номер точки


			if ($scope.matrix[a + x][b + y] == 9) { // если вернулись в уже пройденную точку. поиск замкнутых контуров

				for (var j = dtl.length - 1; j >= 0; j--) { // ищем сколько точек назад была эта точка
					if (dtl[j] == abc) { //если нашли

						if ((dtl.length - 1 - j) <= 2) { //точек в контуре  меньше 3х => удалить
							dtl.length = j; // удаляем из массива. 

						} else { //точек в контуре  больше 3х => перенести в новый массив
							areas[k] = [];

							for (var jj = j; jj <= dtl.length - 1; jj++) { // переписывем от [j до конца]
								areas[k].push(dtl[jj]);

							};
							console.log('areas[', k, ']:', areas[k], ' - переписали от [j до конца]');
							k++;


							dtl.length = j; // удаляем из массива. 
							console.log('dtl.length = j; // удаляем из массива. dtl= ', dtl);



						};
					};
				};

				$scope.matrix[a + x][b + y] = 8; //снимаем метку + ниже точка добавляется заново в dtl

				if (abc === outPoint) { // Вернулись к первой точке. ГОТОВО. Выход!
					// $scope.matrix[a + x][b + y] = 8;
					//# console.log('contoursSearch areas: ', areas);
					return;
				};

			}; // if ( == 9) .END



			if ($scope.matrix[a + x][b + y] == 8) { //нашли "следующую" точку

				$scope.matrix[a + x][b + y] = 9; // помечаем

				//добавили точку в "цепочку", если элемент уже есть в конце то не добавляем
				if (abc == dtl[dtl.length - 1]) {} else {
					dtl.push(abc);
				};


				a = a + x; // сместились на новую координату
				b = b + y;
				rStart = rStart + r - 2; // на 90* против ч.с.

				//# console.log('contoursSearch dtl(локальная): ', dtl);

				break; // выходим из цикла for, чтобы искать вокруг новой точки

			}; // if  == 8

		}; //END for (var r = 0; r < 8; r++)

	}; //END while 


};

function fillFromOutside($scope) {

	//"заливка" снаружи:
	var matrixA = $scope.matrixA;
	var matrixB = $scope.matrixB;
	dotsCounter = 0;
	var lineEnd = 0,
		lineStart = matrixB;

	for (var a = 0; a < matrixA; a++) { // проход по матрице
		for (var b = 0; b < matrixB; b++) { // проход по b вниз  и вверх
			// if (matrix[a][b] == 1) { //если 1, 
			// 	dotsCounter++; //счетчик точек +1
			// };

			if ($scope.matrix[a][b] == 0) { //если 0, заменяем на 1
				$scope.matrix[a][b] = 1;
				dotsCounter++; //счетчик точек +1 
				// //# console.log(' b: ' + b + ' ' + ' LineStart: ' + lineStart);
				if (b > (lineStart)) {
					// //# console.log('b > (LineStart) ++!!');

					leftPixelChecker($scope, a, b); /// !!! TT
				};

			} else if ($scope.matrix[a][b] == 8) { //если граница (8)

				lineStart = b; // !!!

				for (var b = matrixB; b >= 0; b--) { //то же только идем снизу-вверх

					// if ($scope.matrix[a][b] == 1) { //если 1, 
					// 	dotsCounter++; //счетчик точек +1
					// };
					if ($scope.matrix[a][b] == 0) { //если 0, заменяем на 1
						$scope.matrix[a][b] = 1;
						dotsCounter++; //счетчик точек +1
						// //# console.log('lineEnd:  ' + lineEnd + ' b: ' + b);

						if (b < (lineEnd)) {
							// //# console.log('b < (LineEnd) ++!!');
							leftPixelChecker($scope, a, b); /// !! ^^
						};
					} else if ($scope.matrix[a][b] == 8) { //если граница (8)

						lineEnd = b; // !!!

						break;
					};
				};
				break; // и выходим из этого цикла
			};
		}; // "заливка" снаружи конец 'b'  цикла



		if (lineEnd == lineStart) { //если одна точка, следующий шаг цикла 
			continue
		};


		//проверяем кусочек:
		for (var b = lineStart + 1; b < lineEnd; b++) { //старт со следующей точки и конец перед последней точкой
			if ($scope.matrix[a][b] == 8) { //пропуск, идем дальше
				continue
			};

			if (($scope.matrix[a][b] == 1) && ($scope.matrix[a - 1][b] == 0)) { //ищем точку слева !зачем?
				$scope.matrix[a - 1][b] = 1;
				dotsCounter++; //счетчик точек +1
				verticalChecker($scope, (a - 1), b);
			};

			if (($scope.matrix[a][b] == 0) && ($scope.matrix[a - 1][b] == 1)) { //ищем точку справа 
				$scope.matrix[a][b] = 1;
				dotsCounter++; //счетчик точек +1
				verticalChecker($scope, a, b);
			};



		};

	}; //"заливка" снаружи. конец 'a' цикла.

	//"заливка" снаружи
};

function verticalChecker($scope, a, b) {
	var up = b - 1; //вверх на 1
	var down = b + 1; //вниз на 1
	var i = 0;
	if ($scope.matrix[a][b] == 1) {
		do {

			if ($scope.matrix[a][up] == 0) { //если пусто
				$scope.matrix[a][up] = 1;
				dotsCounter++; //счетчик точек +1
				// //# console.log('verticalChecker up a, b ', a, up);
				// //# console.log('dotsCounter ', dotsCounter);

				leftPixelChecker($scope, a, up);
				rightPixelChecker($scope, a, up);
				up--;
			} else {
				i++
			};

			if ($scope.matrix[a][down] == 0) { //если пусто
				$scope.matrix[a][down] = 1;
				dotsCounter++; //счетчик точек +1
				// //# console.log('verticalChecker down. a, b ', a, down);
				// //# console.log('dotsCounter ', dotsCounter);

				leftPixelChecker($scope, a, down);
				rightPixelChecker($scope, a, down);

				down++;
			} else {
				if (i > 0) {
					break;
				}
			};

		} while (1);
	};
};

function leftPixelChecker($scope, a, b) {

	if ($scope.matrix[a - 1] == undefined) {
		return
	};
	if (($scope.matrix[a][b] == 1) && ($scope.matrix[a - 1][b] == 0)) { //если пусто
		$scope.matrix[a - 1][b] = 1; //нашли точку слева
		dotsCounter++; //счетчик точек +1
		// //# console.log('leftPixelChecker a, b ', a, b);



		verticalChecker($scope, (a - 1), b); //проверили вертикаль
	};
	leftPixelChecker($scope, (a - 1), b); //ищем следующую слева
};

function rightPixelChecker($scope, a, b) {

	if ($scope.matrix[a + 1] == undefined) {
		return
	};
	if (($scope.matrix[a][b] == 1) && ($scope.matrix[a + 1][b] == 0)) { //если пусто
		$scope.matrix[a + 1][b] = 1; //нашли точку слева
		dotsCounter++; //счетчик точек +1
		// //# console.log('rightPixelChecker a, b ', a, b);



		verticalChecker($scope, (a + 1), b); //проверили вертикаль
	};
	rightPixelChecker($scope, (a + 1), b); //ищем следующую справа
};

function findEnemyfindFreeDots($scope) {
	//поиск вражеских и пустых точек:
	console.log('START findEnemyfindFreeDots: ');

	enemyDots.length = 0;
	var freeDots = [];
	var myDots = [];
	var minA = $scope.minAndMax[0];
	var minB = $scope.minAndMax[1];
	for (var a = 1; a < $scope.matrixA; a++) {
		for (var b = 1; b < $scope.matrixB; b++) {
			if ($scope.matrix[a][b] == 0) {
				var abc = minA + a - 1 + (minB + b - 1) * (n - 1);

				if (MyDotsData[abc][3] >= 10) { //блокированная точка (!)
					continue //получится пустой контур и выкинется 
				};

				if (MyDotsData[abc][2] == enemyColor) { //вражеская
					enemyDots.push(abc);
					console.log('YESS +1 new enemyDot : ', enemyDots);

				};
				if (MyDotsData[abc][2] == 0) { //пустая
					freeDots.push(abc);
				};
				if (MyDotsData[abc][2] == myColor) { //своя
					myDots.push(abc);
				};
			};
		}
	};



	//      enemyDots             список вражеских точек 
	$scope.freeDots = freeDots; //список пустых точек 
	$scope.myDots = myDots; //список своих точек
	console.log('findEnemyfindFreeDots() enemyDots: ', enemyDots.length, enemyDots);

	// //# console.log( 'freeContoursList[0][0]: ', freeContoursList[0][0]);
	// //# console.log( 'freeContoursList[0][1]: ', freeContoursList[0][1]);
};

function OccupiedAreaWrite($scope) {
	//переносим значения из временной matrix[a][b] в основные  
	// MyDotsData[nn][3] = myColor * 10; и
	// totalOccupiedArea[a][b] = myColor;

	var minA = $scope.minAndMax[0];
	var minB = $scope.minAndMax[1];

	for (var b = 1; b < $scope.matrixB; b++) { // начинаем с 1(т.к. смотрим на 1 назад)
		for (var a = 1; a < $scope.matrixA; a++) { // теперь это квадратики 0,0 = 0-1, 0-1

			if ($scope.matrix[a][b] == 0) { // заливаем все внутри(для подсчета площади)

				MyDotsData[(minA + a - 1 + (minB + b - 1) * (n - 1))][3] = myColor * 10; // BlockOccupiedArea
				// blockedDots.push(minA + a - 1 + (minB + b - 1) * (n - 1)); // создаем список всех блокированных точек
				$scope.matrix[a][b] = 8;
			};

			if ($scope.matrix[a][b] == 8) { // переношу все точки в общую матрицу площади
				totalOccupiedArea[minA + a - 1][minB + b - 1] = myColor;
			};

		}; //  b цикл посчитали
	}; // a посчитали
};

function OccupiedAreaCalculation($scope) {
	// считаем занятую площадь 
	var myCapturedDots = 0;
	var enemyCapturedDots = 0;
	var sMyArea = 0;
	var sEnemyArea = 0;
	for (var b = 1; b < n - 1; b++) { // считаем занятую плащадь по всей матрице и захваченные точки
		for (var a = 1; a < n - 1; a++) { // начинаем с 1,1 (т.к. смотрим на 1 назад-вверх)
			// считаем полщадь каждого квадратика
			// var abc = a - 1 + (b - 1) * (n - 1); // немного наоборот  a и b
			// if (MyDotsData[abc][3] == myColor * 10) {
			var nn = a - 1 + (b - 1) * (n - 1);
			var my = 0,
				enemy = 0;
			// sDots = totalOccupiedArea[a][b] + totalOccupiedArea[a - 1][b] + totalOccupiedArea[a][b - 1] + totalOccupiedArea[a - 1][b - 1]; // смотрим назад-вверх от точки

			switch (MyDotsData[nn][3]) { // считаем захваченные точки. Свои и противника 
				case (myColor * 10): // помечена как захваченая "своя" область
					if (MyDotsData[nn][2] === enemyColor) { // цвет точки противника
						myCapturedDots++
						// AnyColorDotDraw(fillColor[myColor], a - 1, b - 1);
					};
					break;
				case (enemyColor * 10): // помечена как захваченая область "противника"
					if (MyDotsData[nn][2] === myColor) { // цвет захваченой точки "своя"
						enemyCapturedDots++
						// AnyColorDotDraw(fillColor[enemyColor], a - 1, b - 1);
					};
					break;
			};

			if (totalOccupiedArea[a][b] === myColor) { // (!) желательно переделать, много букОв, не читабельно
				my++
			} else if (totalOccupiedArea[a][b] === enemyColor) {
				enemy++
			};
			if (totalOccupiedArea[a - 1][b] === myColor) {
				my++
			} else if (totalOccupiedArea[a - 1][b] === enemyColor) {
				enemy++
			};
			if (totalOccupiedArea[a][b - 1] === myColor) {
				my++
			} else if (totalOccupiedArea[a][b - 1] === enemyColor) {
				enemy++
			};
			if (totalOccupiedArea[a - 1][b - 1] === myColor) {
				my++;
				// AnyColorDotDraw(fillColor[myColor], a - 1, b - 1);
			} else if (totalOccupiedArea[a - 1][b - 1] === enemyColor) {
				enemy++;
				// AnyColorDotDraw(fillColor[enemyColor], a - 1, b - 1);
			};

			if (my === 4) {
				sMyArea += 1
			};
			if (my === 3) {
				sMyArea += .5
			};
			if (enemy === 4) {
				sEnemyArea += 1
			};
			if (enemy === 3) {
				sEnemyArea += .5
			};
		}; //a end
	}; // b end

	$scope.occupiedArea = sMyArea;
	$scope.enemyOccupiedArea = sEnemyArea;
	$scope.capturedDots = myCapturedDots;
	$scope.enemyCapturedDots = enemyCapturedDots;
	// $scope.$apply();
};

// function BlockOccupiedArea() { // помечаем блокированные точки в MyDotsData[n][3] = myColor * 10;
// 	for (var i = 0; i < blockedDots.length; i++) {
// 		MyDotsData[blockedDots[i]][3] = myColor * 10;

// 	};
// };

function CanvasClear() {
	canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function AllDotsDrawing() { // рисуем все точки
	var c = canvas.getContext('2d');
	for (var n = 0; n < MyDotsData.length; n++) {
		if (MyDotsData[n][2] != 0) {
			c.beginPath();
			// c.moveTo(MyDotsData[n][0] * step + step , MyDotsData[n][1] * step + step);
			c.arc(MyDotsData[n][0] * step + step, MyDotsData[n][1] * step + step, dotRadius, 0, 2 * Math.PI);
			c.fillStyle = dotColor[(MyDotsData[n][2])]; //цвет
			c.fill();
			c.closePath();
		}
	};
};

function AreaDraw() {
	if (areasList.length == 0) {
		return
	}; // если контуров нет, рисовать нечего, выход
	var lastestContour = [];
	lastestContour = areasList[areasList.length - 1][1]; // самый последний контур

	for (var i = 0; i < areasList.length - 1; i++) { // номер контура
		if (areasList[i][0][1] > 0) { // если заливка не "прозрачный"
			var t = 0;
			for (var j = 0; j < areasList[i][1].length; j++) { //каждую точку контура ищем
				for (var n = 0; n < lastestContour.length; n++) { //в точках последнего контура(перебором)
					if (areasList[i][1][j] == lastestContour[n]) {
						t++
						break; // выход из цикла n
					};
				};

				if (t >= 2) {
					areasList[i][0][1] = 0; // Совпало 2+ точек. делаем заливку "прозрачной"
					break; // выход из цикла j

				};
			}
		}
	}



	var x, y;
	var area = canvas.getContext('2d');

	area.beginPath();
	area.lineWidth = 2;



	for (var i = 0; i < areasList.length; i++) { //номер контура
		area.beginPath();

		area.strokeStyle = dotColor[areasList[i][0][0]]; // контур
		area.fillStyle = fillColor[areasList[i][0][1]]; //заливка
		x = MyDotsData[areasList[i][1][0]][0] * step + step;
		y = MyDotsData[areasList[i][1][0]][1] * step + step;
		area.moveTo(x, y);

		for (var j = 1; j < areasList[i][1].length; j++) { //массив
			x = MyDotsData[areasList[i][1][j]][0] * step + step;
			y = MyDotsData[areasList[i][1][j]][1] * step + step;
			area.lineTo(x, y);
		};

		area.closePath();
		area.stroke(); // обвести линиями


		// if (areasList[i][0][1] > 0) {
		area.fill()
			// }; // закрасить
	};

	//"red"  "rgba(255,0,0,.6)" 
	//"green" "rgba(0, 128, 0, .6)"
	// 	c.isPointInPath(x,y) 


};

function someContourDotsFinder(a, b) {
	var aContIs, bContIs;
	var result;


	// a = someContour[someContour.length - 2]; // т входа на контур
	// b = someContour[someContour.length - 1]; // т выхода из контура
	console.log('reverse  someContourDotsFinder входные a, b: ', a, b);


	for (var i = areasList.length - 1; i >= 0; i--) { // это массив контуров для отрисовки, с последнего
		if (areasList[i][0][1] === 0) { // если контур прозрачный => пропускаем
			continue
		};

		var buffer = [];
		var piece = [];
		var pushIt = NaN;
		for (var j = 0; j < areasList[i][1].length; j++) { //поиск среди точек каждого (непрозрачного) контура


			if (areasList[i][1][j] === b) { //нашли последнюю точку 
				bContIs = i;
				if (pushIt) { // и первая уже найдена => выход
					pushIt = false;
					break;
				};
				pushIt = false;
			};


			if (pushIt) { // ложим в буффер все точки кроме первой и последней
				buffer.push(areasList[i][1][j])
			};

			if (areasList[i][1][j] === a) {
				pushIt = true
				aContIs = i;
			};

			if (isNaN(pushIt)) { // пишем в доп. список до тех пор пока найдем 'a' или 'b'
				piece.push(areasList[i][1][j])
			};

			//# console.log('nn: ', areasList[i][1][j]);
			//# console.log('pushIt: ', pushIt);
		};
		console.log('piece: ', piece);
		console.log('buffer: ', buffer);
		if ((aContIs === bContIs) && !isNaN(pushIt)) {
			if (pushIt) { // (gap) если (pushIt = true) значит 'а' нашли последним. добавляем кусочек от 0 до 'b'
				var res = buffer.concat(piece);
				result = [].concat([res, buffer, piece]); // ??

			} else {
				result = [].concat([buffer, null, null]); // сначала нашли a потом b. Все нормально. // ??
			};
			console.log('result: ', result);

			return result;
		};



	};
};

function someContourDotsFinderReverse(abList, iOfAreas) {
	// ищем точки перехода с контура на контур, пока не дойдем до контура с которого начали

	//for (var n = 1; n < abList.length; n++) { // корректируем контур areas[i], орентируясь на abList 

	//	if (abList[n][4] === null) {

	// startPoint, endPoint  - nn (общий номер напр. nn:89)
	// changeFrom, n         - n (номер по порядку в массиве areas[i])
	// []                    - список точек nn для замены или null(если есть вражеские точки)

	var aa, bb, a, b, f;
	var jumpList = [];
	var nativeContour = [];
	nativeContour = listOfContoursNumberByNN[abList[0][1]]; // № контура первой т b на контуре
	var dtlArray = [];

	for (var n = 0; n < abList.length; n++) { // найдем все переходы с контура на контур
		aa = listOfContoursNumberByNN[abList[n][0]];
		bb = listOfContoursNumberByNN[abList[n][1]];
		if (aa != bb) { // перешли на др контур (номера контуров не совпадают)
			jumpList.push([n, aa, bb]); //записали n (abList), номер контура с которого перешли, на котороый перешли
		};


	};

	// найдем каждую замкнутую область с разными контурами, соберем точки(ab,f,ab,f) в dtl и запишем в массив dtl

	for (var j = 0; j < jumpList.length; j++) { // проход по номерам контуров

		var tArea = [];
		var tPart = [];
		var tAbList = [];

		for (var i = j; i < jumpList.length; i++) {

			tArea.push(jumpList[i][2]); // временно записываем номера контуров по которым проходим (путь)
			if (jumpList[j][1] == jumpList[i][2]) { // перешли на тот контур с которого стартовали
				console.log('Reverse bingo! jumpList[j][1] == jumpList[i][2]');

				tPart = [];
				n = jumpList[i][0]; // значение n последнего контура

				for (var m = j; m <= i; m++) {
					console.log('Reverse цикл m, j, i  ', m, j, i);

					b = abList[n][1]; //n из предидущего цикла m
					n = jumpList[m][0]; // n в abList[n]
					a = abList[n][0]; // n из текущего цикла m 
					tAbList.push(n);

					f = someContourDotsFinder(a, b);
					console.log('Reverse a, b, (f[0]): ', a, b, f[0]);

					tPart = tPart.concat(f[0]);
					console.log('Reverse tPart.concat(f): ', tPart);

					tPart = tPart.concat(areas[iOfAreas].slice(abList[n][2], abList[n][3] + 1));

					console.log('Reverse areas[i]: ', areas[iOfAreas]);
					console.log('Reverse jumpList: ', jumpList);
					console.log('Reverse abList: ', abList);
					console.log('Reverse tArea: ', tArea);
					console.log('Reverse areas.slice(abList[n][2], abList[n][3] + 1): ', areas[iOfAreas].slice(abList[n][2], abList[n][3] + 1));
					console.log('Reverse tPart = f + areas.slice: ', tPart);
					console.log('Reverse jumpList[', m, '][1]: ', jumpList[m][1]);
					console.log('Reverse jumpList[', m, '][2]: ', jumpList[m][2]);
					console.log('Reverse tArea.lastIndexOf(jumpList[', m, '][1]): ', tArea.lastIndexOf(jumpList[m][1]));
					console.log('Reverse tArea.lastIndexOf(jumpList[', m, '][2]): ', tArea.lastIndexOf(jumpList[m][2]));

					m = j + tArea.lastIndexOf(jumpList[m][2]); // порядковый номер последнего перехода на контур
					console.log('Reverse m = j + tArea.lastIndexOf(jumpList[m][2]: ', m);
				};

				dtlArray.push([tPart, tAbList]);
				console.log('Reverse dtlArray: ', dtlArray);
				console.log('Reverse =============== ');
				break;

			};
		};
	};
return dtlArray;
};


function areasCleaner($scope, i) {
	console.log('START areasCleaner');
	var abList = [];
	var startPoint = null;
	var endPoint = null;
	var changeFrom;
	var gap;
	var lengthCorrect = [];

	var nn = areas[i][0];
	if (MyDotsData[nn][4] == 1) { // стартовали с воздуха
		var startFromAir = 1;

	};

	if (MyDotsData[nn][4] == 0) { // стартовали с границы
		var startFromBorder = 1;

	};


	//цикл по areas[i]. Находим парные точки 'a','b'
	for (var n = 1; n <= areas[i].length; n++) {
		var nn_minus1 = areas[i][n - 1];

		if (n == areas[i].length) {
			n = 0;
			// nn = areas[i][0];
		};

		nn = areas[i][n];

		if ((MyDotsData[nn][4] == 1) && (MyDotsData[nn_minus1][4] == 0)) { // зашли на границу
			endPoint = nn; // первая точка на границе
			abList.push([startPoint, endPoint, changeFrom, n, []]); // <= n в роли точки 'b'
			// startPoint, endPoint  - nn (общий номер напр. nn:89)
			// changeFrom, n         - n (номер по порядку в массиве areas[i])
			startPoint = endPoint = null;

		};
		if ((MyDotsData[nn][4] == 0) && (MyDotsData[nn_minus1][4] == 1)) { // вышли с границы
			startPoint = nn_minus1;
			n === 0 ? changeFrom = areas[i].length - 1 : changeFrom = n - 1; // changeFrom - точка на границе, перед выходом

		};
		if (n === 0) {
			break
		};
	}; // цикл по areas[i]. END

	if ((startPoint == endPoint) && !abList.length) {
		console.log('чистить нечего. startPoint == endPoint, areasCleaner END.');
		return
	}

	if (startPoint) { //если startPoint==true, значит пары нет, пишем в abList[0][0] там null
		abList[0][0] = startPoint; // разрыв, соединяем т. 'a' и 'b' 
		abList[0][2] = changeFrom; // разрыв, соединяем т. 'a' и 'b' 

		console.log('Нашли парные точки [a,b] коррекция первого значения:', abList);
	};
	// нашли парные точки 'a','b'. END


	// проходим по каждой паре
	if (abList.length) { // проверка, что список не пустой
		console.log('Парные точки, результат в abList [a,b,changeFrom,n]:', abList);
		someContourDotsFinderReverse(abList, i);
		for (var n = abList.length - 1; n >= 0; n--) { // находим точки идущие по границе контура, идем с конца чтобы правильно отработали данные из changeFrom
			console.log('Проходим по точкам: ', abList[n][0], abList[n][1]);
			if (abList[n][2] > abList[n][3]) {
				gap = true;
			} else {
				gap = false;
			};

			var f = someContourDotsFinder(abList[n][0], abList[n][1]); // возвращает либо точки, либо undefined, если ушли на другой контур
			console.log('f: ', f);
			if (f === undefined) {
				abList[n][4] = null; // временная заглушка
				continue
			};
			console.log('areas[', i, ']: ', areas[i]);
			console.log('Подготавливаем dtl для тестирования: ');


			// dtl для тестирования:
			if ((f === undefined) || (f[0].length == 0)) { // f в порядке?
				if (gap) {
					dtl = areas[i].slice(abList[n][2]);
					dtl = dtl.concat(areas[i].slice(0, abList[n][3] + 1));

					console.log('gap detected!');
				} else {
					dtl = areas[i].slice(abList[n][2], abList[n][3] + 1);
				};
				console.log(' areas[', i, '].slice(', abList[n][2], abList[n][3] + 1, ') без f: ', dtl);

			} else {

				if (gap) {
					dtl = areas[i].slice(abList[n][2]);
					dtl = dtl.concat(areas[i].slice(0, abList[n][3] + 1));
					dtl = dtl.concat(f[0]);

					console.log('gap detected!');
					console.log(' areas[', i, '].slice(', abList[n][2], ').concat(areas[i].slice(0,', (abList[n][3] + 1), ')).concat(f[0]): ', dtl);

				} else {
					dtl = areas[i].slice(abList[n][2], abList[n][3] + 1).concat(f[0]);
					console.log(' areas[', i, '].slice(', abList[n][2], abList[n][3] + 1, ').concat(f[0]): ', dtl);
				};
			};

			if (dtl.length < 4) { //отбрасываем явно маленькие контуры
				enemyDots.length = 0;
			} else {

				console.log(' > (START)minMaxMatrix >...> enemyDots:');
				console.log('dtl для тестирования готово^^: ', dtl);

				minMaxMatrix($scope);
				fillFromOutside($scope);
				findEnemyfindFreeDots($scope);
			};

			//корректируем abList, если вржеских точек не обнаружено пишем f(точки для замены), если обнаружены - null (не менять далее)
			if (enemyDots.length === 0) {
				console.log('Вражеских точек не обнаружено, зпишем в : abList[n][4]');

				// Запишем результат в abList[n]
				if (f === undefined) { // перешли на другой контур, это временно, еще нужно проработать

				} else {
					if (gap) {
						if (f[1] == null) {
							console.log('f[1]== null => []');
							f[1] = [];
						};
						if (f[2] == null) {
							console.log('f[2]== null => []');
							f[2] = [];
						};
						abList[n][4] = [].concat(f[1]).concat('gap').concat(f[2]);
					} else {
						abList[n][4] = [].concat(f[0]);
					};

					console.log('abList[', n, '][4]:', abList[n][4]);
				};

			} else {
				abList[n][4] = null;
				console.log(' Вражеские точки обнаружены: ', enemyDots.length, enemyDots);
				console.log(' ЗАМЕНЫ areas[', i, '] ТОЧЕК НЕ БЫЛО ', areas[i]);

				// debugger;
			};
		};

		// подготовка к замене
		gap = false;
		if (abList[0][4]) { //проверка что значение не null, не undefined
			var gapA = [];
			var gapB = [];
			if (abList[0][2] > abList[0][3]) {
				for (var n = 0; n < abList[0][4].length; n++) {

					if (abList[0][4][n] === 'gap') {
						gap = true;
						if (abList[0][4].length === 1) {
							break
						};
						n++;

					};


					if (gap) {
						gapB.push(abList[0][4][n])
					} else {
						gapA.push(abList[0][4][n])
					};
				};
			};
		};
		var tempArea = [];


		// пишем точки в новый массив и заменяем там где надо, затем заменим старый на новый
		if (abList[0][4] === null) {
			tempArea = areas[i].slice(0, abList[0][3]) // точки обнаружены +/- разрыв (все равно копируем до точки B)

		} else if (gap) {
			tempArea = [].concat(gapB); // точки не обнаружены, разрыв
		} else {
			tempArea = areas[i].slice(0, abList[0][2] + 1).concat(abList[0][4]) // точки не обнаружены, разрыва нет
		};

		for (var n = 1; n < abList.length; n++) { // корректируем контур areas[i], орентируясь на abList 
			if (abList[n][4] === null) {
				tempArea = tempArea.concat(areas[i].slice(abList[n - 1][3], abList[n][3]));
			} else {
				tempArea = tempArea.concat(areas[i].slice(abList[n - 1][3], abList[n][2] + 1).concat(abList[n][4]));
				// startPoint, endPoint  - nn (общий номер напр. nn:89)
				// changeFrom, n         - n (номер по порядку в массиве areas[i])
				// []                    - список точек nn для замены или null(если есть вражеские точки)
			};
		};
		n--;

		if (abList[0][4] === null) {
			tempArea = tempArea.concat(areas[i].slice(abList[n][3]));

		} else if (gap) {
			console.log('qwerty gap tempArea до: ', tempArea);
			tempArea = tempArea.concat(areas[i].slice(abList[n][3], abList[0][2] + 1)).concat(gapA);
			console.log('qwerty gap tempArea после: ', tempArea);
		} else {
			tempArea = tempArea.concat(areas[i].slice(abList[n][3]));
		};

		console.log('qwerty abList: ', abList);
		console.log('qwerty areas[', i, '] что было: ', areas[i]);
		console.log('qwerty tempArea что стало: ', tempArea);
		areas[i] = [].concat(tempArea);
		// if (gap) {debugger};
	};
	//debugger;
	abList.length = 0; // ?? лишнее?


	console.log('END areasCleaner END');


};

function freeContoursList_Manager(argument) {
	// body...
};

function matrixArray(columns, rows) {
	var arr = [];
	for (var i = 0; i < columns; i++) {
		arr[i] = [];
		for (var j = 0; j < rows; j++) {
			arr[i][j] = 0;
		};
	};
	return arr;
};



function PositionDetect(e) {
	var x = e.offsetX == undefined ? e.layerX : e.offsetX;
	var y = e.offsetY == undefined ? e.layerY : e.offsetY;

	var ggg = x / step - Math.floor(x / step);
	var rrr = y / step - Math.floor(y / step);
	if ((ggg > .3 && ggg < .7) || (rrr > .3 && rrr < .7)) {
		return -1;
	}; // попадание: от -0.3 до +0.3 размера клетки (точка 0.6 клетки)

	var dotAn = Math.round(x / step) - 1; // 0 - n-2
	var dotBn = Math.round(y / step) - 1; // 0 - n-2
	var nn = dotAn + (n - 1) * (dotBn);
	if ((dotAn < 0) || (dotBn < 0) || (dotAn > n - 2) || (dotBn > n - 2)) {
		return -1;
	}; // не выходим за границы сетки
	return nn;
};


function clearAll($scope) {
	console.log('clearAll START');
	MyDotsDataCreator();
	totalOccupiedArea = matrixArray(n - 1, n - 1);
	areasList.length = 0;
	isNew = true; //костыль
	refresh();

	console.log('clearAll COMPLETE');


};

function refresh() {
	CanvasClear();
	gird(canvas);
	AllDotsDrawing();
	AreaDraw();
	console.log('refresh complete!');
};



function MyDotsDataCreator() {
	var myCounter = 0;
	for (var b = 0; b < n - 1; b++) { // создаем массив MyDotsData[][]
		for (var a = 0; a < n - 1; a++) { //!!!!
			MyDotsData[myCounter] = [];
			MyDotsData[myCounter] = [a, b, 0, 0, 0];
			myCounter++;

		};
	};
};