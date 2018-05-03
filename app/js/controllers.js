'use strict';


var images = {
    People : [
        "44.jpg",
        "Coffee.jpg",
        "IMG_7770.jpg",
        "IMG_7771.jpg",
        "IMG_9065.jpg",
        "IMG_E9052.jpg",
        "as Madonna.jpg"
    ],
    Places : [
        "20170905_Hopscotch_Coffee.jpg",
        "20171030_Crazy_Horse.jpg",
        "20171113_Ink_Well.jpg",
        "20171117_Restaurant_Ami.jpg",
        "20171206_Taste_of_India.jpg",
        "20171208_Butchers_Block.jpg",
        "20180122_Runcible_Spoon.jpg",
        "20180124_Domo.jpg",
        "20180126_Scenic_View.jpg",
        "20180129_Sofra_Cafe.jpg",
        "20180131_Dats.jpg",
        "20180181_Totos_Uncle_Cafe.jpg",
        "20180202_Butchs.jpg",
        "20180209_Bloomington_Bagel_East.jpg",
        "20180212_Village_Deli.jpg",
        "20180223_Stefanos_Ice_Cafe.jpg",
        "DSC01160.JPG",
        "beach rocks.jpg",
        "hills.jpg",
        "house 21jun2017.jpg",
        "mistyforest6jun2017.jpg",
        "oliver winery.jpg",
        "tide pools.jpg"
    ],
    Things: [
        "Carmel_Drizzel.jpg",
        "Cherry_Frosting.jpg",
        "Choco_Choco_Sprink.jpg",
        "Choco_Drizzel.jpg",
        "Choco_Raspberry.jpg",
        "Choco_shperes.jpg",
        "Choco_strawberry.jpg",
        "Ganache.jpg",
        "Hershey.jpg",
        "IMG_7828.jpg",
        "Lemon.jpg",
        "Maple_Bacon.jpg",
        "cat3jun2017.jpg",
        "diamond_heart.jpg",
        "diamond_pentagon.jpg",
        "flower29jun2017.jpg",
        "flower30jun2017.jpg",
        "grapefruit.jpg",
        "horn mellon.jpg",
        "koi.jpg",
        "moving.jpg",
        "other.jpg",
        "pom.jpg",
        "poppies.jpg",
        "poppy14jun2017.jpg",
        "poppy15jun2017.jpg",
        "poppy16jun2017.jpg",
        "poppy17jun2017.jpg",
        "poppy18jun2017.jpg",
        "poppy19jun2017.jpg",
        "tulips.jpg",
        "uptrees2jun2017.jpg",
        "yolks.jpg"
    ],
    Restaurants : [
        "20170905_Hopscotch_Coffee.jpg",
        "20171030_Crazy_Horse.jpg",
        "20171113_Ink_Well.jpg",
        "20171117_Restaurant_Ami.jpg",
        "20171206_Taste_of_India.jpg",
        "20171208_Butchers_Block.jpg",
        "20180122_Runcible_Spoon.jpg",
        "20180124_Domo.jpg",
        "20180126_Scenic_View.jpg",
        "20180129_Sofra_Cafe.jpg",
        "20180131_Dats.jpg",
        "20180181_Totos_Uncle_Cafe.jpg",
        "20180202_Butchs.jpg",
        "20180209_Bloomington_Bagel_East.jpg",
        "20180212_Village_Deli.jpg",
        "20180223_Stefanos_Ice_Cafe.jpg"
    ],
    Cupcakes : [
        "Carmel_Drizzel.jpg",
        "Cherry_Frosting.jpg",
        "Choco_Choco_Sprink.jpg",
        "Choco_Drizzel.jpg",
        "Choco_Raspberry.jpg",
        "Choco_shperes.jpg",
        "Choco_strawberry.jpg",
        "Ganache.jpg",
        "Hershey.jpg",
        "Lemon.jpg",
        "Maple_Bacon.jpg"
    ],
    Gems : [
        "diamond_heart.jpg",
        "diamond_pentagon.jpg"
    ],
    Flowers : [
        "flower29jun2017.jpg",
        "flower30jun2017.jpg",
        "poppies.jpg",
        "poppy14jun2017.jpg",
        "poppy15jun2017.jpg",
        "poppy16jun2017.jpg",
        "poppy17jun2017.jpg",
        "poppy18jun2017.jpg",
        "poppy19jun2017.jpg",
        "tulips.jpg"
    ]
};

