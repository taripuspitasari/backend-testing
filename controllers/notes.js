const notesRouter = require("express").Router();
const Note = require("../models/note");
const User = require("../models/user");

notesRouter.get("/", async (request, response, next) => {
  try {
    const userId = request.decodedToken.id;
    const notes = await Note.find({user: userId}).populate("user");
    response.json(notes);
  } catch (error) {
    next(error);
  }
});

notesRouter.get("/:id", async (request, response, next) => {
  try {
    const {id} = request.params;
    const userId = request.decodedToken.id;

    // Validate ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({error: "Invalid note ID format"});
    }

    const note = await Note.findOne({_id: id, user: userId});

    if (note) {
      response.json(note);
    } else {
      response.status(404).json({error: "Note not found"});
    }
  } catch (error) {
    next(error);
  }
});

notesRouter.post("/", async (request, response, next) => {
  const {content, important, userId} = request.body;

  if (!content) {
    return response.status(400).json({error: "Content is missing"});
  }

  if (!userId) {
    return response.status(400).json({error: "User ID is missing"});
  }

  try {
    const user = await User.findById(request.decodedToken.id);

    if (!user) {
      return response.status(404).json({error: "User not found"});
    }

    const note = new Note({
      content: content,
      important: important || false,
      user: user.id,
    });

    const savedNote = await note.save();

    user.notes = user.notes.concat(savedNote._id);
    await user.save();

    response.status(201).json(savedNote);
  } catch (error) {
    next(error);
  }
});

notesRouter.delete("/:id", async (request, response, next) => {
  try {
    const {id} = request.params;
    const userId = request.decodedToken.id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({error: "Invalid note ID format"});
    }

    const note = await Note.findOne({_id: id, user: userId});

    if (!note) {
      return response.status(404).json({error: "Note not found"});
    }
    await Note.findByIdAndDelete(id);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

notesRouter.put("/:id", async (request, response, next) => {
  const {content, important} = request.body;
  const {id} = request.params;
  const userId = request.decodedToken.id;

  // validate ID
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return response.status(400).json({error: "Invalid note ID format"});
  }

  if (content === undefined) {
    return response.status(400).json({error: "Content is missing"});
  }

  const note = {
    content,
    important,
  };

  try {
    const updatedNote = await Note.findOneAndUpdate(
      {_id: id, user: userId},
      note,
      {
        new: true,
      }
    );
    if (updatedNote) {
      response.json(updatedNote);
    } else {
      response.status(404).json({error: "Note not found"});
    }
  } catch (error) {
    next(error);
  }
});

module.exports = notesRouter;
