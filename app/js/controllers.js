'use strict';


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


myapp.controller('ConfirmationController', function ($scope, $http) {
    
});

myapp.controller('SingleController', function ($scope, $routeParams, $http, $filter, $modal, $timeout, $location, $cookies, appconf, toaster) {
    $scope.images = {};

    $scope.limit = 10;
    $scope.currentPage = 1;
    $scope.totalItems = 1;
    $scope.numPages = 1;
    $scope.maxSize = 5;

    $scope.getImages = function() {
        $http({
            method: "GET",
            url: "/images/"+$routeParams.topic+"/"+$scope.limit+"/"+$scope.currentPage
        }).then(function (res) {
            $scope.images = res.data.docs;
            $scope.totalItems = res.data.total;
            console.log(res.data);
        }, function (err) {
            console.dir(err);
        });
    };
    $scope.title=$routeParams.topic;

    $scope.getImages();

    $scope.openDetail = function(_id) {
        console.log(_id);
        $location.path('/detail/'+_id);
    }
});

myapp.controller('SearchController', function ($scope, $routeParams, $http, $filter, $modal, $timeout, $location, $cookies, appconf, toaster) {
    $scope.images = {};

    $scope.limit = 10;
    $scope.currentPage = 1;
    $scope.totalItems = 1;
    $scope.numPages = 1;
    $scope.maxSize = 5;
    $scope.search = {
        text: ""
    };

    $scope.doSearch = function() {
        $http({
            method: "GET",
            url: "/imgsearch/"+$scope.search.text+"/"+$scope.limit+"/"+$scope.currentPage
        }).then(function (res) {
            $scope.images = res.data.docs;
            $scope.totalItems = res.data.total;
            console.log(res.data);
        }, function (err) {
            console.dir(err);
        });
    };
    

    $scope.openDetail = function(_id) {
        console.log(_id);
        $location.path('/detail/'+_id);
    }
});

myapp.controller('CheckoutController', function($scope, toaster, CartService, $http, $window, $sce){

    $scope.pageStatus = 'cart';
    $scope.models = {
        postcard: { title: "Postcard", dim: '6" x 4"'},
        small_print: { title: "Fine Art Print", dim: '8.5" x 5.5"'},
        large_print: { title: "Fine Art Print", dim: '17" x 11"'}
    };

    $scope.shipping_options = [
        {name: 'Local Pickup', cost: 0},
        {name: 'Standard', cost: 6.95},
        {name: 'Expedited', cost: 12.95}
    ];

    $scope.shipping = $scope.shipping_options[1];

    $scope.cart = CartService.cart;

    $scope.calcTotal = function() {
        $scope.total = $scope.shipping.cost;
        angular.forEach($scope.cart, function(sc){
            if(sc.quantity > 0){
                $scope.total += sc.quantity * sc.price;
            }
        });
    }
    $scope.adjust = function(item, val) {
        item.quantity = Math.max(0, item.quantity + val);
        $scope.calcTotal();
    };

    $scope.empty = function() {
        $scope.cart = CartService.emptyCart();
    };

    $scope.total = 0;
    $scope.calcTotal();

    $scope.checkout = function() {
        var line_items = [];
        angular.forEach($scope.cart, function(v, k){
            line_items.push({
                name: v.title + ' - ' + v.model,
                quantity: v.quantity.toString(),
                base_price_money: {amount: v.price*100, currency: 'USD'}
            });
        });
        line_items.push({
            name: "Shipping & Handling - " + $scope.shipping.name,
            quantity: "1",
            base_price_money: { amount: parseInt($scope.shipping.cost * 100), currency: 'USD'}
        });
        $http({
            method: "POST",
            url: '/checkout',
            data: {
                line_items: line_items,
                redirect_url: "https://cyoung.art/#/confirmation"
            }
        }).then(function (res) {
            console.log(res.data);
            $window.location.href = res.data.checkout_page_url;
        }, function (err) {
            console.dir(err);
        });
    }
});

