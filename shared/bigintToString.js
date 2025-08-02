"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigintToString = bigintToString;
// Utility to deeply convert all BigInt values in an object to strings
function bigintToString(obj) {
    if (Array.isArray(obj)) {
        return obj.map(bigintToString);
    }
    else if (obj instanceof Set) {
        return Array.from(obj).map(bigintToString);
    }
    else if (obj instanceof Map) {
        return Array.from(obj.entries()).reduce((acc, [k, v]) => {
            acc[k] = bigintToString(v);
            return acc;
        }, {});
    }
    else if (obj && typeof obj === 'object') {
        const res = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'bigint') {
                res[key] = value.toString();
            }
            else {
                res[key] = bigintToString(value);
            }
        }
        return res;
    }
    return obj;
}
