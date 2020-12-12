var express = require('express');
var router = express.Router();
var rest = require('restler');
var fs = require('fs');
var pdf = require('html-pdf');
var request = require('request');
// var jsPDF = require('jspdf');
var cheerio = require('cheerio')
var htmlToImage = require('html-to-image');
var webshot = require('webshot');
var moment = require('moment');
var nl2br  = require('nl2br');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var passport = require('passport');
var express = require('express');
var router = express.Router();
var mongo = require('mongodb')

router.use(function(req, res, next) {
    next();
});
// app/routes.js
// root with login links

router.get('/login', function(req, res, next) {
  res.render('login')
});

router.get('/signup', isSuperAdmin, isLoggedIn, function(req, res, next) {
  res.render('signup')
});

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

router.get('/', isLoggedIn, function(req, res, next) {
  res.redirect('/orders')
});

router.get('/orders', isLoggedIn, function(req, res, next) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(ip)
  console.log(req)
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.find({}, {limit:500, sort: {'processed_at': -1}}, function(err, orders) {
    console.log(err)
    console.log(orders)
    res.render('orders', {orders: orders})
  })
});

router.post('/orders/search', isLoggedIn, function(req, res, next) {
  var order = req.body.order;
  console.log(order)
  var order_number = '#'+order;
  var db = req.db;
  var ordersDB = db.get('orders')
  if (order === "") {
    ordersDB.find({}, {limit:500, sort: {'processed_at': -1}}, function(err, orders) {
      console.log(err)
      console.log(orders)
      res.render('orders', {orders: orders})
    })
  } else {
    ordersDB.find({$or: [{"name": order_number},{"customer.first_name" : new RegExp('^'+order+'$', "i")}]}, {limit:500, sort: {'processed_at': -1}}, function(err, orders) {
      console.log(err)
      console.log(orders)
      res.render('orders', {orders: orders})
    })
  }

})

