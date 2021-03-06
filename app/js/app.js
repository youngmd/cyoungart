/**
 * Created by youngmd on 8/11/17.
 */

var myapp = angular.module('myapp', [
    'app.config',
    'ngRoute',
    'ngAnimate',
    'ngCookies',
    'toaster',
    'angular-loading-bar',
    'angularFileUpload',
    'angular-jwt',
    'ui.bootstrap',
    'ui.gravatar',
    'ui.select',
    'gg.editableText',
    '720kb.socialshare',
    'ngMap'
]);


myapp.service('CartService', function($rootScope) {

    this.cart = {};

    this.change = false;

    this.addItem = function(item, model, price, quantity) {
        var id = item._id+'__'+model;
        var entry = {
            item: item,
            title: item.title,
            model: model,
            price: price,
            quantity: quantity
        }
        this.cart[id] = entry;
        $rootScope.$emit('cartChange');
        return this.cart;
    };

    this.dropItem = function(_id) {
        delete this.cart._id;
        $rootScope.$emit('cartChange');
        return this.cart;
    };

    this.modifyQuantity = function(_id, quantity) {
        this.cart._id.quantity = quantity;
        $rootScope.$emit('cartChange');
        return this.cart;
    };

    this.emptyCart = function() {
        this.cart = {};
        $rootScope.$emit('cartChange');
        return this.cart;
    };

    this.count = function() {
        console.log(Object.keys(this.cart).length);
        return Object.keys(this.cart).length;
    }

    return this;
});

myapp.factory('AuthService', function(appconf, $http) {

    let user = JSON.parse(localStorage.getItem(appconf.user));
    let authToken = JSON.parse(localStorage.getItem(appconf.auth_token));

    return {
        user: function() { return user; },
        token: function() { return authToken},
        login: function(username, password, cb) {
            localStorage.removeItem(appconf.user);
            localStorage.removeItem(appconf.auth_token);
            $http({
                method: "POST",
                url: "/users/login",
                data: {"username": username, "password": password}
            }).
            then(function(res) {
                authToken = res.data;
                authToken.created = new Date(authToken.created);
                authToken['expiration'] = authToken.created + authToken.ttl;
                localStorage.setItem(appconf.auth_token, JSON.stringify(authToken));
                localStorage.setItem(appconf.user, JSON.stringify(username));
                cb(true);
            }, function(err) {
                console.dir(err);
                cb(false);
            });
        },
        logout: function(cb) {
            $http({
                method: "POST",
                url: appconf.api_url+"/users/logout?access_token="+authToken.id
            }).then(function(res) {
                localStorage.removeItem(appconf.user);
                localStorage.removeItem(appconf.auth_token);
                user = undefined;
                authToken = undefined;
                cb(true);
            }, function(err) {
                console.dir(err);
                cb(false);
            });
        },
        getRoles: function(cb) {
            $http({
                method: "GET",
                url: appconf.api_url+"/users/"+user.id+"/getRolesById?&access_token="+authToken.id
            }).then(function(res) {
                var roles = res.data.payload.roles;
                user["roles"] = roles;
                localStorage.setItem(appconf.user, JSON.stringify(user));
                cb(roles);
            }, function(err) {
                console.dir(err);
                cb(false);
            });
        },
        isLoggedIn: function() { return (user.username != '');},
        checkToken: function() { return (authToken.id != '');}
    };
});

myapp.filter('bytes', function() {
    return function(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
            number = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
    }
});

myapp.filter('limitObjectTo', function() {
    return function(obj, limit) {
        var newObj = {}, i = 0, p;
        for (p in obj) {
            newObj[p] = obj[p];
            if (++i === limit) break;
        }
        return newObj;
    };
});

myapp.directive('cartCount', function(CartService, $rootScope) {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        link: function(scope) {
            scope.cart = CartService.count();
            $rootScope.$on("cartChange", function(){
                console.log('got cart change');
                console.log(CartService.cart);
                scope.cart = CartService.count();
            });
        },
        template:
        "<span>" +
        "({{cart}})" +
        "</span>"
    };
});

myapp.directive('modalDialog', function() {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        link: function(scope) {
                scope.cancel = function() {
                scope.$dismiss('cancel');
            };
        },
        template:
        "<div>" +
        "<div class='modal-header'>" +
        "<button type='button' class='close' data-dismiss='cancel' ng-click='cancel()' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"+
        "<h3 class='modal-title' ng-bind-html='dialogTitle'></h3>" +
        "</div>" +
        "<div class='modal-body' ng-transclude></div>" +
        "</div>"
    };
});


//configure route
myapp.config(['$routeProvider', 'appconf', function($routeProvider, appconf) {
    $routeProvider.
    when('/gallery', {
            templateUrl: 't/gallery.html',
            controller: 'GalleryController',
            controllerAs: 'ctrl'
        })
        .when('/single/:topic', {
            templateUrl: 't/single.html',
            controller: 'SingleController',
            controllerAs: 'ctrl'
        })
        .when('/search', {
            templateUrl: 't/search.html',
            controller: 'SearchController',
            controllerAs: 'ctrl'
        })
        .when('/confirmation', {
            templateUrl: 't/confirmation.html',
            controller: 'ConfirmationController',
            controllerAs: 'ctrl'
        })
        .when('/detail/:id', {
            templateUrl: 't/detail.html',
            controller: 'DetailController',
            controllerAs: 'ctrl'
        })
        .when('/detailtest/:id', {
            templateUrl: 't/detail_test.html',
            controller: 'DetailController',
            controllerAs: 'ctrl'
        })
        .when('/about', {
            templateUrl: 't/about.html',
            controller: 'AboutController'
        })
        .when('/signin', {
            templateUrl: 't/signin.html',
            controller: 'SigninController'
        })
        .when('/upload', {
            templateUrl: 't/upload.html',
            controller: 'UploadController',
            requiresLogin: true
        })
        .when('/admin', {
            templateUrl: 't/admin.html',
            controller: 'AdminController',
            requiresLogin: true
        })
        .when('/checkout', {
            templateUrl: 't/checkout.html',
            controller: 'CheckoutController',
        })
        .otherwise({
            redirectTo: '/gallery'
        });
}]).run(['$rootScope', '$location', 'toaster', 'jwtHelper', 'appconf', 'AuthService', 'CartService', function($rootScope, $location, toaster, jwtHelper, appconf, AuthService, CartService) {
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        $rootScope.title = 'CYoung Art';
        //redirect to /signin if user hasn't authenticated yet
        if(next.requiresLogin) {
            var authToken = AuthService.token();
            var today = new Date();
            if(authToken == null || (authToken.expiration > today )) {
                toaster.warning("Please sign in first");
                sessionStorage.setItem('auth_redirect', next.originalPath);
                $location.path("/signin");
                event.preventDefault();
                return;
            }

            if(next.requiresAdmin) {
                var user = AuthService.user();
                if(user.roles == undefined || user.roles.indexOf('admin') == -1) {
                    toaster.warning("You are not authorized to access that location");
                    event.preventDefault();
                }
            }
        }

    });
}]);

