var controllersModule = angular.module('controllersModule');

// Frame Controller
controllersModule.controller('areaController', ['$scope', 'Auth', '$location', '$http',
    function ($scope, Auth, $location, $http) {

        $scope.map = {
            center: {
                latitude: 45,
                longitude: -73
            },
            zoom: 16
        };

        function setPosition(position) {
            console.log('got position' + JSON.stringify(position));
            $scope.map = {
                center: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                },
                zoom: 16
            }
            $scope.map.refresh();
        }

        if (navigator.geolocation) {
            console.log('getting position...');
            navigator.geolocation.getCurrentPosition(setPosition);
        } else{
            console.log("Geolocation is not supported by this browser.");}



        }]
        );