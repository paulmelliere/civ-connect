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

                    $location.path('/home');
                })
                .error(function(data) {
                    $location.path('/home');
                });
        };

        $scope.vote = function(slide) {
            $http.post('/vote', slide)
                .success(function(data) {
                    $location.path('/home');
                })
                .error(function(data) {
                    $location.path('home');
                })
        };

        $scope.getSimilarReports = function(reportType) {

            var query = {time:$scope.report.time, location:$scope.report.location, reportType:reportType};
            $http.post('/reportQuery', query)
                .success(function(data) {
                    var reports = data;
                    $scope.slides = reports.slice(0);
                })
                .error(function(data) {
                    console.log('error querying for similar reports');
                    $scope.slides = [];

                    // Demo
                    $scope.genSlides(5);
                });


        }

        $scope.updatedReportType = function() {
            $scope.getSimilarReports($scope.report.reportType);
        }


        $scope.genSlides = function(num) {
            for (var i = 0; i < num; i++) {
                var d = new Date();

                $scope.slides.push({
                   image: 'http://lorempixel.com//400/200/',
                   votes: i,
                   comment: 'Slide ' + i,
                   time: d.toDateString()
                });
            }
        }









        $scope.hasSimilarReports = function() {
            return $scope.slides.length > 0;
        }


        $scope.myInterval = -1;
        var slides = $scope.slides = [];

       /* slides = [
            {votes:13, time:new Date(), description:'pothole'},
            {votes:6, time:new Date(), description:'pothole in road'},
            {votes:3, time:new Date(), description:'this broke my car'},
        ]*/
        /*$scope.addSlideNew = function(report) {
            slides.push({
                image: 'http://lorempixel.com//400/200/',
                comment:report.comment,
                votes:report.votes
            });
        }*/
        //$scope.genSlides(3);
        /*$scope.addSlide = function() {
            var newWidth = 600 + slides.length;
            slides.push({
                //image: 'http://placekitten.com/' + newWidth + '/300',
                image: 'http://lorempixel.com//400/200/',
                text: ['More','Extra','Lots of','Surplus'][slides.length % 4] + ' ' +
                    ['Cats', 'Kittys', 'Felines', 'Cutes'][slides.length % 4]
            });
        };
        for (var i=0; i<4; i++) {
            $scope.addSlide();
        }*/
    }]
);