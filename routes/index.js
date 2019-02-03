var express = require('express');
var router = express.Router();
var axios = require('axios');
var csrf = require('csurf')

var csrfProtection = csrf({ cookie: true })

/* GET home page. */
router.get('/', csrfProtection, function(req, res, next) {
  res.render('index', { csrfToken: req.csrfToken() });
});
/* GET home page. */
router.post('/add', csrfProtection, async (req, res)=> {
  var options = {
    url:req.body.url
  }
  options.headers = {
    'Authorization':`Token ${req.body.auth}`
  }
  console.log(req.body)

  try {
    var x = await axios(options);
    res.send(x.data)
    console.log(x.data)

  } catch (error) {
    console.log(error)
    res.send('texr')
  }

});

module.exports = router;