router.post('/new/order', function(req, res, next) {
  var db = req.db;
  var ordersDB = db.get('orders')
  var order_number = "#" + req.body.number;
  ordersDB.findOne({ "name" : order_number}, {}, function(err, doc) {
  console.log(err)
  if (doc === null || doc === undefined) {
        var db = req.db;
        var ordersDB = db.get('orders')
        ordersDB.insert(req.body)
        console.log(req.body)
        var items = req.body.line_items;

          ordersDB.findOne({"id": req.body.id}, {}, function(err, doc) {
            doc.note = nl2br(doc.note);
            console.log(doc.note);
            doc.deliver_day = "";
            if (doc.user_id) {

            } else {
              doc.user_id = "";
            }
            doc.orderNotes = {};

            for (i=0; i<doc.note_attributes.length; i++) {
                var key = doc.note_attributes[i].name.replace(/ /g, "_").replace(/-/g, "_").toLowerCase();
                var value = doc.note_attributes[i].value.toString();
                doc.orderNotes[key] = value;
                if (i=== doc.note_attributes.length-1) {
                  console.log(doc.orderNotes)

                }
            }
            if (doc.orderNotes.checkout_method === "delivery" || doc.orderNotes.checkout_method === 'pickup') {
            console.log(doc)
            var printerDB = db.get('printer')
            printerDB.findOne({}, {}, function(err, printer) {
              // console.log(printer.printer_id)
            if ( doc.note_attributes[1] != undefined) {
              var options = {
                  screenSize: {
                    'width': 1350,
                    'height': 2200
                  }
                }
                var options2 = {
                      'width': 1350,
                      'height': 2200
                  }
                  console.log(doc._id)
              webshot("https://admin-wildthings.devotestudio.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
                console.log(err)
                  // setTimeout(function() {
                  // 545151
                    var formData = {
                          "printer": 69910985,
                          "title": "Order: "+ doc.order_number,
                          "contentType": "pdf_uri",
                          "content": "https://api-wildthings.devotestudio.com/pdf/"+ doc._id +".pdf",
                          "source": "api documentation!",
                          "options": {
                            "paper": "Legal",
                          }
                    }
                    var username = "S67hEzvCL_PbFZ2k_1UINbTAFzFLQ1zufwB9rwepYwk";
                    var password = "";
                    var url = "https://api.printnode.com/printjobs";
                    var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

                  request.post(
                      {
                          url : url,
                          headers : {
                              "Authorization" : auth
                          },
                          json: true,
                          body: formData
                      },
                      function (error, response, body) {
                        if (error) {
                          console.log(error)
                          // setTimeout(function() {
                            res.end();
                          // }, 1000)
                        } else {
                          // console.log(response)
                          console.log(moment().format('MMMM Do YYYY, h:mm a'));
                          console.log('NEW ORDER#:' + doc.order_number)
                          // setTimeout(function() {
                            res.end();
                          // }, 1000)
                        }
                      }
                    );

                  // }, 4000)
              });

            } else {
              res.end();
            }
            })
          } else {
            res.send()
          }
          })
      } else {
        doc.note = nl2br(doc.note);
        console.log(doc.note);
        doc.deliver_day = "";
        if (doc.user_id) {

        } else {
          doc.user_id = "";
        }
        doc.orderNotes = {};

        for (i=0; i<doc.note_attributes.length; i++) {
            var key = doc.note_attributes[i].name.replace(/ /g, "_").replace(/-/g, "_").toLowerCase();
            var value = doc.note_attributes[i].value.toString();
            doc.orderNotes[key] = value;
            if (i=== doc.note_attributes.length-1) {
              console.log(doc.orderNotes)

            }
        }
        if (doc.orderNotes.checkout_method === "delivery" || doc.orderNotes.checkout_method === 'pickup') {
        console.log(doc.number)
        var printerDB = db.get('printer')
        printerDB.findOne({}, {}, function(err, printer) {
          // console.log(printer.printer_id)
        if ( doc.note_attributes[1] != undefined) {
          var options = {
              screenSize: {
                'width': 1350,
                'height': 2200
              }
            }
            var options2 = {
                  'width': 1350,
                  'height': 2200
              }
              console.log(doc._id)
          webshot("https://admin-wildthings.devotestudio.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
            console.log(err)
              // setTimeout(function() {
              // 545151
                var formData = {
                      "printer": 69910985,
                      "title": "Order: "+ doc.order_number,
                      "contentType": "pdf_uri",
                      "content": "https://api-wildthings.devotestudio.com/pdf/"+ doc._id +".pdf",
                      "source": "api documentation!",
                      "options": {
                        "paper": "Legal",
                      }
                }
                var username = "S67hEzvCL_PbFZ2k_1UINbTAFzFLQ1zufwB9rwepYwk";
                var password = "";
                var url = "https://api.printnode.com/printjobs";
                var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

              request.post(
                  {
                      url : url,
                      headers : {
                          "Authorization" : auth
                      },
                      json: true,
                      body: formData
                  },
                  function (error, response, body) {
                    if (error) {
                      console.log(error)
                      // setTimeout(function() {
                        res.end();
                      // }, 1000)
                    } else {
                      // console.log(response)
                      console.log(moment().format('MMMM Do YYYY, h:mm a'));
                      console.log('NEW ORDER#:' + doc.order_number)
                      // setTimeout(function() {
                        res.end();
                      // }, 1000)
                    }
                  }
                );

              // }, 4000)
          });
        } else {
          res.end();
        }
        })
      } else {
        res.send();
      }
           // res.send();
      }
    })


  // }

});

router.get('/order/reprint/pdf/:id', isLoggedIn, function(req, res, next) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  // console.log(ip)
  var key = req.query.key;
  // console.log(key)
  var id = req.params.id;
  var db = req.db;
  var ordersDB = db.get('orders')
  // if (key != undefined) {
  ordersDB.findOne({"_id": id},{},function(err, doc){
    console.log(doc)
    var printerDB = db.get('printer')
    printerDB.findOne({}, {}, function(err, printer) {
      // console.log(doc.updated_at)
      var isafter = moment(doc.updated_at).isAfter('2018-06-01T00:00:00+00:00');
      // console.log(isafter)
      // console.log(doc.note_attributes)
      // if (isafter === "true" || isafter === true) {
        // console.log(doc.note_attributes)
        if ( doc.note_attributes[1] != undefined) {
          var options = {
              screenSize: {
                'width': 1350,
                'height': 2200
              }
            }
            var options2 = {
                  'width': 1350,
                  'height': 2200
              }
              console.log(doc._id)
              webshot("admin-wildthings.devotestudio.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
                console.log(err)
                  setTimeout(function() {
                    // console.log(printer.printer_id)
              var formData = {
                    // "printer": printer.printer_id,
                    "printer": 69910985,
                    "title": "Order: "+ doc.order_number,
                    "contentType": "pdf_uri",
                    "content": "https://api-wildthings.devotestudio.com/pdf/"+ doc._id +".pdf?t=" + Math.random(),
                    "source": "api documentation!",
                    "options": {
                      "paper": "Legal",
                    }
              }
              var username = "S67hEzvCL_PbFZ2k_1UINbTAFzFLQ1zufwB9rwepYwk";
              var password = "";
              var url = "https://api.printnode.com/printjobs";
              var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

              request.post(
                  {
                      url : url,
                      headers : {
                          "Authorization" : auth
                      },
                      json: true,
                      body: formData
                  },
                  function (error, response, body) {
                    // console.log(response.headers.date)
                    // console.log(body)
                    if (error) {
                      console.log(error)
                      res.send('index', {"message": "THERE WAS AN ISSUE PRINTING, LET TREY KNOW IMMEDIATELY"})
                    } else {
                      // console.log(response)
                      console.log('REPRINT')
                      console.log(moment().format('MMMM Do YYYY, h:mm a'));
                      console.log('REPRINTED ------ ORDER#:' + doc.order_number)
                      res.render('index', {"message": "COMPLETED! YOURE PRINT SHOULD BECOMING SOON."})
                    }
                  }
                );

              }, 4000)
          });

        } else {
          res.send()
        }
      // } else {
      //   res.send()
      // }

      });

    })
  // }

})

