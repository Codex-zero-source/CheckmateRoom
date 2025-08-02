"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeEmit = safeEmit;
const bigintToString_1 = require("./bigintToString");
function safeEmit(socketOrIo, event, data) {
    // Fallback: use JSON.stringify with replacer to catch any missed BigInt
    const replacer = (key, value) => typeof value === 'bigint' ? value.toString() : value;
    const safeData = (0, bigintToString_1.bigintToString)(data);
    try {
        socketOrIo.emit(event, safeData);
    }
    catch (e) {
        // fallback: emit as JSON string if object fails
        socketOrIo.emit(event, JSON.parse(JSON.stringify(data, replacer)));
    }
}
