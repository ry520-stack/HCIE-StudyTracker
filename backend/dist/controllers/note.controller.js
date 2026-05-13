"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.getById = getById;
exports.update = update;
exports.remove = remove;
exports.review = review;
exports.getDue = getDue;
exports.getHealth = getHealth;
const noteService = __importStar(require("../services/note.service"));
function paramId(req) {
    return req.params.id;
}
async function create(req, res) {
    const { title, content, tags } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'title and content are required' });
    }
    const note = await noteService.createNote({ title, content, tags, userId: req.userId });
    res.status(201).json(note);
}
async function list(req, res) {
    const tag = req.query.tag;
    const notes = await noteService.listNotes(req.userId, tag);
    res.json(notes);
}
async function getById(req, res) {
    const note = await noteService.getNoteById(paramId(req), req.userId);
    if (!note)
        return res.status(404).json({ error: 'Note not found' });
    res.json(note);
}
async function update(req, res) {
    const note = await noteService.updateNote(paramId(req), req.userId, req.body);
    if (!note)
        return res.status(404).json({ error: 'Note not found' });
    res.json(note);
}
async function remove(req, res) {
    const deleted = await noteService.deleteNote(paramId(req), req.userId);
    if (!deleted)
        return res.status(404).json({ error: 'Note not found' });
    res.status(204).send();
}
async function review(req, res) {
    const note = await noteService.reviewNote(paramId(req), req.userId);
    if (!note)
        return res.status(404).json({ error: 'Note not found' });
    res.json(note);
}
async function getDue(req, res) {
    const notes = await noteService.getDueNotes(req.userId);
    res.json(notes);
}
async function getHealth(req, res) {
    const health = await noteService.getNoteHealth(paramId(req), req.userId);
    if (!health)
        return res.status(404).json({ error: 'Note not found' });
    res.json(health);
}
//# sourceMappingURL=note.controller.js.map