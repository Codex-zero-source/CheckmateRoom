"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeEmit = safeEmit;
const bigintToString_1 = require("../../shared/bigintToString");
function safeEmit(socketOrIo, event, data) {
    socketOrIo.emit(event, (0, bigintToString_1.bigintToString)(data));
}
