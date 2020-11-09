"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
const Action_1 = require("../models/Action");
class ActionBuilder extends Builder_1.default {
    static async create(options) {
        if (!options.duration)
            throw new Error('Add a duration to build an Action.');
        if (!options.name)
            throw new Error('Add a name to build an Action.');
        // Insert it into the db, tracking the Id;
        const query = await Builder_1.default.driver.query(`INSERT INTO actions (name, duration) VALUES ('${options.name}', ${options.duration});`);
        let id = Builder_1.default.getInsertId(query);
        return new Action_1.default({ id, name: options.name, duration: options.duration });
    }
}
exports.default = ActionBuilder;
