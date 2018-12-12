var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/new/order', function(req, res, next) {
  console.log(req.body)
  var db = req.db;
  var ordersDB = db.get('orders')
  ordersDB.insert(req.body)

  res.send()
});

module.exports = router;
