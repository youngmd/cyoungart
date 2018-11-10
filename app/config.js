/**
 * Created by youngmd on 8/17/17.
 */
var winston = require('winston');
var fs = require('fs');

exports.auth = {
    //default user object when registered
    admin_user: 'cyoung',
    admin_pass: 'cc03e747a6afbbcbf8be7668acfebee5',
    secret: 'd234lkdfjngj5sv@##$sdf22!!kkkd4',
    ttl: 86400,
    iss: 'cyoung.art'


    //allow_signup: false, //prevent user from signing in (set false if not using local auth)
};

exports.square = {
    token: "sq0atp-DiTk2ShE9OQWh_RunlqMiw",
    test_token: "sandbox-sq0atb-_Ztm4N9IzweSbBuqQNxHiw",
    location: "SN51S9H7M881Q",
    test_location: "CBASEM8b5JmPdQVbh2ghcK_puPMgAQ"
};

exports.logger = {
    winston: {
        //hide headers which may contain jwt
        requestWhitelist: ['url', /*'headers',*/ 'method', 'httpVersion', 'originalUrl', 'query'],
        transports: [
            //display all logs to console
            new winston.transports.Console({
                timestamp: function() {
                    var d = new Date();
                    return d.toString(); //show timestamp
                },
                level: 'info',
                colorize: true
            }),
        ]
    }
}