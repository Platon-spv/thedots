// angular.module('myApp', []);



var myApp = angular.module('myApp', []);



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

var phones = [{
    "name": 'Nokia Lumia 630',
    year: 2014,
    price: 200,
    company: {
        name: 'Nokia',
        country: 'Финляндия'
    }
}, {
    name: 'Samsung Galaxy S 4',
    year: 2014,
    price: 400,
    company: {
        name: 'Samsung',
        country: 'Республика Корея'
    }
}, {
    name: 'Mi 5',
    year: 2015,
    price: 300,
    company: {
        name: 'Xiaomi',
        country: 'Китай'
    }
}];


myApp.controller('phoneController', function($scope, socket) {


    var x = angular.toJson(phones);
    socket.emit('myData', x);

    socket.on('myData', function(msgData) {
        $scope.yy = angular.fromJson(msgData);

    });

    // $scope.yy = phones;


  



    $('form').submit(function() {
        var tojs = angular.toJson($('#m').val());
        socket.emit('chat message', tojs);
        $('#m').val('');
        return false;
    });
    socket.on('chat message', function(msg) {
        var fromjs = angular.fromJson(msg);
        $('#messages').append($('<li>').text(fromjs));

    });

});

myApp.controller('phoneController2', function($scope, socket) {
    var phonesTest = ['1blalba', 2, "fedf", 'fdffd'];

    socket.emit('chat message', angular.toJson(phonesTest));

    socket.on('chat message', function(msgData) {
        $scope.test = angular.fromJson(msgData);

    });


    // $scope.test = phonesTest;


});