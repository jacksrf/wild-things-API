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

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.get('/', function(req, res, next) {
  res.redirect('/orders')
  //   var options = {
  //       screenSize: {
  //         'width': 1350,
  //         'height': 2200
  //       }
  //     }
  //     var options2 = {
  //           'width': 1350,
  //           'height': 2200
  //       }
  //
  // webshot("admin.alsflowersmontgomery.com/order/pdf/5c14273221a30375248c4293", "./public/pdf/test.pdf", options, function(err) {
  //   console.log(err)
  //
  //   // var html_parsed = '<img src="./public/pdf/test.png"/>'
  //   // pdf.create(html_parsed, options2).toFile('./public/pdf/order.pdf', function(err, res) {
  //   //   if (err) return console.log(err);
  //   //   console.log(res); // { filename: '/app/businesscard.pdf' }
  //   // });
  // });

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
            setTimeout(function() {
            // 545151
              var formData = {
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
                  if (error) {
                    console.log(error)
                  } else {
                    // console.log(response)
                    console.log(moment().format('MMMM Do YYYY, h:mm a'));
                    console.log('NEW PRINT ------ ORDER#:' + doc.order_number)
                  }
                }
              );
              setTimeout(function() {
                res.send()
              }, 1000)
            }, 4000)
        });

      } else {
        res.send()
      }
      })

    })
});

router.get('/order/reprint/pdf/:id', function(req, res, next) {
  var id = req.params.id;
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.findOne({"_id": id},{},function(err, doc){
    console.log(doc)
    var printerDB = db.get('printer')
    printerDB.findOne({}, {}, function(err, printer) {
      console.log(printer.printer_id)
    // if ( doc.note_attributes[1] != undefined) {
    //   var options = {
    //       screenSize: {
    //         'width': 1350,
    //         'height': 2200
    //       }
    //     }
    //     var options2 = {
    //           'width': 1350,
    //           'height': 2200
    //       }
    //
    //   webshot("admin.alsflowersmontgomery.com/order/pdf/"+doc._id, "./public/pdf/"+ doc._id +".pdf", options, function(err) {
    //     console.log(err)

          // 545151
            var formData = {
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
                  if (error) {
                    console.log(error)
                  } else {
                    // console.log(response)
                    console.log('REPRINT')
                    console.log(moment().format('MMMM Do YYYY, h:mm a'));
                    console.log('REPRINTED ------ ORDER#:' + doc.order_number)
                  }
                }
              );


      });
    // } else {
    //
    // }
    })
  // } )
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
