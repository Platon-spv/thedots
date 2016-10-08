function someContourDotsFinderReverse(a, b) {
	// ищем точки перехода с контура на контур, пока не дойдем до контура с которого начали

	//for (var n = 1; n < abList.length; n++) { // корректируем контур areas[i], орентируясь на abList 

	//	if (abList[n][4] === null) {

	// startPoint, endPoint  - nn (общий номер напр. nn:89)
	// changeFrom, n         - n (номер по порядку в массиве areas[i])
	// []                    - список точек nn для замены или null(если есть вражеские точки)

	var aa, bb;
	var anotherContour = [];
	var nativeContour = [];

	for (var n = 0; n < abList.length; n++) {
		aa = listOfContoursNumberByNN[abList[n][0]];
		bb = listOfContoursNumberByNN[abList[n][1]];
		if (aa != bb) { // перешли на др контур (номера контуров не совпадают)
			anotherContour.push([n, bb]); //записали n в abList, номер контура на котороый перешли
		}

	};

	n = anotherContour[0][0];
	nativeContour = listOfContoursNumberByNN[abList[n][0]];

	for (var i = 0; i < anotherContour.length; i++) {
		if (nativeContour == anotherContour[i][0]) {
			console.log('bingo! nativeContour == anotherContour[i]');


		};
	};

};