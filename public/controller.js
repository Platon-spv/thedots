


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

myApp.controller('dotsController', function($scope, socket) {

	var phonesTest = ['1blalba', 2, "fedf", 'fdffd'];

	socket.emit('message', angular.toJson(phonesTest));

	socket.on('message', function(msgData) {
		$scope.test = angular.fromJson(msgData)});

});


myApp.controller('textController', function($scope, socket) {

	var phonesTest = ['1blalba', 2, "fedf", 'fdffd'];

	socket.emit('message', angular.toJson(phonesTest));

	socket.on('message', function(msgData) {
		$scope.test = angular.fromJson(msgData)});

});


var canvas = document.getElementById('myCanvas');

var c = canvas.getContext('2d');
var dotColor = ["transparent", "red", "green", "yellow", "white"];
var x, y, n, dotAn, dotBn, myColor, myColorForTests = 0;

n = 11; //количество клеток, пересечений (n-1)
x = canvas.width = 400; //400px ширина canvas
y = canvas.height = 400; //400px высота canvas

var step = x / n; //шаг сетки px

gird(step, x, y, n); //нарисовали сетку



// c.fillStyle = "green";


var dotsCounter;

var FillingPercent = 0; // процент заполнения точками (0-100)%
var maxSteps = Math.floor((n - 1) * (n - 1) / 2);
var nDoubleSteps = Math.floor(maxSteps * FillingPercent / 100); /// пременные
var MyDotsData = [];
var dtl = [];
var myCounter = 0;
var myTurn=1;

var matrix = [
	[]
]; ///????


var dotRadius = step / 8;
if (nDoubleSteps > maxSteps) {
	nDoubleSteps = maxSteps
};



for (var b = 0; b < n - 1; b++) { // создаем массив MyDotsData[][]
	for (var a = 0; a < n - 1; a++) { //!!!!
		MyDotsData[myCounter] = [];
		MyDotsData[myCounter] = [a, b, 0, 0];
		myCounter++;
	};
};


TestDotsFilling(); // расставляем точки (парами) в массиве
AllDotsDrawing(); // рисуем тестовый массив 

console.log('MyDotsData.length : ' + MyDotsData.length);


// console.log('myCounterFreeDots: ' + myCounter + '; maxDoubleSteps = ' + maxSteps);
// console.log('nDoubleSteps max(' + maxSteps + '): ' + nDoubleSteps);


