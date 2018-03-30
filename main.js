let MongoClient = require('mongodb').MongoClient
let ObjectID = require('mongodb').ObjectID;
const express = require('express')
const app = express()
const router = express.Router()

let bodyParser = require('body-parser');
app.use(bodyParser.json());

let config = require('./config');

var stripe = require("stripe")(config.stripeSecretKey);

let request = require(('request'));

//One option to handle CORS
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// })

/* TODO: add api prefix to all calls
let api = express.Router();
ap.use('/api', api);

*/

let db;

MongoClient.connect('mongodb://localhost:27017', (err, database) => {
  if (err) throw err;
  db = database.db('cod');
});

app.get('/products', (req, res) => {
  db.collection('products').find({}).toArray((err, docs) => {
    res.json(docs);
  })
});

//PRODUCTS
app.post('/products', (req, res) => {
  const product = req.body;
  const newProductObject = {
    name: product.name,
    description: product.description,
    price: product.price
  };
  db.collection('products').insert(newProductObject, (err, result) => {
    res.json(result)
  });
});

app.put('/products/:id', (req, res) => {
  var id = req.params.id;
  
  const product = req.body.product;

  db.collection('products').replaceOne(
    {_id: new ObjectID(id)}, product, (err, result) => {
      res.json(result)
    })
});

app.delete('/products/:id', (req, res) => {
  var id = req.params.id;

  db.collection('products').deleteOne(
    {_id: new ObjectID(id)}, (err, result) => {
      res.json(result)
    })
});


//PURCHASES
app.post('/purchases', (req, res) => {
  const purchase = req.body;
  const newPurchaseObject = {
    customerFirstName: purchase.customerFirstName,
    customerLastName: purchase.customerLastName,
    productId: purchase.productId,
    baseCost: purchase.baseCost,
    salesTax: purchase.salesTax,
    addressLn1: purchase.addressLn1,
    addressLn2: purchase.addressLn2,
    state: purchase.state,
    zip: purchase.zip
  };
  db.collection('purchases').insert(newPurchaseObject, (err, result) => {
    res.json(result)
  });
});

app.put('/purchases/:id', (req, res) => {
  var id = req.params.id;
  
  const product = req.body.product;

  db.collection('purchases').replaceOne(
    {_id: new ObjectID(id)}, product, (err, result) => {
      res.json(result)
    })
});

app.delete('/purchases/:id', (req, res) => {
  var id = req.params.id;

  db.collection('purchases').deleteOne(
    {_id: new ObjectID(id)}, (err, result) => {
      res.json(result)
    })
});

app.post('/newOrder', (req, res) => {
  var stripeTokenId = req.body.stripeTokenId;
  var orderDetails = req.body.orderDetails;

  // Charge the user's card:
  stripe.charges.create({
    amount: orderDetails.totalCost,
    currency: 'usd',
    description: orderDetails.description || 'Cup Of Dirt',
    source: stripeTokenId
  }, (err, charge) => {
    if (err) {
      res.status(500).send({
        message: err,
        charge
      })
    }
    res.json(charge)
  });
});

app.get('/orders', (req, res) => {
  let limit = req.query.limit;
  if (!limit) {
    res.status(400).send({
      message: '"limit" query not defined'
    });
    return;
  }
  request('https://' + config.stripeSecretKey + ':@api.stripe.com/v1/charges?limit=' + limit, (err, response, body) => {
    if (err) {
      res.status(500).send({
        message: err
      });
    }
    var info = JSON.parse(body);
    console.log('info', info.data);
    
    res.send(info);
  })
});

app.listen(3000, () => console.log('COD api listening on port 3000!'));
