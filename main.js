let MongoClient = require('mongodb').MongoClient
let ObjectID = require('mongodb').ObjectID;
const express = require('express')
const app = express()
const router = express.Router()

var bodyParser = require('body-parser');
app.use(bodyParser.json());

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
  const product = req.body; console.log('product', req.body)
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


//





app.listen(3000, () => console.log('example app listening on port 3000!'));
