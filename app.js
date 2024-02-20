const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('./db');

const app = express();
app.use(express.json());

// connect to the database
let db;

(async () => {
  try {
    await connectToDb();
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
      db = getDb();
    });
  } catch (err) {
    console.error('Unable to start the server', err);
    process.exit(1);
  }
})();

// 取資料：使用 find + limit + toArray
app.get('/findLimit', (req, res) => {

  db.collection('books')
    .find()
    .limit(5)
    .toArray()
    .then(books => res.status(200).json(books))
    .catch(err => {
      console.log(err);
      res.status(500).send('Error occurred');
    });

});

// 取資料：使用 find + forEach
app.get('/forEach', (req, res) => {

  const books = [];

  db.collection('books')
    .find()
    .sort({ author: 1 })
    .forEach(book => books.push(book))
    .then(() => res.status(200).json(books))
    .catch(err => {
      console.log(err);
      res.status(500).send('Error occurred');
    });

});

// 取出的資料，只回傳特定欄位：使用 find + project
app.get('/projection', (req, res) => {

  db.collection('books')
    .find()
    .limit(3)
    .project({ _id: 0, title: 1, author: 1 })
    .toArray()
    .then(books => res.status(200).json(books))
    .catch(err => {
      console.log(err);
      res.status(500).send('Error occurred');
    });

});

// 上方的 projection 可以改寫成下方的方式
app.get('/projection2', (req, res) => {

  db.collection('books')
    .find({}, { projection: { _id: 0, title: 1, author: 1 } })
    .limit(3)
    .toArray()
    .then(books => res.status(200).json(books))
    .catch(err => {
      console.log(err);
      res.status(500).send('Error occurred');
    });

});

// 查詢單筆資料
app.get('/book/:id', (req, res) => {

  const id = req.params.id;

  // 檢查 id 是否為有效的 ObjectId
  if (ObjectId.isValid(id)) {
    db.collection('books')
      .findOne({ _id: new ObjectId(id) })
      .then(book => res.status(200).json(book))
      .catch(err => {
        console.log(err);
        res.status(500).send('Error occurred');
      });
  } else {
    res.status(400).send('Invalid ID');
  }

});

// 查詢多筆資料，使用分頁功能
// client 可以透過 query string 傳遞 page 和 size
// 例如：/books?page=2&size=5
app.get('/pagination', (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;

  const books = [];

  db.collection('books')
    .find()
    .skip((page - 1) * size)
    .limit(size)
    .forEach(book => books.push(book))
    .then(() => res.status(200).json(books))
    .catch(err => {
      res.status(500).send('Error occurred');
    });

});

// POST 新增單筆資料
app.post('/createBook', (req, res) => {

  const book = req.body;

  db.collection('books')
    .insertOne(book)
    .then(result => res.status(201).json(result))
    .catch(err => {
      console.log(err);
      res.status(500).send('Error occurred');
    });

});

// POST 新增多筆資料
app.post('/createBooks', (req, res) => {

  const books = req.body;

  db.collection('books')
    .insertMany(books)
    .then(result => res.status(201).json(result))
    .catch(err => {
      console.log(err);
      res.status(500).send('Error occurred');
    });

});

// DELETE 刪除資料
app.delete('/deleteBook/:id', (req, res) => {

  const id = req.params.id;

  if (ObjectId.isValid(id)) {
    db.collection('books')
      .deleteOne({ _id: new ObjectId(id) })
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).send('Error occurred');
      });
  } else {
    res.status(400).send('Invalid ID');
  }

});

// PATCH 更新資料
app.patch('/updateBook/:id', (req, res) => {

  const id = req.params.id;
  const book = req.body;

  if (ObjectId.isValid(id)) {
    db.collection('books')
      .updateOne({ _id: new ObjectId(id) }, { $set: book })
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).send('Error occurred');
      });
  } else {
    res.status(400).send('Invalid ID');
  }

});