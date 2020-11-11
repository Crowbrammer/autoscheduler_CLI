"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Builder {
    constructor(options) {
        if (!options)
            this.options = {};
    }
    static getInsertId(queryResult) {
        let id;
        // Check if it's PQuery or SQite
        if (Builder.driver.constructor.name === 'PQuery') {
            id = queryResult.insertId;
        }
        else if (Builder.driver.constructor.name === 'Database') {
            id = queryResult.lastID;
        }
        else {
            throw new Error('DB driver not supported yet.');
        }
        return id;
    }
}
exports.default = Builder;
