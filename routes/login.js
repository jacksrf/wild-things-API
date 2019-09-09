var passport = require('passport');
var express = require('express');
var async = require('async');
var moment = require('moment-timezone');
var csvParser = require('csv-parse');
var fs = require('fs')
var router = express.Router();
var mongo = require('mongodb')

var PDFDocument = require('pdfkit');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var ObjectID = mongo.ObjectID;

var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config2.json');
var s3Bucket = new AWS.S3({
    params: {
        Bucket: 'centurion-app'
    },
    sslEnabled: false
});


router.use(function(req, res, next) {
    next();
});
// app/routes.js
// root with login links

router.get('/profile', function(req, res) {
    if (req.user) {
        res.render('profile', {
            user: req.user
        });
    } else {
        res.redirect('/login');
    }
});
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
router.post('/signup', function(req, res, next) {
    // console.log(req.body)
    passport.authenticate('local-signup',
        function(err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash('info', info.message);
                return res.redirect('/admin/signup')
            }
            req.flash('info', info.message);
            res.redirect('/admin/home');
        })(req, res, next);
});
router.post('/login', function(req, res, next) {
    passport.authenticate('local-login',
        function(err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash('info', info.message);
                return res.redirect('/login');
            }
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                // console.log(req.user.local.email)
                return res.redirect('/orders');

            });
        })(req, res, next);
});

router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        res.redirect('/login'); //Inside a callback… bulletproof!
    });
});



function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}

function isSuperAdmin(req, res, next) {
    var email = req.user.local.email
    if (email === "jacksrf@gmail.com") {
        return next();
    } else {
        res.redirect('/admin/home', {
            "message": "****You dont have access to that page... sorry!"
        });
    }
}


module.exports = router;
