const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const Book = require("../models/book");
const jsonschema = require("jsonschema");
const newBookSchema = require("../schemas/newBookSchema");
const updateBookSchema = require("../schemas/updateBookSchema");


/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[isbn]  => {book: book} */

router.get("/:isbn", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.isbn);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {
    // validate req.body against the schema in newBookSchema
    const result = jsonschema.validate(req.body, newBookSchema);
    // if body sent along with request is not valid (doesn't have the same schema as the one in 'newBookSchema'), map over the list of errors in 'result.errors' and for each error, take the 'error.stack' (which describes each error) and put it in a list called 'listOfErrors'. Respond with new ExpressError with that list of all errors ("listOfErrors') as the message
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    // if body sent along with request is valid, create a new book using the 'create' method on Book model (adds book to database), passing in all book data in req.body and returning all the data in the book object 
    const newBook = await Book.create(req.body);
    return res.json({book: newBook}, 201);
  } catch(err) {
    return next(err);
  }
});



/** PUT /[isbn]   bookData (without isbn)=> {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {
    // validate req.body against the schema in newBookSchema 
    const result = jsonschema.validate(req.body, updateBookSchema);
    // if body sent along with request is not valid (doesn't have the same schema as the one in 'updateBookSchema'), map over the list of errors in 'result.errors' and for each error, take the 'error.stack' (which describes each error) and put it in a list called 'listOfErrors'. Respond with new ExpressError with that list of all errors ("listOfErrors') as the message
    if(!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      let error = new ExpressError(listOfErrors, 400);
      return next(error);
    }
    // if body sent along with request is valid, update an existing book in the database using the 'update' method on Book model, passing in all book data except its' isbn in req.body and returning all the data in the book object 
    const updatedBook = await Book.update(req.params.isbn, req.body);
    return res.json({book: updatedBook});
  
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
