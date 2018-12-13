var express = require('express');
var router = express.Router();
var rest = require('restler');
var shop = 'als-flowers.myshopify.com';
var apiKey = '4081512935093e026334dc4561b90ef6';
var apiSecret = '7a060446ac0dda5075ea628e2595ee39';
var redirectUri = 'http://localhost:8090/generate_token';
var shopifyURIapi = 'https://' + apiKey + ':' + apiSecret + '@'+ shop;

router.get('/', function(req, res, next) {
  // rest.get(shopifyURIapi + '/admin/products/#' +  + '.json').on('complete', function(result) {
  //       if (result instanceof Error) {
  //         console.log('Error:', result.message);
  //         this.retry(5000); // try again after 5 sec
  //       } else {
  //         console.log(result)
  //         res.render('index', {"title": result })
  //       }
  //     })
});

router.post('/new/order', function(req, res, next) {
  console.log(Object.keys(req.body))
  console.log(req.body.line_items)
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.insert(req.body)
  var items = req.body.line_items;
  for (i=0; i<items.length; i++) {
    console.log(items[i].title)
    rest.get(shopifyURIapi + '/admin/products/#' + items[i].id + '.json').on('complete', function(result) {
          if (result instanceof Error) {
            console.log('Error:', result.message);
            this.retry(5000); // try again after 5 sec
          } else {
            console.log(result)

          }
        })
  }
});

module.exports = router;
