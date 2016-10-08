var myApp = angular.module('dotsApp', []);

var nn, n;
var dotsCounter;

var dotColor = ["transparent", "red", "green", "yellow", "white"];
var myColor = 1;
var enemyColor = 2; // вражеский цвет
var canvas = document.getElementById('myCanvas');

var c = canvas.getContext('2d');

n = 11; //количество клеток, пересечений (n-1)
x = canvas.width = 400; //400px ширина canvas
y = canvas.height = 400; //400px высота canvas

var step = x / n; //шаг сетки px
var dotRadius = step / 8;

gird(canvas);

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
};


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
			})
		}
	};
});



myApp.controller('textController', function($scope, socket) {

	var phonesTest = ['1blalba', 2, "fedf", 'fdffd'];

	socket.emit('message', angular.toJson(phonesTest));

	socket.on('message', function(msgData) {
		$scope.chat = angular.fromJson(msgData);
	});

});


myApp.controller('dotsController', function($scope, socket) {

	var myCounter = 0;
	$scope.MyDotsData = [];
	$scope.dtl = [];
	$scope.freeContoursList = [];
	$scope.areasList = [];
	$scope.blockedDots = [];
	$scope.totalOccupiedArea = matrixArray(n - 1, n - 1);



	for (var b = 0; b < n - 1; b++) { // создаем массив MyDotsData[][]
		for (var a = 0; a < n - 1; a++) { //!!!!
			$scope.MyDotsData[myCounter] = [];
			$scope.MyDotsData[myCounter] = [a, b, 0, 0];
			myCounter++;

		};
	};

	console.log('MyDotsData : ' + $scope.MyDotsData);


	// var phonesTest = 'Nothing';

	// socket.emit('myData', angular.toJson(phonesTest));

	socket.on('myData', function(msgData) {
		$scope.nn = angular.fromJson(msgData)
	});



	$scope.canvasNgClick = function(e) {

		var x = e.offsetX == undefined ? e.layerX : e.offsetX;
		var y = e.offsetY == undefined ? e.layerY : e.offsetY;

		var ggg = x / step - Math.floor(x / step);
		var rrr = y / step - Math.floor(y / step);
		if ((ggg > .3 && ggg < .7) || (rrr > .3 && rrr < .7)) {
			return
		}; // попадание: от -0.3 до +0.3 размера клетки (точка 0.6 клетки)


		var dotAn = Math.round(x / step) - 1; // 0 - n-2
		var dotBn = Math.round(y / step) - 1; // 0 - n-2
		var nn = dotAn + (n - 1) * (dotBn);
		if ($scope.MyDotsData[nn][3] >= 10) {
			return
		} // блокированная точка в blockOccupiedArea

		OneDotDraw($scope, nn); //точку сначала нарисовали, а потом все остальные операции
		socket.emit('myData', angular.toJson(nn));
	};


	$scope.$watch("nn", function(nn) {
		if (nn == undefined) {
			console.log(' nn undefined');
			return;
		};



		//первичная проверкиа точки (по соседним точкам):
		if (dotFastCheckup($scope, nn) == false) {
			return; //если false завершаем обработку клика
		};
		//поиск всех рядом стоящих точек:

		$scope.dtl.length = 0; //обнулили список рядом стоящих точек
		console.log(' $scope.dtl перед AllNearDotsSearch : ', $scope.dtl);

		AllNearDotsSearch($scope, nn);
		//поиск всех рядом стоящих точек: $scope.dtl
		// все точки были помечены - $scope.MyDotsData[nn][3] = myColor;
		console.log('AllNearDotsSearch по соседним точкам готово. $scope.dtl : ', $scope.dtl);


		//сниманм метки $scope.MyDotsData[nn][3] = myColor => 0
		for (var i = 0; i < $scope.dtl.length; i++) {
			$scope.MyDotsData[$scope.dtl[i]][3] = 0;
		};


		minMaxMatrix($scope); // мин и макс (по x и y) точки из списка $scope.dtl
		// создали матрицу $scope.matrix[a][b]
		//  заполнили из $scope.dtl $scope.matrix[a][b] = 8



		contoursSeparate($scope); // удаляем лишние точки, поиск контуров
		// все найденные контуры (4+ точек), занесли в массив $scope.areas[[]]

		console.log('$scope.areas[0].length > 0', $scope.areas[0].length > 0);
		if ($scope.areas[0].length > 0) { //если массив не пустой
			for (var i = 0; i < $scope.areas.length; i++) { // обрабатываем каждый контур
				console.log('$scope.areas : ', $scope.areas);
				console.log('$scope.areas[', i, ']  : ', $scope.areas[i]);

				$scope.dtl = [];
				// for (var q = 0; q < $scope.areas[i].length; q++) {

				$scope.dtl = $scope.areas[i];
				console.log('$scope.areas[', i, ']  : ', $scope.areas[i]);
				console.log('$scope.dtl: ', $scope.dtl);


				// };


				console.log('$scope.dtl = $scope.areas[', i, '] обновили(в цикле) : ', $scope.dtl);

				minMaxMatrix($scope); // создали матрицу

				fillFromOutside($scope); //заливка снаружи


				findEnemyfindFreeDots($scope); // посчитали вражеские и пустые точки. $scope.enemyDots, $scope.freeDots
				//$scope.enemyDots - список вражеских точек 
				//$scope.freeDots - список пустых точек 
				//$scope.myDots - список своих точек

				console.log('$scope.enemyDots.length  : ', $scope.enemyDots.length);
				console.log('$scope.enemyDots  : ', $scope.enemyDots);
				console.log('$scope.freeDots.length  : ', $scope.freeDots.length);
				console.log('$scope.freeDots  : ', $scope.freeDots);


				if ($scope.enemyDots.length == 0 && ($scope.freeDots.length > 0)) { // если вражеских точек нет, но есть пустые => в список пустых контуров

					$scope.freeContoursList.push([$scope.freeDots, $scope.dtl]); //в список пустых контуров

					console.log('НЕТ вражеских точек , но есть пустые => в список пустых контуров : ', $scope.freeContoursList[$scope.freeContoursList.length - 1]);
					continue;
				};

				if ($scope.enemyDots.length == 0) { // если вражеских точек нет => след. контур
					console.log('НЕТ вражеских точек , в контуре  $scope.dtl : ', $scope.dtl);
					console.log('$scope.enemyDots.length == ', $scope.enemyDots.length);
					// $scope.dtl.length = 0;

					continue;
				};
				console.log('$scope.enemyDots.length > 0?? ', $scope.enemyDots.length, '  если нет -= КАРАУЛ!!!');
				console.log('$scope.enemyDots : ', $scope.enemyDots);

				occupiedArea($scope); // считаем занятую площадь 
				//$scope.occupiedArea
				console.log('$scope.occupiedArea: ', $scope.occupiedArea / 10, ' квадратика занято');
				blockOccupiedArea($scope); // помечаем блокированные точки в $scope.MyDotsData[n][3] = myColor * 10

				if ($scope.enemyDots.length > 0) {
					var areasList = [];
					areasList = [$scope.dtl, $scope.blockedDots, $scope.occupiedArea, $scope.enemyDots];

					$scope.areasList.push(areasList);
					console.log('Сработал $scope.areasList.push: ', $scope.areasList);
					console.log('$scope.dtl: ', $scope.dtl);
					// areasList = [];

				};

			};
			console.log('Цикл по $scope.areas законцился. $scope.areasList: ', $scope.areasList);
			console.log('$scope.freeContoursList элементов : ', $scope.freeContoursList.length);
			$scope.areas.length = 0;
		};
		canvasClear();
		gird(canvas);
		AllDotsDrawing($scope);
		AreaDraw($scope);
		// $scope.matrix.length=0;

	}); //$scope.$watch("nn"  end

});

