var controllersModule = angular.module('controllersModule');

// Frame Controller
controllersModule.controller('reportController', ['$scope', 'Auth', '$location', '$http',
    function ($scope, Auth, $location, $http) {

        $scope.report = { time: new Date()};


        function storePosition(position) {
            $scope.report.location = position;
        }

        if (navigator.geolocation) {
            console.log('getting position...');
            navigator.geolocation.getCurrentPosition(storePosition);
        } else{
            console.log("Geolocation is not supported by this browser.");}


        $scope.reportTypes = [
            'Pothole',
            'Traffic Signal Issue',
            'Sewer Backup',
            'Vandalism'
        ];

        $scope.status = {
            isopen: false
        };

        $scope.toggled = function(open) {
            console.log('Dropdown is now: ', open);
        };

        $scope.toggleDropdown = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.status.isopen = !$scope.status.isopen;
        };


        $scope.submit = function(report) {
            console.log('submitting...' + JSON.stringify(report));

            $http.post('/report', report)
                .success(function(data) {

                })
                .error(function(data) {

                });
        };

        $scope.getSimilarReports = function(reportType) {

            var query = {time:$scope.report.time, location:$scope.report.location, reportType:reportType};
            $http.post('/reportQuery', query)
                .success(function(data) {

                });
        }
    }]
);