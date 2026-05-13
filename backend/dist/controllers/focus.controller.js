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
exports.todayStats = todayStats;
const focusService = __importStar(require("../services/focus.service"));
function paramId(req) {
    return req.params.id;
}
async function create(req, res) {
    const session = await focusService.createSession({
        duration: req.body.duration,
        userId: req.userId,
    });
    res.status(201).json(session);
}
async function list(req, res) {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const sessions = await focusService.listSessions(req.userId, limit, offset);
    res.json(sessions);
}
async function getById(req, res) {
    const session = await focusService.getSessionById(paramId(req), req.userId);
    if (!session)
        return res.status(404).json({ error: 'Session not found' });
    res.json(session);
}
async function update(req, res) {
    const session = await focusService.updateSession(paramId(req), req.userId, req.body);
    if (!session)
        return res.status(404).json({ error: 'Session not found' });
    res.json(session);
}
async function remove(req, res) {
    const deleted = await focusService.deleteSession(paramId(req), req.userId);
    if (!deleted)
        return res.status(404).json({ error: 'Session not found' });
    res.status(204).send();
}
async function todayStats(req, res) {
    const stats = await focusService.getTodayStats(req.userId);
    res.json(stats);
}
//# sourceMappingURL=focus.controller.js.map