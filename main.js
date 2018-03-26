let MongoClient = require('mongodb').MongoClient
let ObjectID = require('mongodb').ObjectID;
const express = require('express')
const app = express()
const router = express.Router()

let bodyParser = require('body-parser');
app.use(bodyParser.json());

let config = require('./config');

var stripe = require("stripe")(config.stripeSecretKey);

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
  var stripeToken = req.body.stripeToken;
  var orderDetails = req.body.orderDetails;

  const newOrder = {
    stripeToken,
    orderDetails,
    confirmTransaction: false
  };
  db.collection('orders').insertOne(newOrder).then((result) => {
    // Charge the user's card:
    stripe.charges.create({
      amount: orderDetails.totalCost,
      currency: 'usd',
      description: orderDetails.description || 'Cup Of Dirt',
      source: stripeToken.id
    }, (err, charge) => {
      if (err) {
        res.status(500).send({
          message: err
        })
      }
      // update database to confirm stripe transaction
      db.collection('orders').update({
        '_id': ObjectID(result.insertedId)
      }, {
        $set: {
          confirmTransaction: new Date()
        }
      }).then(() => {
        res.json(result);
      }, (err) => {
        res.json(result);
        //payment made, unable to confirm transaction in db
        //TODO: make a note in the log
      }); 
    });
  }, () => {
    res.status(500).send({
      message: 'Could not insert new order.'
    });
  })
});

app.listen(3000, () => console.log('example app listening on port 3000!'));