router.get('/order/json/:id', function(req, res, next) {
  var id = req.params.id;
  var db = req.db;
  var ordersDB = db.get('orders')
  // if (key != undefined) {
  ordersDB.findOne({"_id": id},{},function(err, doc){
    res.send(doc)
  })
});

// router.post('/update/order', function(req, res, next) {
//   // console.log(req.body)
//   // res.send()
//   var order_number = "#" + req.body.number;
//   ordersDB.findOne({ "name" : order_number}, {}, function(err, doc) {
//     console.log(err)
//     if (doc === null || doc === undefined) {
//       var db = req.db;
//       var ordersDB = db.get('orders')
//       ordersDB.insert(req.body)
//       console.log(req.body)
//       var items = req.body.line_items;
//
//         ordersDB.findOne({"id": req.body.id}, {}, function(err, doc) {
//           console.log(doc)
//           var printerDB = db.get('printer')
//           printerDB.findOne({}, {}, function(err, printer) {
//             // console.log(printer.printer_id)
//           if ( doc.note_attributes[1] != undefined) {
//             var options = {
//                 screenSize: {
//                   'width': 1350,
//                   'height': 2200
//                 }
//               }
//               var options2 = {
//                     'width': 1350,
//                     'height': 2200
//                 }
//                 console.log(doc._id)
//             webshot("https://admin-wildthings.devotestudio.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
//               console.log(err)
//                 // setTimeout(function() {
//                 // 545151
//                   var formData = {
//                         "printer": 69910985,
//                         "title": "Order: "+ doc.order_number,
//                         "contentType": "pdf_uri",
//                         "content": "https://api-wildthings.devotestudio.com/pdf/"+ doc._id +".pdf",
//                         "source": "api documentation!",
//                         "options": {
//                           "paper": "Legal",
//                         }
//                   }
//                   var username = "S67hEzvCL_PbFZ2k_1UINbTAFzFLQ1zufwB9rwepYwk";
//                   var password = "";
//                   var url = "https://api.printnode.com/printjobs";
//                   var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
//
//                 request.post(
//                     {
//                         url : url,
//                         headers : {
//                             "Authorization" : auth
//                         },
//                         json: true,
//                         body: formData
//                     },
//                     function (error, response, body) {
//                       if (error) {
//                         console.log(error)
//                         // setTimeout(function() {
//                           res.end();
//                         // }, 1000)
//                       } else {
//                         // console.log(response)
//                         console.log(moment().format('MMMM Do YYYY, h:mm a'));
//                         console.log('NEW ORDER#:' + doc.order_number)
//                         // setTimeout(function() {
//                           res.end();
//                         // }, 1000)
//                       }
//                     }
//                   );
//
//                 // }, 4000)
//             });
//
//           } else {
//             res.end();
//           }
//           })
//
//         })
//     } else {
//       console.log(doc.number)
//       var printerDB = db.get('printer')
//       printerDB.findOne({}, {}, function(err, printer) {
//         // console.log(printer.printer_id)
//       if ( doc.note_attributes[1] != undefined) {
//         var options = {
//             screenSize: {
//               'width': 1350,
//               'height': 2200
//             }
//           }
//           var options2 = {
//                 'width': 1350,
//                 'height': 2200
//             }
//             console.log(doc._id)
//         webshot("https://admin-wildthings.devotestudio.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
//           console.log(err)
//             // setTimeout(function() {
//             // 545151
//               var formData = {
//                     "printer": 69910985,
//                     "title": "Order: "+ doc.order_number,
//                     "contentType": "pdf_uri",
//                     "content": "https://api-wildthings.devotestudio.com/pdf/"+ doc._id +".pdf",
//                     "source": "api documentation!",
//                     "options": {
//                       "paper": "Legal",
//                     }
//               }
//               var username = "S67hEzvCL_PbFZ2k_1UINbTAFzFLQ1zufwB9rwepYwk";
//               var password = "";
//               var url = "https://api.printnode.com/printjobs";
//               var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
//
//             request.post(
//                 {
//                     url : url,
//                     headers : {
//                         "Authorization" : auth
//                     },
//                     json: true,
//                     body: formData
//                 },
//                 function (error, response, body) {
//                   if (error) {
//                     console.log(error)
//                     // setTimeout(function() {
//                       res.end();
//                     // }, 1000)
//                   } else {
//                     // console.log(response)
//                     console.log(moment().format('MMMM Do YYYY, h:mm a'));
//                     console.log('NEW ORDER#:' + doc.order_number)
//                     // setTimeout(function() {
//                       res.end();
//                     // }, 1000)
//                   }
//                 }
//               );
//
//             // }, 4000)
//         });
//       } else {
//         res.end();
//       }
//       })
//         // res.send();
//     }
//   })
// });

