var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/new/order', function(req, res, next) {
  console.log(req.body)
  res.send()
});

module.exports = router;
