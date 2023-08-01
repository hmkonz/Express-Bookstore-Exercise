process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("./app");
const db = require("./db");

// isbn of sample book
let book_isbn;


beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '0123456789',
        'https://amazon.com/test',
        'Test Author',
        'English',
        200,
        'Test Publishers',
        'Test Book', 2023)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});


describe("GET /books", function () {
    test("Gets a list of 1 book", async function () {
      const response = await request(app).get(`/books/`);
      const books = response.body.books;
      expect(books).toHaveLength(1);
      expect(books[0]).toHaveProperty("language");
      expect(books[0]).toHaveProperty("author");
    });
});

describe("GET /books/:isbn", function () {
    test("Gets a book with a specific isbn", async function () {
      const response = await request(app).get(`/books/${book_isbn}`);
      expect(response.body.book).toHaveProperty("isbn");
      expect(response.body.book.isbn).toBe(book_isbn);
    });

    test("Responds with 404 if can't find book in question", async function () {
      const response = await request(app)
          .get(`/books/100`)
      expect(response.statusCode).toBe(404);
    });
});

describe("POST /books", function() {
    test("Creates a new book", async function () {
      const response = (await request(app)
        .post(`/books`)
        .send(
          {
            isbn: '0590353403',
            amazon_url: "https://Harry-Potter-Sorcerers-Stone-Rowling.com",
            author: "J.K. Rowling",
            language: "english",
            pages: 309,
            publisher: "Scholastic Press",
            title: "Harry Potter and The Sorcerer's Stone",
            year: 1998 
        }));
    
      expect(response.statusCode).toBe(201);
      expect(response.body.book).toHaveProperty("isbn");
      
    });
});

describe("PUT /books/:isbn", function () {
  test("Updates a single book", async function () {
    const response = await request(app)
      .put(`/books/${book_isbn}`)
      .send({
          amazon_url: "https://Harry-Potter-Sorcerers-Stone-Rowling.com",
          author: "J.K. Rowling",
          language: "french",
          pages: 309,
          publisher: "Scholastic Press",
          title: "Harry Potter and The Sorcerer's Stone",
          year: 1998 
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body.book.language).toBe("french");
  });

});

describe("DELETE /books/:isbn", function () {
  test("Deletes a single book", async function () {
    const response = await request(app)
      .delete(`/books/${book_isbn}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({message: "Book deleted"});  
  });
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});


  afterAll(async function() {
    //close db connection
    await db.end();
  });
