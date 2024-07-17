const {test, after, beforeEach, describe} = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const helper = require("./test_helper");
const app = require("../app");
// superagent object
const api = supertest(app);
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Note = require("../models/note");

describe("when there is initially some notes saved", () => {
  // functions is run everytime before a test is run
  beforeEach(async () => {
    // clear out a the beginning
    await Note.deleteMany({});
    // save two notes stored in initialNotes
    await Note.insertMany(helper.initialNotes);
  });

  // make a request
  test("notes are returned as json", async () => {
    await api
      .get("/api/notes")
      // verify the response with status code 200
      .expect(200)
      // verify type content header
      .expect("Content-Type", /application\/json/);
  });

  test("all notes are returned", async () => {
    const response = await api.get("/api/notes");

    assert.strictEqual(response.body.length, helper.initialNotes.length);
  });

  test("a specific note is within the returned notes", async () => {
    const response = await api.get("/api/notes");
    const contents = response.body.map(r => r.content);
    assert(contents.includes("Browser can execute only JavaScript"));
  });

  test("there are two notes", async () => {
    const response = await api.get("/api/notes");

    assert.strictEqual(response.body.length, 2);
  });

  test("the first note is about HTTP methods", async () => {
    const response = await api.get("/api/notes");

    const contents = response.body.map(e => e.content);
    assert(contents.includes("HTML is easy"));
  });

  describe("viewing a specific note", () => {
    test("succeeds with a valid id", async () => {
      const notesAtStart = await helper.notesInDb();

      const noteToView = notesAtStart[0];

      const resultNote = await api
        .get(`/api/notes/${noteToView.id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      assert.deepStrictEqual(resultNote.body, noteToView);
    });

    test("fails with status code 404 if note does not exist", async () => {
      const validNonexistingId = await helper.nonExistingId();

      await api.get(`/api/notes/${validNonexistingId}`).expect(404);
    });

    test("fails with status code 400 id is invalid", async () => {
      const invalidId = "5a3d5da59070081a82a3445";

      await api.get(`/api/notes/${invalidId}`).expect(400);
    });

    test("a specific note can be viewed", async () => {
      const notesAtStart = await helper.notesInDb();

      const noteToView = notesAtStart[0];
      const resultNote = await api
        .get(`/api/notes/${noteToView.id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      // strictEqual = compare the objects are the same
      // deepStrictEqual = compare the contents of the object
      assert.deepStrictEqual(resultNote.body, noteToView);
    });
  });

  describe("addition of a new note", () => {
    test("succeeds with valid data", async () => {
      const newNote = {
        content: "async/await simplifies making async calls",
        important: true,
      };

      await api
        .post("/api/notes")
        .send(newNote)
        .expect(201)
        .expect("Content-Type", /application\/json/);

      const notesAtEnd = await helper.notesInDb();
      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length + 1);

      const contents = notesAtEnd.map(n => n.content);
      assert(contents.includes("async/await simplifies making async calls"));
    });

    test("fails with status code 400 if data invalid", async () => {
      const newNote = {
        important: true,
      };

      await api.post("/api/notes").send(newNote).expect(400);

      const notesAtEnd = await helper.notesInDb();

      assert.strictEqual(notesAtEnd.length, helper.initialNotes.length);
    });

    describe("deletion of a note", () => {
      test("succeeds with status code 204 if id is valid", async () => {
        const notesAtStart = await helper.notesInDb();
        const noteToDelete = notesAtStart[0];

        await api.delete(`/api/notes/${noteToDelete.id}`).expect(204);

        const notesAtEnd = await helper.notesInDb();

        assert.strictEqual(notesAtEnd.length, helper.initialNotes.length - 1);

        const contents = notesAtEnd.map(r => r.content);
        assert(!contents.includes(noteToDelete.content));
      });
    });
  });
});

describe("when there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({username: "root", passwordHash});

    await user.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await helper.usersInDb();
    console.log("Users at start:", usersAtStart);

    const newUser = {
      username: "mluukkai",
      name: "Matti Luukkainen",
      password: "salainen",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    console.log("Users at end:", usersAtEnd);

    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

    const usernames = usersAtEnd.map(u => u.username);
    console.log("Usernames at end:", usernames);
    assert(usernames.includes(newUser.username));
  });

  test("creation fails with proper status code and message if username is already taken", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "salainen",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);

    assert(result.body.error.includes("Username already taken"));
  });
});

// close the db connection after finished executing
after(async () => {
  await mongoose.connection.close();
});
