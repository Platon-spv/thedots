
var nn, n;
var dotsCounter;

var dotColor = ["transparent", "red", "green", "yellow", "white"];
var fillColor = ["transparent", "rgba(255,0,0,.3)", "rgba(0, 128, 0, .3)", "rgba(255,255,128,.3)", "white"];
var myColor = 1;
var enemyColor = 2; // вражеский цвет

var step = x / n; //шаг сетки px
var dotRadius = step / 8;

var canvas = document.getElementById('myCanvas');
var c = canvas.getContext('2d');


var MyDotsData = [];
var dtl = [];
var freeContoursList = [];
var areasList = [];
var blockedDots = [];
var totalOccupiedArea = matrixArray(n - 1, n - 1);
var areas = [];
var enemyDots = [];