'use strict';

/* App Module */

var civConnect = angular.module('civConnect', ['controllersModule', 'ngRoute']);

civConnect.config(['$routeProvider', '$httpProvider',
    function($routeProvider, $httpProvider) {
        $routeProvider.
            /*when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'loginController'
            }).*/
            otherwise({
                templateUrl: 'partials/login.html',
                controller: 'loginController'
            });

        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    }]);