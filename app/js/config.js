'use strict';

//this is checked in to git as default
//nothing sensitive should go here (since it will be published via web server anyway)
//contrib

angular.module('app.config', [])
.constant('appconf', {

    auth_token: 'auth_token',
    auth_redirect_url: 'admin',
    user: 'user'

    });


