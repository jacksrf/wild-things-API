var express = require('express');
var router = express.Router();
var rest = require('restler');
var fs = require('fs');
var pdf = require('html-pdf');
var request = require('request');
var shop = 'als-flowers.myshopify.com';
var apiKey = '4081512935093e026334dc4561b90ef6';
var apiSecret = '7a060446ac0dda5075ea628e2595ee39';
var redirectUri = 'http://localhost:8090/generate_token';
var shopifyURIapi = 'https://' + apiKey + ':' + apiSecret + '@'+ shop;
// var jsPDF = require('jspdf');
var cheerio = require('cheerio')
var htmlToImage = require('html-to-image');
var webshot = require('webshot');
var moment = require('moment');
var nl2br  = require('nl2br');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.get('/', function(req, res, next) {
  res.redirect('/orders')
});

router.get('/orders', function(req, res, next) {
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.find({}, {limit:500, sort: {'processed_at': -1}}, function(err, orders) {
    console.log(err)
    res.render('orders', {orders: orders})
  })
});

router.post('/new/order', function(req, res, next) {
  // console.log(req.body)
  if (req.body.number === 4029 || req.body.number === 4032 || req.body.number === 4033) {
    res.end()
  } else {
    var db = req.db;
    var ordersDB = db.get('orders')
    ordersDB.insert(req.body)
    var items = req.body.line_items;
      ordersDB.findOne({"id": req.body.id}, {}, function(err, doc) {
        // console.log(doc)
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

          webshot("admin.alsflowersmontgomery.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
            // console.log(err)
              // setTimeout(function() {
              // 545151
                var formData = {
                      "printer": printer.printer_id,
                      "title": "Order: "+ doc.order_number,
                      "contentType": "pdf_uri",
                      "content": "https://api.alsflowersmontgomery.com/pdf/"+ doc._id +".pdf",
                      "source": "api documentation!",
                      "options": {
                        "paper": "Legal",
                        "bin": "Tray 1"
                      }
                }
                var username = "ee9da1bb0d504255374eb90055e050609fc54402";
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
                      console.log('NEW PRINT ------ ORDER#:' + doc.order_number)
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

      })
  }

});

router.get('/order/reprint/pdf/:id', function(req, res, next) {
  var id = req.params.id;
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.findOne({"_id": id},{},function(err, doc){
    // console.log(doc)
    var printerDB = db.get('printer')
    printerDB.findOne({}, {}, function(err, printer) {
      console.log(doc.closed_at)
      var isafter = moment(doc.closed_at).isAfter('2019-05-23T00:00:00+00:00');
      console.log(isafter)
      if (isafter === true) {
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

              webshot("admin.alsflowersmontgomery.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
                // console.log(err)
                  setTimeout(function() {
                    // console.log(printer.printer_id)
              var formData = {
                    // "printer": printer.printer_id,
                    "printer": printer.printer_id,
                    "title": "Order: "+ doc.order_number,
                    "contentType": "pdf_uri",
                    "content": "https://api.alsflowersmontgomery.com/pdf/"+ doc._id +".pdf",
                    "source": "api documentation!",
                    "options": {
                      "paper": "Legal"
                    }
              }
              var username = "ee9da1bb0d504255374eb90055e050609fc54402";
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
                    console.log(response.headers.date)
                    // console.log(body)
                    if (error) {
                      // console.log(error)
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
      } else {
        res.send()
      }

      });

    })
})


router.post('/update/order', function(req, res, next) {
  console.log(req.body)
    var db = req.db;
    var ordersDB = db.get('orders')
  ordersDB.findOne({"id": req.body.id}, {}, function(err, doc) {
    console.log(doc)
    if (doc === null || doc === "null") {
      if (req.body.number === 4029 || req.body.number === 4032 || req.body.number === 4033) {
        res.end()
      } else {

        ordersDB.insert(req.body)
        var items = req.body.line_items;
          ordersDB.findOne({"id": req.body.id}, {}, function(err, doc) {
            // console.log(doc)
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

              webshot("admin.alsflowersmontgomery.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
                console.log(err)
                  // setTimeout(function() {
                  // 545151
                    var formData = {
                          "printer": printer.printer_id,
                          "title": "Order: "+ doc.order_number,
                          "contentType": "pdf_uri",
                          "content": "https://api.alsflowersmontgomery.com/pdf/"+ doc._id +".pdf",
                          "source": "api documentation!",
                          "options": {
                            "paper": "Legal",
                            "bin": "Tray 1"
                          }
                    }
                    var username = "ee9da1bb0d504255374eb90055e050609fc54402";
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
                          console.log('NEW PRINT ------ ORDER#:' + doc.order_number)
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

          })
      }
    }

  })


});

router.get('/order/reprint/pdf/:id', function(req, res, next) {
  var id = req.params.id;
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.findOne({"_id": id},{},function(err, doc){
    // console.log(doc)
    var printerDB = db.get('printer')
    printerDB.findOne({}, {}, function(err, printer) {
      console.log(doc.closed_at)
      var isafter = moment(doc.closed_at).isAfter('2019-05-23T00:00:00+00:00');
      console.log(isafter)
      if (isafter === true) {
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

              webshot("admin.alsflowersmontgomery.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
                // console.log(err)
                  setTimeout(function() {
                    // console.log(printer.printer_id)
              var formData = {
                    // "printer": printer.printer_id,
                    "printer": printer.printer_id,
                    "title": "Order: "+ doc.order_number,
                    "contentType": "pdf_uri",
                    "content": "https://api.alsflowersmontgomery.com/pdf/"+ doc._id +".pdf",
                    "source": "api documentation!",
                    "options": {
                      "paper": "Legal"
                    }
              }
              var username = "ee9da1bb0d504255374eb90055e050609fc54402";
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
                    console.log(response.headers.date)
                    // console.log(body)
                    if (error) {
                      // console.log(error)
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
      } else {
        res.send()
      }

      });

    })
})

router.get('/order/edit/:id', multipartMiddleware, function(req, res, next) {

  var id = req.params.id;
  // var filename  = './'+ id +'.pdf';
  console.log(id);
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.findOne({"_id": id}, {}, function(err, doc) {
    console.log(doc.note)
    console.log(doc.note_attributes.length);
    res.render('order-edit', {"order": doc})
  })

})

router.post('/order/edit/:id', multipartMiddleware, function(req, res, next) {

  var id = req.params.id;
  // var filename  = './'+ id +'.pdf';
  var form = req.body
  console.log(id);
  console.log(form)
  var newNoteAttributes = [];
  var newNote = ''
  function callback () {
    console.log('all done');
    console.log(newNoteAttributes)
    var db = req.db;
    var ordersDB = db.get('orders')
    ordersDB.update({"_id": id}, {$set: {"note_attributes": newNoteAttributes, "note": newNote}}, function(err, doc) {
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

router.get('/order/save/confirmation/:id', multipartMiddleware, function(req, res, next) {

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

module.exports = router;
