"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const auth_middleware_1 = require("./middlewares/auth.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const note_routes_1 = __importDefault(require("./routes/note.routes"));
const focus_routes_1 = __importDefault(require("./routes/focus.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const quote_routes_1 = __importDefault(require("./routes/quote.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 公开路由（无需认证）
app.use('/api/auth', auth_routes_1.default);
// 受保护路由（需要 JWT）
app.use('/api/notes', auth_middleware_1.authenticate, note_routes_1.default);
app.use('/api/focus-sessions', auth_middleware_1.authenticate, focus_routes_1.default);
app.use('/api/tasks', auth_middleware_1.authenticate, task_routes_1.default);
app.use('/api/quote', auth_middleware_1.authenticate, quote_routes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map