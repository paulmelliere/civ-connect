var controllersModule = angular.module('controllersModule');

// Frame Controller
controllersModule.controller('areaController', ['$scope', 'Auth', '$location', '$http',
    function ($scope, Auth, $location, $http) {

       $scope.mapRefresh = false;
       $scope.yourLocation = {};
       $scope.reports = {};
        //latitude: 39.848829699999996,
            //longitude: -86.14148809999999
        //$scope.map = {};
        $scope.map = {
            center: {
                latitude: 3,
                longitude: -8
            },
            zoom: 16,
            control: {}
        };

        function setPosition(position) {
            console.log('got position' + JSON.stringify(position));
            /*$scope.map.
                center = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }
*/
             // zoom: 16
            //}
            //$scope.map.mapRefresh = true;
            $scope.yourLocation = position.coords;
            $scope.map.control.refresh({latitude: position.coords.latitude, longitude: position.coords.longitude});

        }

        if (navigator.geolocation) {
            console.log('getting position...');
            navigator.geolocation.getCurrentPosition(setPosition);
        } else{
            console.log("Geolocation is not supported by this browser.");}



        }]
        );

        $http.get('/reports')
.success(function(data) {
$scope.reports = data;
            });