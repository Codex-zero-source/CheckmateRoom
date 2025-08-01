// Utility to deeply convert all BigInt values in an object to strings
export function bigintToString(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(bigintToString);
    } else if (obj instanceof Set) {
        return Array.from(obj).map(bigintToString);
    } else if (obj instanceof Map) {
        return Array.from(obj.entries()).reduce((acc, [k, v]) => {
            acc[k] = bigintToString(v);
            return acc;
        }, {} as any);
    } else if (obj && typeof obj === 'object') {
        const res: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'bigint') {
                res[key] = value.toString();
            } else {
                res[key] = bigintToString(value);
            }
        }
        return res;
    }
    return obj;
}
