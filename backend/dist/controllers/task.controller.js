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
exports.toggle = toggle;
exports.stats = stats;
const taskService = __importStar(require("../services/task.service"));
function paramId(req) {
    return req.params.id;
}
async function create(req, res) {
    if (!req.body.title) {
        return res.status(400).json({ error: 'title is required' });
    }
    const task = await taskService.createTask({ ...req.body, userId: req.userId });
    res.status(201).json(task);
}
async function list(req, res) {
    const filters = {};
    if (req.query.type)
        filters.type = req.query.type;
    if (req.query.completed !== undefined) {
        filters.completed = req.query.completed === 'true';
    }
    const tasks = await taskService.listTasks(req.userId, filters);
    res.json(tasks);
}
async function getById(req, res) {
    const task = await taskService.getTaskById(paramId(req), req.userId);
    if (!task)
        return res.status(404).json({ error: 'Task not found' });
    res.json(task);
}
async function update(req, res) {
    const task = await taskService.updateTask(paramId(req), req.userId, req.body);
    if (!task)
        return res.status(404).json({ error: 'Task not found' });
    res.json(task);
}
async function remove(req, res) {
    const deleted = await taskService.deleteTask(paramId(req), req.userId);
    if (!deleted)
        return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
}
async function toggle(req, res) {
    const task = await taskService.toggleTask(paramId(req), req.userId);
    if (!task)
        return res.status(404).json({ error: 'Task not found' });
    res.json(task);
}
async function stats(req, res) {
    const s = await taskService.getTaskStats(req.userId);
    res.json(s);
}
//# sourceMappingURL=task.controller.js.map