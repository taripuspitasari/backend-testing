const notesRouter = require("express").Router();
const Note = require("../models/note");

notesRouter.get("/", async (request, response) => {
  const notes = await Note.find({});
  response.json(notes);
});

notesRouter.get("/:id", async (request, response, next) => {
  try {
    const {id} = request.params;

    // Validate ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({error: "Invalid note ID format"});
    }

    const note = await Note.findById(id);

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
  const {content, important} = request.body;

  if (!content) {
    return response.status(400).json({error: "Content is missing"});
  }

  const note = new Note({
    content,
    important: important || false,
  });

  try {
    const savedNote = await note.save();
    response.status(201).json(savedNote);
  } catch (error) {
    next(error);
  }
});

notesRouter.delete("/:id", async (request, response, next) => {
  try {
    const {id} = request.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return response.status(400).json({error: "Invalid note ID format"});
    }

    const note = await Note.findById(id);

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
    const updatedNote = await Note.findByIdAndUpdate(id, note, {
      new: true,
    });
    response.json(updatedNote);
  } catch (error) {
    next(error);
  }
});

module.exports = notesRouter;
