var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/new/order', function(req, res, next) {
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.insert(req.body)
  console.log(req.body)
  res.send()
});

module.exports = router;