router.post('/order/update', function(req, res, next) {
  console.log(req.body)
  res.send()
  // var db = req.db;
  // var ordersDB = db.get('orders')
  //
  // var order_number = "#" + req.body.number;
  // console.log(order_number)
  // ordersDB.findOne({ "name" : order_number}, {}, function(err, doc) {
  //   console.log(err)
  //   if (doc === null || doc === undefined) {
  //     var db = req.db;
  //     var ordersDB = db.get('orders')
  //     ordersDB.insert(req.body)
  //     console.log(req.body)
  //     var items = req.body.line_items;
  //
  //       ordersDB.findOne({"id": req.body.id}, {}, function(err, doc) {
  //         console.log(doc)
  //         var printerDB = db.get('printer')
  //         printerDB.findOne({}, {}, function(err, printer) {
  //           // console.log(printer.printer_id)
  //         if ( doc.note_attributes[1] != undefined) {
  //           var options = {
  //               screenSize: {
  //                 'width': 1350,
  //                 'height': 2200
  //               }
  //             }
  //             var options2 = {
  //                   'width': 1350,
  //                   'height': 2200
  //               }
  //               console.log(doc._id)
  //           webshot("https://admin-wildthings.devotestudio.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
  //             console.log(err)
  //               // setTimeout(function() {
  //               // 545151
  //                 var formData = {
  //                       "printer": 69910985,
  //                       "title": "Order: "+ doc.order_number,
  //                       "contentType": "pdf_uri",
  //                       "content": "https://api-wildthings.devotestudio.com/pdf/"+ doc._id +".pdf",
  //                       "source": "api documentation!",
  //                       "options": {
  //                         "paper": "Legal",
  //                       }
  //                 }
  //                 var username = "S67hEzvCL_PbFZ2k_1UINbTAFzFLQ1zufwB9rwepYwk";
  //                 var password = "";
  //                 var url = "https://api.printnode.com/printjobs";
  //                 var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
  //
  //               request.post(
  //                   {
  //                       url : url,
  //                       headers : {
  //                           "Authorization" : auth
  //                       },
  //                       json: true,
  //                       body: formData
  //                   },
  //                   function (error, response, body) {
  //                     if (error) {
  //                       console.log(error)
  //                       // setTimeout(function() {
  //                         res.end();
  //                       // }, 1000)
  //                     } else {
  //                       // console.log(response)
  //                       console.log(moment().format('MMMM Do YYYY, h:mm a'));
  //                       console.log('NEW ORDER#:' + doc.order_number)
  //                       // setTimeout(function() {
  //                         res.end();
  //                       // }, 1000)
  //                     }
  //                   }
  //                 );
  //
  //               // }, 4000)
  //           });
  //
  //         } else {
  //           res.end();
  //         }
  //         })
  //
  //       })
  //   } else {
  //     console.log(doc.number)
  //     var printerDB = db.get('printer')
  //     printerDB.findOne({}, {}, function(err, printer) {
  //       // console.log(printer.printer_id)
  //     if ( doc.note_attributes[1] != undefined) {
  //       var options = {
  //           screenSize: {
  //             'width': 1350,
  //             'height': 2200
  //           }
  //         }
  //         var options2 = {
  //               'width': 1350,
  //               'height': 2200
  //           }
  //           console.log(doc._id)
  //       webshot("https://admin-wildthings.devotestudio.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
  //         console.log(err)
  //           // setTimeout(function() {
  //           // 545151
  //             var formData = {
  //                   "printer": 69910985,
  //                   "title": "Order: "+ doc.order_number,
  //                   "contentType": "pdf_uri",
  //                   "content": "https://api-wildthings.devotestudio.com/pdf/"+ doc._id +".pdf",
  //                   "source": "api documentation!",
  //                   "options": {
  //                     "paper": "Legal",
  //                   }
  //             }
  //             var username = "S67hEzvCL_PbFZ2k_1UINbTAFzFLQ1zufwB9rwepYwk";
  //             var password = "";
  //             var url = "https://api.printnode.com/printjobs";
  //             var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
  //
  //           request.post(
  //               {
  //                   url : url,
  //                   headers : {
  //                       "Authorization" : auth
  //                   },
  //                   json: true,
  //                   body: formData
  //               },
  //               function (error, response, body) {
  //                 if (error) {
  //                   console.log(error)
  //                   // setTimeout(function() {
  //                     res.end();
  //                   // }, 1000)
  //                 } else {
  //                   // console.log(response)
  //                   console.log(moment().format('MMMM Do YYYY, h:mm a'));
  //                   console.log('NEW ORDER#:' + doc.order_number)
  //                   // setTimeout(function() {
  //                     res.end();
  //                   // }, 1000)
  //                 }
  //               }
  //             );
  //
  //           // }, 4000)
  //       });
  //     } else {
  //       res.end();
  //     }
  //     })
  //       // res.send();
  //   }
  // })
});