myapp.controller('GalleryController', function ($scope, $http) {

    $scope.images = {};

    $scope.categories = ['People','Places','Things'];

    $scope.categories.forEach(function(c){
        $http({
            method: "GET",
            url: "/sample/"+c
        }).then(function (res) {
            console.log(res);
            $scope.images[c] = res.data;
        }, function (err) {
            console.dir(err);
        });
    });
});

myapp.controller('SingleController', function ($scope, $routeParams, $http, $filter, $modal, $timeout, $location, $cookies, appconf, toaster) {
    $scope.images = {};
    $scope.title=$routeParams.topic;
    $http({
        method: "GET",
        url: "/images/"+$routeParams.topic
    }).then(function (res) {
        $scope.images = res.data;
    }, function (err) {
        console.dir(err);
    });
});

myapp.controller('AboutController', function ($scope, $routeParams, $http, $filter, $modal, $timeout, $location, $cookies, appconf, toaster) {

});

myapp.controller('SigninController', function ($scope, $http, $location, toaster, appconf, AuthService) {

    $scope.login = function() {
        if ($scope.username == "") {
            toaster.pop('error', 'Invalid or empty username', "Please enter a valid email");
        } else {
            AuthService.login($scope.username, $scope.password, function (res) {
                if (res) {
                    var redirect = sessionStorage.getItem('auth_redirect');
                    if (redirect == "" || redirect == undefined) redirect = appconf.auth_redirect_url;
                    // toaster.pop('success', 'Redirect', "Redirecting to " + redirect);
                    AuthService.getRoles(function(res) {
                        // toaster.pop('success', 'Roles', res);
                        $location.path(redirect);
                    });
                } else {
                    toaster.pop('error', 'Login Failed', "Check username/password");
                }
            });
        }
    };
});

myapp.controller('AdminController', function ($scope, $http, $location, $modal, toaster, appconf, AuthService) {

    $scope.images = [];
    $scope.isEditing = false;

    $scope.categories = ['People','Places','Things','Uncategorized'];

    $scope.updateImg = function(img) {
        console.log(img);
        $http({
            method: "POST",
            url: "/update",
            data: {image: img}
        }).then(function (res) {
            console.log(res);
        }, function (err) {
            console.dir(err);
        });
    };

    $scope.getImages = function() {
        $http({
            method: "GET",
            url: "/imagelist",
            params: { 'foobar': new Date().getTime() }
        }).then(function (res) {
            $scope.images = res.data;
        }, function (err) {
            console.dir(err);
        });
    };


    $scope.getImages();
});

myapp.controller('UploadController', function ($scope, $http, FileUploader, toaster, appconf, AuthService) {
    $scope.title = "upload";
    $scope.uploader = undefined;

    $scope.renderupload = false;


        var uploader = $scope.uploader = new FileUploader({
            url: 'upload'
        });

        // FILTERS

        uploader.filters.push({
            name: 'syncFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                console.log('syncFilter');
                return this.queue.length < 10;
            }
        });

        // an async filter
        uploader.filters.push({
            name: 'asyncFilter',
            fn: function(item /*{File|FileLikeObject}*/, options, deferred) {
                console.log('asyncFilter');
                setTimeout(deferred.resolve, 1e3);
            }
        });

        // CALLBACKS

        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
            toaster.pop('error','Invalid Filetype','Please add a valid FITS or .fz compressed file')
        };
        uploader.onAfterAddingFile = function(fileItem) {
            console.info('onAfterAddingFile', fileItem);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function(item) {
            console.info('onBeforeUploadItem', item);
        };
        uploader.onProgressItem = function(fileItem, progress) {
            console.info('onProgressItem', fileItem, progress);
        };
        uploader.onProgressAll = function(progress) {
            console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            console.info('onSuccessItem', fileItem, response, status, headers);
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
        };
        uploader.onCancelItem = function(fileItem, response, status, headers) {
            console.info('onCancelItem', fileItem, response, status, headers);
        };
        uploader.onCompleteItem = function(fileItem, response, status, headers) {
            console.info('onCompleteItem', fileItem, response, status, headers);
            $scope.rows = response.data;
        };
        uploader.onCompleteAll = function() {
            console.info('onCompleteAll');
        };

        $scope.renderupload = true;



});