document.getElementById('myCanvas').onclick = function(e) {
	matrix.length = 0;
	
	dtl.length = 0;
	dotsCounter = 0;
	// console.log('matrix.length: ', matrix.length, matrix, 'dtl.length: ', dtl.length, dtl);

	//взяли координаты
	var x = e.offsetX == undefined ? e.layerX : e.offsetX;
	var y = e.offsetY == undefined ? e.layerY : e.offsetY;


	// вычисляем в какое место попали:
	var ggg = x / step - Math.floor(x / step);
	var rrr = y / step - Math.floor(y / step);
	if ((ggg > .3 && ggg < .7) || (rrr > .3 && rrr < .7)) {
		return
	}; // попадание: от -0.3 до +0.3 размера клетки (точка 0.6 клетки)

	dotAn = Math.round(x / step) - 1; // 0 - n-2
	dotBn = Math.round(y / step) - 1; // 0 - n-2
	var nn = dotAn + (n - 1) * (dotBn); //!!!!

	//значения "за полем" отсекаем:
	if (dotAn < 0 || dotBn < 0 || dotAn >= (n - 1) || dotBn >= (n - 1)) {

		return;
	};

	// console.log(x + 'x' + y + ' ' + ' dotAn:' + dotAn + ' dotAn:' + dotBn + ' nn:' + nn);

	// цвет точки:
	if (MyDotsData[nn][2] == 0) {

		if (myColor == undefined) { //цвет случайным образом 
			myColor = Math.round(Math.random()) + 1;
			MyDotsData[nn][2] = myColor;

		} else {
			MyDotsData[nn][2] = myColor; //или выбран цвет
		};

	} else { // если цвет точки задан, значит она уже есть на поле, выход
		return;
	};
	// цвет точки

	OneDotDraw(nn); //ничего не делает просто рисует эту точку


	//первичная проверкиа точки (по соседним точкам):
	if (dotFastCheckup(nn, MyDotsData, myColor) == false) {
		return; //если false завершаем обработку клика
	};

	// обнуляем все метки на всякий случай:


	for (var a = 0; a < MyDotsData.length - 1; a++) {
		MyDotsData[a][3] = 0;
		console.log('Обнуляем  на всякий случай: MyDotsData[][3]  ', MyDotsData[a][3]);
	};


	//поиск всех рядом стоящих точек:
	AllNearDotsSearch(nn, MyDotsData, myColor, dtl);
	//поиск всех рядом стоящих точек

	//cнимаем "метку"
	for (var i = 0; i < dtl.length; i++) {
		console.log('MyDotsData[dtl[i]][3] == true ?? ', MyDotsData[dtl[i]][3] == true);
		if (MyDotsData[dtl[i]][3] == true) { //проверка, что элемент не 0
			MyDotsData[dtl[i]][3] = 0; //снимаем метку в MyDotsData[nn][3]
			console.log('MyDotsData[dtl[i]][3] не ноль ?? ', MyDotsData[dtl[i]][3] == true);
		};

	};



	console.log("Всего точек в списке dtl: " + dtl.length);
	console.log("Текущая(нажатая) точка nn: " + nn);


	//найдем мин и макс координаты точек:

	var minA = maxA = MyDotsData[nn][0]; // задаем стартовое значение, с чем сравнивать
	var minB = maxB = MyDotsData[nn][1];
	for (var i = 0; i < dtl.length; i++) {
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
	};
	console.log('minA: ' + minA + ' maxA: ' + maxA + ' minB: ' + minB + ' maxB: ' + maxB);
	//найдем мин и макс координаты точек


	//создали отдельную маленькую матрицу с нулями:

	// заполняем новую  матрицу 
	// размер +1px с каждой стороны для алгоритма заливки снаружи  
	var matrixA = maxA - minA + 3; // $scope.matrixA
	var matrixB = maxB - minB + 3; // $scope.matrixB
	for (var a = 0; a < matrixA; a++) {
		matrix[a] = [];
		for (var b = 0; b < matrixB; b++) {
			matrix[a][b] = 0;
		};
	};
	console.log('matrixA, matrixB:', matrixA, matrixB);
	//создали отдельную матрицу с нулями


	//заполним матрицу данными:
	for (var i = 0; i < dtl.length; i++) {
		a = MyDotsData[dtl[i]][0] - minA + 1; // смещаем на 1px
		b = MyDotsData[dtl[i]][1] - minB + 1; // смещаем на 1px
		matrix[a][b] = 8; //точки контура запишем как цифру 8
	};
	//заполним матрицу данными


	//"заливка" снаружи:
	dotsCounter = 0;
	var lineEnd = 0,
		lineStart = matrixB;

	for (var a = 0; a < matrixA; a++) { // проход по матрице
		for (var b = 0; b < matrixB; b++) { // проход по b вниз  и вверх
			// if (matrix[a][b] == 1) { //если 1, 
			// 	dotsCounter++; //счетчик точек +1
			// };

			if (matrix[a][b] == 0) { //если 0, заменяем на 1
				matrix[a][b] = 1;
				dotsCounter++; //счетчик точек +1 
				// console.log(' b: ' + b + ' ' + ' LineStart: ' + lineStart);
				if (b > (lineStart)) {
					// console.log('b > (LineStart) ++!!');

					leftPixelChecker(matrix, a, b); /// !!! TT
				};

			} else if (matrix[a][b] == 8) { //если граница (8)

				lineStart = b; // !!!

				for (var b = matrixB; b >= 0; b--) { //то же только идем снизу-вверх

					// if (matrix[a][b] == 1) { //если 1, 
					// 	dotsCounter++; //счетчик точек +1
					// };
					if (matrix[a][b] == 0) { //если 0, заменяем на 1
						matrix[a][b] = 1;
						dotsCounter++; //счетчик точек +1
						// console.log('lineEnd:  ' + lineEnd + ' b: ' + b);

						if (b < (lineEnd)) {
							// console.log('b < (LineEnd) ++!!');
							leftPixelChecker(matrix, a, b); /// !! ^^
						};
					} else if (matrix[a][b] == 8) { //если граница (8)

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
			if (matrix[a][b] == 8) { //пропуск, идем дальше
				continue
			};

			if ((matrix[a][b] == 1) && (matrix[a - 1][b] == 0)) { //ищем точку слева !зачем?
				matrix[a - 1][b] = 1;
				dotsCounter++; //счетчик точек +1
				verticalChecker(matrix, (a - 1), b);
			};

			if ((matrix[a][b] == 0) && (matrix[a - 1][b] == 1)) { //ищем точку справа 
				matrix[a][b] = 1;
				dotsCounter++; //счетчик точек +1
				verticalChecker(matrix, a, b);
			};



		};

	}; //"заливка" снаружи. конец 'a' цикла.
	//"заливка" снаружи


	// считаем занятую площадь , поиск вражеских точек:
	var sOneSquare = 0;
	var sDots = 0;
	var sOfArea = [];
	var enemyDots = 0;
	sOfArea[0] = [0];
	sOfArea[0][0] = [0];
	sOfArea[0][0][0] = 0;

	for (var a = 1; a < matrixA; a++) { // теперь это квадратики 0,0 = 0-1, 0-1
		sOfArea[a] = [];
		sOfArea[a][0] = [];

		for (var b = 1; b < matrixB; b++) { // начинаем с 1(т.к. смотрим на 1 назад)
			sOfArea[a][b] = [];
			sOfArea[a][b][0] = [];

			if (matrix[a][b] == 0) { // поиск вражескиx точек 
				var abc = minA + a - 1 + (minB + b - 1) * (n - 1);
				if (MyDotsData[abc][2] == 0) {} else if (MyDotsData[abc][2] == myColor) {
					console.log('MY COLOR detected!!! 282  N:', abc);
				} else if (MyDotsData[abc][3] == 10) {} else { // помеченая как захваченая
					enemyDots++;
					console.log('minA, minB, a, b, abc:', minA, minB, a, b, abc);

				};
			};

			if (matrix[a][b] == 0) { // заливаем все внутри(для подсчета площади)
				matrix[a][b] = 8
			};

			// считаем полщадь каждого квадратика
			sDots = matrix[a][b] + matrix[a - 1][b] + matrix[a][b - 1] + matrix[a - 1][b - 1]; // смотрим назад-вверх от точки
			if (sDots == 4 * 8) {
				sOneSquare = 10
			} else if (sDots >= 3 * 8) {
				sOneSquare = 5
			} else {
				sOneSquare = 0
			};
			// запишем в массив
			sOfArea[0][0][0] += sOneSquare;

			sOfArea[a][b][0] = sOneSquare;
		}; //  b цикл посчитали
	}; // a посчитали
	// считаем занятую площадь , поиск вражеских точек


	// проверка на захваченные точки:
	if (enemyDots == 0) { // если нет захваченных точек - выход
		return
	};
	// проверка на захваченные точки


	// // удаляем все наружные точки(хвосты) которые не нужно обводить в контур:
	// for (var a = 1; a < matrixA - 1; a++) {
	// 	for (var b = 1; b < matrixB - 1; b++) {
	// 		sOfArea[a][b][1] = sOfArea[a][b][0] + sOfArea[a + 1][b][0] + sOfArea[a][b + 1][0] + sOfArea[a + 1][b + 1][0];
	// 		if (sOfArea[a][b][1] == 0) {
	// 			matrix[a][b] = 1;
	// 			console.log('обрезали 1 точку-хвост ');
	// 		}
	// 	}
	// };
	// удаляем все наружные точки которые не нужно обводить в контур


	//рекурсия "по наружным точкам": 
	for (var ar = 1; ar < matrixA - 1; ar++) {
		for (var br = 1; br < matrixB - 1; br++) {
			if (matrix[ar][br] == 8) {

				dtl = contoursSearch(matrix, ar, br, minA, minB, myColor);
				ar = matrixA; // выход из цикла
				br = matrixB;

			}

		}
	};

	for (var ar = 1; ar < matrixA - 1; ar++) { //сбрасываем все 9 на 8
		for (var br = 1; br < matrixB - 1; br++) {
			if (matrix[ar][br] == 9) {
				matrix[ar][br] = 8;
			}

		}
	};


	minAndMax(dtl);
	//обводим контур линией, закрашиваем

	console.log('ФИНАЛ dtl : ' + dtl);
	AreaDraw(dtl);



	console.log('Заливка точек, шт: ' + dotsCounter + ' занято точками:' + dtl.length + ' Всего: ' + matrixA * matrixB + ' (' + (matrixA * matrixB - dtl.length - dotsCounter) + ')');
	console.log('Площать занятая точками: ' + sOfArea[0][0][0] / 10 + ' квадратов');
	console.log('Вражеских точек захвачено enemyDots: ' + enemyDots);

	for (var i = 0; i < matrixA; i++) { // выводим матрицу в консоль

		console.log(matrix[i]);
	};

}; // конец. onclick 



function gird(step, x, y, n) { //рисуем сетку
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


function TestDotsFilling() { // расставляем точки (парами) в массиве
	var flag = true;
	for (var i = 0; i < nDoubleSteps * 2; i++) {
		flag ? flag = !flag : flag = !flag; //меняю цвет точки
		var nnn = Math.round(Math.random() * (MyDotsData.length - 1));


		if (MyDotsData[nnn][2] != 0) {
			i--;
			flag = !flag;
			// console.log("YOYOYOYO!!!(количество лишних циклов)");
		} else {
			MyDotsData[nnn][2] = flag + 1;
		};
	};
};


function AllDotsDrawing() { // рисуем тестовый массив 
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


function OneDotDraw(n) { // рисуем точку n (только-что добавленную в массив)

	var c = canvas.getContext('2d');
	c.beginPath();
	// c.moveTo(MyDotsData[n][0] * step + step , MyDotsData[n][1] * step + step);
	c.arc(MyDotsData[n][0] * step + step, MyDotsData[n][1] * step + step, dotRadius, 0, 2 * Math.PI);
	c.fillStyle = dotColor[(MyDotsData[n][2])];
	if (myColorForTests == 3) {
		c.fillStyle = dotColor[myColorForTests];
	};
	c.fill();
	c.closePath();

};


// Меняем цвет точки вручную:
document.getElementById('greenCol').onclick = function(e) { //зеленый
	myColor = 2;
};

document.getElementById('redCol').onclick = function(e) { //красный
	myColor = 1;
};


document.getElementById('cleanArea').onclick = function(e) { //красный
	// area = canvas.getContext('2d');

	if (dtl == undefined) {
		return
	};
	c.clearRect(0, 0, x, y);
	gird(step, x, y, n);

	AllDotsDrawing();

	AreaDraw(dtl);

};



function dotFastCheckup(nn, MyDotsData, myColor) {
	var counter = 0;
	var startA, startB, endA, endB, xx;
	var myLittleStack = [];
	myLittleStack.length = 0;
	// console.log("клеток: " + n);

	startA = startB = -1;
	endA = endB = 1;

	if (MyDotsData[nn][0] == 0) {
		startA = 0;
	};
	if (MyDotsData[nn][1] == 0) {
		startB = 0
	};

	if (MyDotsData[nn][0] == (n - 2)) {
		endA = 0
	};
	if (MyDotsData[nn][1] == (n - 2)) {
		endB = 0
	};


	for (var b = startB; b <= endB; b++) { //находим все точки в зоне "видимости":
		for (var a = startA; a <= endA; a++) {
			xx = (nn + a + b * (n - 1));
			if (xx == nn) { //пропускаем центральную точку
				continue;
			};
			counter++;
			if (MyDotsData[xx] == undefined) { //пропускаем пустую точку
				continue;
			};

			if (MyDotsData[xx][2] == myColor) { //если свой цвет
				myLittleStack.push(xx); //создаем список номеров "своих" точек
			};

		};
	};

	// console.log('точек обработано ' + counter + "; точек добавлено: " + myLittleStack.length);

	var lastDot = myLittleStack.pop(); //предпроверка точки на возможность создания контура:
	var myAa = 0, //если есть две несмежные точки возле проверяемой, то return true
		myBb = 0;
	for (var i = 0; i < myLittleStack.length; i++) { //меряем рассояние каждой точки до остальных
		myAa = Math.abs(MyDotsData[lastDot][0] - MyDotsData[myLittleStack[i]][0]); //по модулю
		myBb = Math.abs(MyDotsData[lastDot][1] - MyDotsData[myLittleStack[i]][1]);
		// console.log("myAa: " + myAa + " myBb: " + myBb);
		if ((myAa == 2) || (myBb == 2)) {
			console.log('dotFastCheckup - return true');

			return true;
		};
	};

	console.log('dotFastCheckup - return false');
	return false;
};



function AllNearDotsSearch(nn, MyDotsData, myColor, dtl) { // ищем контуры
	var startA, startB, endA, endB;
	var xx;


	// console.log("клеток: " + n);

	startA = startB = -1;
	endA = endB = 1;

	//если точка возле границы корректируем 
	//цикл поиска по точкам:
	if (MyDotsData[nn][0] == 0) {
		startA = 0
	};
	if (MyDotsData[nn][1] == 0) {
		startB = 0;
	};

	if (MyDotsData[nn][0] == (n - 2)) {
		endA = 0
	};
	if (MyDotsData[nn][1] == (n - 2)) {
		endB = 0
	};


	if (MyDotsData[nn][3] == 0) { //проверка не помечена ли уже тока
		MyDotsData[nn][3] = myColor //если нет, помечаем точку (своим цветом), пишем в MyDotsData[nn][3]
		console.log('MyDotsData[nn][3] == 0, стал: ', MyDotsData[nn][3]);
	};
	dtl.push(nn); // добавляем точку в список (контур)
	console.log('AllNearDotsSearch dtl: ', dtl);
	myColorForTests = 0; //меняем цвет на желтый =3

	OneDotDraw(nn); //рисуем точку (/желтым)

	for (var b = startB; b <= endB; b++) { //цикл по соседним точкам
		for (var a = startA; a <= endA; a++) {
			xx = (nn + a + b * (n - 1)); //порядковый номер точки
			if (MyDotsData[xx] == undefined) { //пропускаем пустую точку ??
				alert('этого не должно было случитья. строка 580');
				continue;
			};
			if (xx == nn) { //пропускаем центральную точку
				continue;
			};


			if (MyDotsData[xx][3] == 0) { //если точка не помечена "как контураня"
				console.log('точка не помечена как контураня ');

				if (MyDotsData[xx][2] == myColor) { //если свой цвет

					AllNearDotsSearch(xx, MyDotsData, myColor, dtl);
				};
			};

			// if (MyDotsData[xx][2] == myColor) { //если свой цвет
			// 	for (var i = dtl.length - 1; i >= 0; i--) { // если есть в списке dtl, пропускаем
			// 		if (xx == dtl[i]) {
			// 			console.log('+++', xx);
			// 			break;
			// 		}
			// 	};
			// 	console.log('$$$$', xx);
			// 	AllNearDotsSearch(xx, MyDotsData, myColor, dtl);
			// };

		};
	};

};



function verticalChecker(matrix, a, b) {
	var up = b - 1; //вверх на 1
	var down = b + 1; //вниз на 1
	var i = 0;
	if (matrix[a][b] == 1) {
		do {

			if (matrix[a][up] == 0) { //если пусто
				matrix[a][up] = 1;
				dotsCounter++; //счетчик точек +1
				// console.log('verticalChecker up a, b ', a, up);
				// console.log('dotsCounter ', dotsCounter);

				leftPixelChecker(matrix, a, up);
				rightPixelChecker(matrix, a, up);
				up--;
			} else {
				i++
			};

			if (matrix[a][down] == 0) { //если пусто
				matrix[a][down] = 1;
				dotsCounter++; //счетчик точек +1
				// console.log('verticalChecker down. a, b ', a, down);
				// console.log('dotsCounter ', dotsCounter);

				leftPixelChecker(matrix, a, down);
				rightPixelChecker(matrix, a, down);

				down++;
			} else {
				if (i > 0) {
					break;
				}
			};

		} while (1);
	};
};


function leftPixelChecker(matrix, a, b) {

	if (matrix[a - 1] == undefined) {
		return
	};
	if ((matrix[a][b] == 1) && (matrix[a - 1][b] == 0)) { //если пусто
		matrix[a - 1][b] = 1; //нашли точку слева
		dotsCounter++; //счетчик точек +1
		// console.log('leftPixelChecker a, b ', a, b);



		verticalChecker(matrix, (a - 1), b); //проверили вертикаль
	};
	leftPixelChecker(matrix, (a - 1), b); //ищем следующую слева


};

function rightPixelChecker(matrix, a, b) {

	if (matrix[a + 1] == undefined) {
		return
	};
	if ((matrix[a][b] == 1) && (matrix[a + 1][b] == 0)) { //если пусто
		matrix[a + 1][b] = 1; //нашли точку слева
		dotsCounter++; //счетчик точек +1
		// console.log('rightPixelChecker a, b ', a, b);



		verticalChecker(matrix, (a + 1), b); //проверили вертикаль
	};
	rightPixelChecker(matrix, (a + 1), b); //ищем следующую справа


};



function contoursSearch(matrix, a, b, minA, minB, myColor) {
	var startA, startB, endA, endB;
	startA = startB = -1;
	endA = endB = 1;
	var x, y, i = 0;
	var piNa4 = Math.PI / 4;
	var rStart = 4;
	var dtl = [];
	var outPoint;

	var newdtl = [];
	newdtl.length = 0; //для тестов

	outPoint = minA + a - 1 + (minB + b - 1) * (n - 1);
	dtl.push(outPoint);
	matrix[a][b] = 9; //пометили
	console.log('dtl[0]: ', dtl[0]);
	console.log('dtl: ', dtl);

	while (i < 200) {
		i++
		for (var r = 0; r < 8; r++) { //цикл по соседним точкам

			x = Math.round(Math.cos(piNa4 * (r + rStart)) - Math.sin(piNa4 * (r + rStart))); //против часовой
			y = Math.round(Math.sin(piNa4 * (r + rStart)) + Math.cos(piNa4 * (r + rStart)));
			var abc = minA + a + x - 1 + (minB + b + y - 1) * (n - 1); //порядковый номер точки



			if (matrix[a + x][b + y] == 9) { // если вернулись в уже пройденную точку

				for (var j = dtl.length - 1; j >= 0; j--) { // ищем сколько точек назад была эта точка
					if (dtl[j] == abc) { //если нашли

						if ((dtl.length - 1 - j) <= 2) { //точек в контуре  меньше 3х => удалить
							dtl.length = j; // удаляем из массива. 

						} else { //точек в контуре  больше 3х => перенести в новый массив

							if (newdtl[0]) {
								newdtl.push('newArea')
							};
							for (var jj = j; jj <= dtl.length - 1; jj++) { // переписывем от [j до конца]
								newdtl.push(dtl[jj]);



							};


							dtl.length = j; // удаляем из массива. 


						};
					};
				};

				matrix[a + x][b + y] = 8; //снимаем метку + ниже точка добавляется заново в dtl

			}; // if  == 9



			if (matrix[a + x][b + y] == 8) { //нашли "следующую" точку

				matrix[a + x][b + y] = 9; // помечаем

				if (abc == outPoint) { // Вернулись к первой точке. ГОТОВО. Выход!
					matrix[a + x][b + y] = 8;
					console.log('newdtl', newdtl);
					return newdtl;
				};



				//добавили точку в "цепочку", если элемент уже есть в конце то не добавляем
				if (abc == dtl[dtl.length - 1]) {} else {
					dtl.push(abc)
				};



				a = a + x; // сместились на новую координату
				b = b + y;
				rStart = rStart + r - 2;

				console.log('contoursSearch dtl: ', dtl);

				break; // выходим из цикла for, чтобы искать вокруг новой точки

			}; // if  == 8

		}; //END for (var r = 0; r < 8; r++)

	}; //END while

}; // END function contoursSearch(matrix, a, b, minA, minB, myColor)

function AreaDraw(dtl) {
	var x, y;
	

	var area = canvas.getContext('2d');
	area.beginPath();
	for (var i = 0; i < dtl.length; i++) {

		if (dtl[i] == 'newArea') {
			area.closePath();
			
			area.beginPath();
			i++
			x = MyDotsData[dtl[i]][0] * step + step;
			y = MyDotsData[dtl[i]][1] * step + step;
			area.moveTo(x, y);
		};

		x = MyDotsData[dtl[i]][0] * step + step;
		y = MyDotsData[dtl[i]][1] * step + step;



		if (i == 0) {
			area.moveTo(x, y);
		} else {
			area.lineTo(x, y)
		};
	};
	area.lineWidth = 2;
	area.strokeStyle = dotColor[myColor];
	area.fillStyle = "rgba(0, 0, 128, .3)" //заливка
	area.closePath();
	area.stroke(); // обвести линиями
	area.fill(); // закрасить


	//"red"  "rgba(255,0,0,.6)"
	//"green" "rgba(0, 128, 0, .6)"
	// 	c.isPointInPath(x,y) 


};


function minAndMax(dtl) {
	var obj = [];
	var minA = maxA = MyDotsData[dtl[0]][0]; // задаем стартовое значение, с чем сравнивать
	var minB = maxB = MyDotsData[dtl[0]][1];

	console.log('minAndMax dtl: ', dtl);

	//найдем мин и макс координаты точек:
	for (var i = 0; i < dtl.length; i++) {
		if (dtl[i] == 'newArea') {
			obj.push([minA, maxA, minB, maxB]); // запишем занчения n-го контура
			i++;
			minA = maxA = MyDotsData[dtl[i]][0];
			minB = maxB = MyDotsData[dtl[i]][1];

		};



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


	}; // найдем мин и макс координаты точек end.

	obj.push([minA, maxA, minB, maxB]); //запишем значения последнего контура

	console.log(obj); // min и max каждого контура


	// return [minA, maxA, minB, maxB];

};


var onclickSpeed = [];
var refreshSpeed = [];
var watcherSpeed = [];
var serverSpeed = [];