router.get('/order/edit/:id', isLoggedIn, multipartMiddleware, function(req, res, next) {

  var id = req.params.id;
  // var filename  = './'+ id +'.pdf';
  console.log(id);
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.findOne({"_id": id}, {}, function(err, doc) {
    console.log(doc.note)
    console.log(doc.note_attributes.length);
    console.log(doc)
    res.render('order-edit', {"order": doc})
  })

})
//
router.post('/order/edit/:id', isLoggedIn, multipartMiddleware, function(req, res, next) {
  console.log(req.body)
  var id = req.params.id;
  // // var filename  = './'+ id +'.pdf';
  var form = req.body.note_attributes
  console.log(id);
  console.log(form)
  var newNoteAttributes = [];
  var newNote = ''
  function callback () {
    console.log('all done');
    console.log(newNoteAttributes)
    var db = req.db;
    var ordersDB = db.get('orders')
    ordersDB.update({"_id": id}, {$set: {"note_attributes": newNoteAttributes, "shipping_address": req.body.shipping_address, "note": req.body.note}}, function(err, doc) {
      console.log(doc)
      res.redirect('/order/save/confirmation/'+ id)
    })
  }
  var itemsProcessed = 0;
  Object.entries(form).forEach(
      ([key, value]) => {
        console.log(key, value)
        if (key === 'note') {
          newNote = value
          console.log("note: " + newNote)
          itemsProcessed++;
          if(itemsProcessed === Object.entries(form).length) {
            callback();
          }
        } else {
          var item = {name: key, value: value}
          console.log(item)
          newNoteAttributes.push(item)
          itemsProcessed++;
          if(itemsProcessed === Object.entries(form).length) {
            callback();
          }
        }
      }
  );


})

router.get('/order/save/confirmation/:id', isLoggedIn, multipartMiddleware, function(req, res, next) {

  var id = req.params.id;
  // var filename  = './'+ id +'.pdf';
  console.log(id);
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.findOne({"_id": id}, {}, function(err, doc) {
    console.log(doc.note_attributes)
    res.render('order-save', {"order": doc})
  })

})


router.post('/order/pdf/save/:id', multipartMiddleware, function(req, res, next) {

  var id = req.params.id;
  var filename  = './'+ id +'.pdf';
  console.log(id);
  var db = req.db;
  var file = req.body
  console.log(file)
  // var pdf = new jsPDF('p', 'mm', 'a4');
  // pdf.addImage(file.image, 'PNG', 0, 0, 211, 298);
  // console.log(pdf)
  // var data = pdf.output();
  //
  // fs.writeFileSync(filename, data);
})


router.get('/order/delete/:id', multipartMiddleware, function(req, res, next) {

  var id = req.params.id;
  console.log(id);
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.remove({'_id': id})
  res.redirect('/orders')
})


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
