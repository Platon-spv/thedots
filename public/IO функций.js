AllNearDotsSearch($scope, nn) -> dtl

minMaxMatrix($scope) <- dtl 
->
$scope.minAndMax
$scope.matrixA
$scope.matrixB
$scope.matrix


fillFromOutside($scope) <-	$scope.matrixA
							$scope.matrixB
							$scope.matrix


							leftPixelChecker($scope, a, b)
							rightPixelChecker($scope, a, b)
							verticalChecker($scope, a, b)

-> $scope.matrix


findEnemyfindFreeDots($scope) <- 	$scope.minAndMax
									$scope.matrixA
									$scope.matrixB
									$scope.matrix

-> 
$scope.freeDots
$scope.myDots

freeContoursList

//скопировать все массивы:
var temPdtl = dtl.slice();
$scope.temPminAndMax = $scope.minAndMax.slice();  
$scope.temPmatrixA = $scope.matrixA.slice();  
$scope.temPmatrixB = $scope.matrixB.slice(); 
$scope.temPmatrix = $scope.matrix.slice(); 


// прогнать по функциям ->  результат

minMaxMatrix($scope);
fillFromOutside($scope);
findEnemyfindFreeDots($scope);

if(enemyDots.lenght=0) {

} ;

// записать обратно всё в массивы:
$scope.minAndMax = $scope.temPminAndMax.concat();
$scope.matrixA = $scope.temPmatrixA.concat();
$scope.matrixB = $scope.temPmatrixB.concat();
$scope.matrix = $scope.temPmatrix.concat();