myapp.controller('DetailController', function ($scope, $routeParams, $location, $http, $sce, $window, $modal, toaster, NgMap, CartService) {

    var url = "/image/"+$routeParams.id;
    $scope.absurl = $location.absUrl();

    $scope.shareServices = [
        {service: 'twitter', icon: 'fa-twitter'},
        {service: 'facebook', icon: 'fa-facebook-square'},
        {service: 'pinterest', icon: 'fa-pinterest-p'},
    ];

    $scope.center = "";

    console.log(url);
    $scope.getImage = function() {
        $http({
            method: "GET",
            url: "/image/"+$routeParams.id
        }).then(function (res) {
            $scope.img = res.data[0];
            console.log(res.data);
            if($scope.img.location !== undefined ){
                var address = $scope.img.location.split(' ').join('+');
                var url = "https://maps.googleapis.com/maps/api/geocode/json?address="+address+"&key=AIzaSyAnKZVfnutb-hf2w8BWQsBigAnBjY8O7cA";
                $http({
                    url: url,
                    method: "GET"
                }).then(function (res) {
                    console.log(res);
                    var viewport = res.data.results[0].geometry.viewport;
                    var latdiff = Math.abs(res.data.results[0].geometry.location.lat - viewport.southwest.lat) * 0.647;
                    $scope.center = res.data.results[0].geometry.location.lat + ", " + res.data.results[0].geometry.location.lng;
                    NgMap.getMap().then(function(map) {
                        var swBound = new google.maps.LatLng(res.data.results[0].geometry.location.lat - latdiff, viewport.southwest.lng);
                        var neBound = new google.maps.LatLng(res.data.results[0].geometry.location.lat + latdiff, viewport.northeast.lng);
                        var bounds = new google.maps.LatLngBounds(swBound, neBound);
                        var srcImage = "public/images/"+$scope.img.path+"?dim=1024x1024";
                        new USGSOverlay(bounds, srcImage, map);
                    });
                }, function (err) {
                    console.log(err)
                });
            };
        }, function (err) {
            console.dir(err);
        });
    };
    $scope.getImage();

    $scope.goBack = function() {
        $window.history.back();
    };

    $scope.buyOriginal = function() {
        var img = $scope.img;
        $modal.open({
            templateUrl: 't/origmodal.html', // loads the template
            backdrop: true, // setting backdrop allows us to close the modal window on clicking outside the modal window
            windowClass: 'modal', // windowClass - additional CSS class(es) to be added to a modal window template
            controller: function ($scope, $modalInstance, CartService) {
                $scope.img = img;
                $scope.dialogTitle = $sce.trustAsHtml("Original Art Purchase Request");
                $scope.ok = function () {
                    toaster.success("Thank you!  Your request has been sent.");
                    $modalInstance.dismiss('ok');
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                }
            },
            resolve: {}
        }).result.catch(function(res) {
            console.log(res);
            if (!(res === 'cancel' || res === 'escape key press' || res === 'ok')) {
                throw res;
            }
        });//end of modal.open
    };

    $scope.buy = function() {
        var img = $scope.img;
        $modal.open({
            templateUrl: 't/cartmodal.html', // loads the template
            backdrop: true, // setting backdrop allows us to close the modal window on clicking outside the modal window
            windowClass: 'modal', // windowClass - additional CSS class(es) to be added to a modal window template
            controller: function ($scope, $modalInstance, $location, CartService) {
                $scope.img = img;
                console.log(img);
                $scope.dialogTitle = $sce.trustAsHtml("<i class='fa fa-fw fa-cart-plus'></i> Add to Cart");
                $scope.quantity = {
                    postcard: 0,
                    small_print: 0,
                    large_print: 0
                };
                $scope.adjust = function(key, val) {
                    $scope.total = 0;
                    $scope.quantity[key] = Math.max(0, $scope.quantity[key] + val);
                    angular.forEach($scope.quantity, function(v,k){
                        if(v > 0){
                            $scope.total += img.inventory[k] * v;
                        }
                    });
                };

                $scope.total = 0;
                $scope.checkout = function() {
                    CartService.change = true;
                    console.log(CartService.cart);
                    angular.forEach($scope.quantity, function(v,k){
                        console.log(k);
                        console.log(v);
                        if(v > 0){
                            CartService.addItem(img, k, img.inventory[k], v);
                        }
                    });
                    toaster.success("Added to cart");
                    $modalInstance.dismiss('ok');
                    $location.path('checkout');

                }
                $scope.ok = function () {
                    CartService.change = true;
                    console.log(CartService.cart);
                    angular.forEach($scope.quantity, function(v,k){
                        console.log(k);
                        console.log(v);
                        if(v > 0){
                            CartService.addItem(img, k, img.inventory[k], v);
                        }
                    });
                    toaster.success("Added to cart");
                    $modalInstance.dismiss('ok');
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                }
            },
            resolve: {}
        }).result.catch(function(res) {
            console.log(res);
            if (!(res === 'cancel' || res === 'escape key press' || res === 'ok')) {
                throw res;
            }
        });//end of modal.open
    };

    // $scope.buy = function() {
    //     CartService.change = true;
    //     console.log(CartService.cart);
    //     CartService.addItem($scope.img, 1);
    //     toaster.success("Added to cart");
    // };
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
                    toaster.pop('success', 'Redirect', "Redirecting to " + redirect);
                    $location.path(redirect);
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

    $scope.limit = 10;
    $scope.currentPage = 1;
    $scope.totalItems = 1;
    $scope.numPages = 1;
    $scope.maxSize = 5;

    $scope.categories = ['People','Places','Things','Uncategorized'];

    $scope.updateImg = function(idx, field, value) {
        console.log(value);
        console.log($scope.images[idx])
        var img = angular.copy($scope.images[idx]);
        img[field] = value;
        console.log($scope.images[idx]);
        console.log(img);
        $http({
            method: "POST",
            url: "/update",
            data: {image: img}
        }).then(function (res) {
            console.log("SUCCESS");
            console.log(res);
        }, function (err) {
            console.dir(err);
        });
    };

    $scope.deleteImg = function(img, idx) {
        console.log(img);
        $http({
            method: "DELETE",
            url: "/image/"+img._id
        }).then(function (res) {
            toaster.success('Image Removed');
            $scope.images.splice(idx, 1);
            console.log(res);
        }, function (err) {
            toaster.error('Failed to remove image');
            console.dir(err);
        });
    };

    $scope.getImages = function() {
        $http({
            method: "GET",
            url: "/imagelist/"+$scope.limit+"/"+$scope.currentPage,
            params: { 'foobar': new Date().getTime() }
        }).then(function (res) {
            $scope.images = res.data.docs;
            $scope.totalItems = res.data.total;
            console.log(res.data);
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