// function OneDotDraw(n) { // рисуем точку n (только-что добавленную в массив)

// 	var c = canvas.getContext('2d');
// 	c.beginPath();
// 	// c.moveTo(MyDotsData[n][0] * step + step , MyDotsData[n][1] * step + step);
// 	c.arc(MyDotsData[n][0] * step + step, MyDotsData[n][1] * step + step, dotRadius, 0, 2 * Math.PI);
// 	c.fillStyle = dotColor[(MyDotsData[n][2])];
// 	if (myColorForTests == 3) {
// 		c.fillStyle = dotColor[myColorForTests];
// 	};
// 	c.fill();
// 	c.closePath();

// };


// Меняем цвет точки вручную:
document.getElementById('greenCol').onclick = function(e) { //зеленый
	myColor = 2;
};

document.getElementById('redCol').onclick = function(e) { //красный
	myColor = 1;
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



function OneDotDraw($scope, nValue) {

	$scope.MyDotsData[nValue][2] = myColor;

	var x = $scope.MyDotsData[nValue][0] * step + step;
	var y = $scope.MyDotsData[nValue][1] * step + step;
	var c = canvas.getContext('2d');
	c.beginPath();
	c.arc(x, y, dotRadius, 0, 2 * Math.PI);
	c.fillStyle = dotColor[myColor];
	c.fill();
	c.closePath();
};


function dotFastCheckup($scope, nn) {
	var counter = 0;
	var startA, startB, endA, endB, xx;
	var myLittleStack = [];
	myLittleStack.length = 0;
	// console.log("клеток: " + n);

	startA = startB = -1;
	endA = endB = 1;

	if ($scope.MyDotsData[nn][0] == 0) {
		startA = 0;
	};
	if ($scope.MyDotsData[nn][1] == 0) {
		startB = 0
	};

	if ($scope.MyDotsData[nn][0] == (n - 2)) {
		endA = 0
	};
	if ($scope.MyDotsData[nn][1] == (n - 2)) {
		endB = 0
	};


	for (var b = startB; b <= endB; b++) { //находим все точки в зоне "видимости":
		for (var a = startA; a <= endA; a++) {
			xx = (nn + a + b * (n - 1));
			if (xx == nn) { //пропускаем центральную точку
				continue;
			};
			counter++;
			if ($scope.MyDotsData[xx] == undefined) { //пропускаем пустую точку
				continue;
			};

			if ($scope.MyDotsData[xx][2] == myColor) { //если свой цвет
				myLittleStack.push(xx); //создаем список номеров "своих" точек
			};

		};
	};

	// console.log('точек обработано ' + counter + "; точек добавлено: " + myLittleStack.length);

	var lastDot = myLittleStack.pop(); //предпроверка точки на возможность создания контура:
	var myAa = 0, //если есть две несмежные точки возле проверяемой, то return true
		myBb = 0;
	for (var i = 0; i < myLittleStack.length; i++) { //меряем рассояние каждой точки до остальных
		myAa = Math.abs($scope.MyDotsData[lastDot][0] - $scope.MyDotsData[myLittleStack[i]][0]); //по модулю
		myBb = Math.abs($scope.MyDotsData[lastDot][1] - $scope.MyDotsData[myLittleStack[i]][1]);
		// console.log("myAa: " + myAa + " myBb: " + myBb);
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
	if ($scope.MyDotsData[nn][0] == 0) {
		startA = 0
	};
	if ($scope.MyDotsData[nn][1] == 0) {
		startB = 0;
	};

	if ($scope.MyDotsData[nn][0] == (n - 2)) {
		endA = 0
	};
	if ($scope.MyDotsData[nn][1] == (n - 2)) {
		endB = 0
	};


	if ($scope.MyDotsData[nn][3] == 0) { //проверка не помечена ли уже тока
		$scope.MyDotsData[nn][3] = myColor //если нет, помечаем точку (своим цветом), пишем в $scope.MyDotsData[nn][3]
	};

	$scope.dtl.push(nn); // добавляем точку в список (контур)
	// console.log('AllNearDotsSearch dtl: ', $scope.dtl);


	for (var b = startB; b <= endB; b++) { //цикл по соседним точкам
		for (var a = startA; a <= endA; a++) {
			xx = (nn + a + b * (n - 1)); //порядковый номер точки
			if ($scope.MyDotsData[xx] == undefined) { //пропускаем пустую точку 
				alert('этого не должно было случитья. ищи 5432');
				continue;
			};
			if (xx == nn) { //пропускаем центральную точку
				continue;
			};

			if ($scope.MyDotsData[xx][3] == 0) { //если точка не помечена 
				if ($scope.MyDotsData[xx][2] == myColor) { //если свой цвет

					AllNearDotsSearch($scope, xx);
				};
			};
		};
	};
};

function minMaxMatrix($scope) {
	var obj = [];
	console.log('должен быть 0 obj ', obj);
	if ($scope.dtl[0] == undefined) {
		return
	};
	var minA = maxA = $scope.MyDotsData[$scope.dtl[0]][0]; // задаем стартовое значение, с чем сравнивать
	var minB = maxB = $scope.MyDotsData[$scope.dtl[0]][1];

	//найдем мин и макс координаты точек:
	for (var i = 1; i < $scope.dtl.length; i++) {

		if ($scope.MyDotsData[$scope.dtl[i]][0] > maxA) {
			maxA = $scope.MyDotsData[$scope.dtl[i]][0]
		};
		if ($scope.MyDotsData[$scope.dtl[i]][0] < minA) {
			minA = $scope.MyDotsData[$scope.dtl[i]][0]
		};
		if ($scope.MyDotsData[$scope.dtl[i]][1] > maxB) {
			maxB = $scope.MyDotsData[$scope.dtl[i]][1]
		};
		if ($scope.MyDotsData[$scope.dtl[i]][1] < minB) {
			minB = $scope.MyDotsData[$scope.dtl[i]][1]
		};


	}; // найдем мин и макс координаты точек. end
	console.log('должен быть 0 obj (попытка вторая) ', obj);

	obj.push(minA, minB, maxA, maxB); //запишем значения 
	$scope.minAndMax = obj;
	var matrixA = maxA - minA + 3; // размер +1px с каждой стороны для алгоритма заливки снаружи  
	var matrixB = maxB - minB + 3;
	$scope.matrixA = matrixA;
	$scope.matrixB = matrixB;
	console.log('$scope.matrixA, $scope.matrixB :', $scope.matrixA, $scope.matrixB); // min и max каждого контура
	console.log('minA, minB, maxA, maxB :', $scope.minAndMax); // min и max каждого контура

	$scope.matrix = matrixArray(matrixA, matrixB); // (rows, columns), заполнение 0



	//заполним матрицу данными:
	for (var i = 0; i < $scope.dtl.length; i++) {
		var a = $scope.MyDotsData[$scope.dtl[i]][0] - minA + 1; // смещаем на 1px
		var b = $scope.MyDotsData[$scope.dtl[i]][1] - minB + 1; // смещаем на 1px
		$scope.matrix[a][b] = 8; //точки контура запишем как цифру 8
	};
	//заполним матрицу данными
	console.log('заполнили данными $scope.matrix: ', $scope.matrix);
	console.log('Вывели созданную и заполненную из $scope.dtl матрицу $scope.matrix: ', $scope.matrix);

	for (var i = 0; i < matrixA; i++) { // вывели матрицу в консоль
		console.log($scope.matrix[i]);
	};
};

function contoursSeparate($scope) {

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
	var dtl = [];
	var outPoint;
	var minA = $scope.minAndMax[0];
	var minB = $scope.minAndMax[1];
	console.log('$scope minA=', $scope.minAndMax[0]);
	console.log('$scope minB=', $scope.minAndMax[1]);
	// $scope.areas.length = 0; //для тестов
	$scope.areas = [];
	$scope.areas[0] = [];
	var k = 0;

	outPoint = minA + a - 1 + (minB + b - 1) * (n - 1);
	dtl.push(outPoint);
	$scope.matrix[a][b] = 9; //пометили


	while (i < 1000) {
		i++
		for (var r = 0; r < 8; r++) { //цикл по соседним точкам

			x = Math.round(Math.cos(piNa4 * (r + rStart)) - Math.sin(piNa4 * (r + rStart))); //по часовой
			y = Math.round(Math.sin(piNa4 * (r + rStart)) + Math.cos(piNa4 * (r + rStart)));
			var abc = minA + a + x - 1 + (minB + b + y - 1) * (n - 1); //порядковый номер точки



			if ($scope.matrix[a + x][b + y] == 9) { // если вернулись в уже пройденную точку

				for (var j = dtl.length - 1; j >= 0; j--) { // ищем сколько точек назад была эта точка
					if (dtl[j] == abc) { //если нашли

						if ((dtl.length - 1 - j) <= 2) { //точек в контуре  меньше 3х => удалить
							dtl.length = j; // удаляем из массива. 

						} else { //точек в контуре  больше 3х => перенести в новый массив
							$scope.areas[k] = [];

							for (var jj = j; jj <= dtl.length - 1; jj++) { // переписывем от [j до конца]
								$scope.areas[k].push(dtl[jj]);

								console.log('$scope.areas[', k, ']:', $scope.areas[k]);
							};
							k++;


							dtl.length = j; // удаляем из массива. 


						};
					};
				};

				$scope.matrix[a + x][b + y] = 8; //снимаем метку + ниже точка добавляется заново в dtl

			}; // if  == 9



			if ($scope.matrix[a + x][b + y] == 8) { //нашли "следующую" точку

				$scope.matrix[a + x][b + y] = 9; // помечаем

				if (abc == outPoint) { // Вернулись к первой точке. ГОТОВО. Выход!
					$scope.matrix[a + x][b + y] = 8;
					console.log('contoursSearch $scope.areas: ', $scope.areas);
					return;
				};



				//добавили точку в "цепочку", если элемент уже есть в конце то не добавляем
				if (abc == dtl[dtl.length - 1]) {} else {
					dtl.push(abc)
				};



				a = a + x; // сместились на новую координату
				b = b + y;
				rStart = rStart + r - 2; // на 90* против ч.с.

				console.log('contoursSearch dtl(локальная): ', dtl);

				break; // выходим из цикла for, чтобы искать вокруг новой точки

			}; // if  == 8

		}; //END for (var r = 0; r < 8; r++)

	}; //END while 
};

function fillFromOutside($scope) {

	//"заливка" снаружи:
	var matrixA = $scope.matrixA;
	var matrixB = $scope.matrixB;
	var dotsCounter = 0;
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
				// console.log(' b: ' + b + ' ' + ' LineStart: ' + lineStart);
				if (b > (lineStart)) {
					// console.log('b > (LineStart) ++!!');

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
						// console.log('lineEnd:  ' + lineEnd + ' b: ' + b);

						if (b < (lineEnd)) {
							// console.log('b < (LineEnd) ++!!');
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
				// console.log('verticalChecker up a, b ', a, up);
				// console.log('dotsCounter ', dotsCounter);

				leftPixelChecker($scope, a, up);
				rightPixelChecker($scope, a, up);
				up--;
			} else {
				i++
			};

			if ($scope.matrix[a][down] == 0) { //если пусто
				$scope.matrix[a][down] = 1;
				dotsCounter++; //счетчик точек +1
				// console.log('verticalChecker down. a, b ', a, down);
				// console.log('dotsCounter ', dotsCounter);

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
		// console.log('leftPixelChecker a, b ', a, b);



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
		// console.log('rightPixelChecker a, b ', a, b);



		verticalChecker($scope, (a + 1), b); //проверили вертикаль
	};
	rightPixelChecker($scope, (a + 1), b); //ищем следующую справа
};

function findEnemyfindFreeDots($scope) {
	//поиск вражеских и пустых точек:
	var enemyDots = [];
	var freeDots = [];
	var myDots = [];
	var minA = $scope.minAndMax[0];
	var minB = $scope.minAndMax[1];
	for (var a = 1; a < $scope.matrixA; a++) {
		for (var b = 1; b < $scope.matrixB; b++) {
			if ($scope.matrix[a][b] == 0) {
				var abc = minA + a - 1 + (minB + b - 1) * (n - 1);

				if ($scope.MyDotsData[abc][3] >= 10) { //блокированная точка (!)
					continue //получится пустой контур и выкинется 
				};

				if ($scope.MyDotsData[abc][2] == enemyColor) { //вражеская
					enemyDots.push(abc);
				};
				if ($scope.MyDotsData[abc][2] == 0) { //пустая
					freeDots.push(abc);
				};
				if ($scope.MyDotsData[abc][2] == myColor) { //своя
					myDots.push(abc);
				};
			};
		}
	};



	$scope.enemyDots = enemyDots; //список вражеских точек 
	$scope.freeDots = freeDots; //список пустых точек 
	$scope.myDots = myDots; //список своих точек


	$scope.freeContoursList.push([$scope.freeDots, $scope.dtl]); //
	// console.log( '$scope.freeContoursList[0]: ', $scope.freeContoursList[0]);
	// console.log( '$scope.freeContoursList[0][0]: ', $scope.freeContoursList[0][0]);
	// console.log( '$scope.freeContoursList[0][1]: ', $scope.freeContoursList[0][1]);
};

function occupiedArea($scope) {
	// считаем занятую площадь 
	var sOneSquare = 0;
	var sDots = 0;
	var sOfArea = 0;
	var minA = $scope.minAndMax[0];
	var minB = $scope.minAndMax[1];

	for (var a = 1; a < $scope.matrixA; a++) { // теперь это квадратики 0,0 = 0-1, 0-1
		for (var b = 1; b < $scope.matrixB; b++) { // начинаем с 1(т.к. смотрим на 1 назад)

			if ($scope.matrix[a][b] == 0) { // заливаем все внутри(для подсчета площади)
				$scope.blockedDots.push($scope.minAndMax[0] + a - 1 + ($scope.minAndMax[1] + b - 1) * (n - 1)); // создаем список всех блокированных точек
				$scope.matrix[a][b] = 8;
			};

			if ($scope.matrix[a][b] == 8) { // переношу все точки в общую матрицу площади
				$scope.totalOccupiedArea[a + minA - 1][b + minB - 1] = myColor;
			};

		}; //  b цикл посчитали
	}; // a посчитали



	for (var a = 1; a < n - 1; a++) { // считаем занятую плащадь по всей матрице
		for (var b = 1; b < n - 1; b++) { // начинаем с 1(т.к. смотрим на 1 назад)
			// считаем полщадь каждого квадратика
			sDots = $scope.totalOccupiedArea[a][b] + $scope.totalOccupiedArea[a - 1][b] + $scope.totalOccupiedArea[a][b - 1] + $scope.totalOccupiedArea[a - 1][b - 1]; // смотрим назад-вверх от точки
			if (sDots == 4 * myColor) { //если в матрице только 0 и свой цвет, то так считать можно. 
				sOneSquare = 10
			} else if (sDots == 3 * myColor) {
				sOneSquare = 5
			} else {
				sOneSquare = 0
			};
			// запишем в массив
			sOfArea += sOneSquare;

			$scope.occupiedArea = sOfArea;
		};
	};
};

function blockOccupiedArea($scope) { // помечаем блокированные точки в $scope.MyDotsData[n][3] = myColor * 10;
	for (var i = 0; i < $scope.blockedDots.length; i++) {
		$scope.MyDotsData[$scope.blockedDots[i]][3] = myColor * 10;

	}
};

function canvasClear() {
	canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function AllDotsDrawing($scope) { // рисуем все точки
	var c = canvas.getContext('2d');
	for (var n = 0; n < $scope.MyDotsData.length; n++) {
		if ($scope.MyDotsData[n][2] != 0) {
			c.beginPath();
			// c.moveTo(MyDotsData[n][0] * step + step , MyDotsData[n][1] * step + step);
			c.arc($scope.MyDotsData[n][0] * step + step, $scope.MyDotsData[n][1] * step + step, dotRadius, 0, 2 * Math.PI);
			c.fillStyle = dotColor[($scope.MyDotsData[n][2])]; //цвет
			c.fill();
			c.closePath();
		}
	};
};

function AreaDraw($scope) {
	var x, y;
	var area = canvas.getContext('2d');

	area.beginPath();
	area.lineWidth = 2;
	area.strokeStyle = dotColor[myColor];
	area.fillStyle = "rgba(0, 0, 128, .3)" //заливка


	for (var i = 0; i < $scope.areasList.length; i++) { //номер контура
		area.beginPath();
		// x = $scope.MyDotsData[$scope.areasList[i][0][0]][0] * step + step;
		// y = $scope.MyDotsData[$scope.areasList[i][0][0]][1] * step + step;
		x = $scope.MyDotsData[$scope.areasList[i][0][0]][0] * step + step;
		y = $scope.MyDotsData[$scope.areasList[i][0][0]][1] * step + step;
		area.moveTo(x, y);

		for (var j = 1; j < $scope.areasList[i][0].length; j++) { //массив
			// x = $scope.MyDotsData[$scope.areasList[i][0][j]][0] * step + step;
			// y = $scope.MyDotsData[$scope.areasList[i][0][j]][1] * step + step;
			x = $scope.MyDotsData[$scope.areasList[i][0][j]][0] * step + step;
			y = $scope.MyDotsData[$scope.areasList[i][0][j]][1] * step + step;
			area.lineTo(x, y);
		};

		area.closePath();
		area.stroke(); // обвести линиями
		area.fill(); // закрасить

	};

	//"red"  "rgba(255,0,0,.6)"
	//"green" "rgba(0, 128, 0, .6)"
	// 	c.isPointInPath(x,y) 


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