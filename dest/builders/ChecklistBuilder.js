"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
const Checklist_1 = require("../models/Checklist");
class ChecklistBuilder extends Builder_1.default {
    static async create(options) {
        if (!options.name)
            throw new Error('Add a name to build a Checklist.');
        // Insert it into the db, tracking the Id;
        const query = await Builder_1.default.driver.query(`INSERT INTO checklists (name) VALUES ('${options.name}');`);
        let id = Builder_1.default.getInsertId(query);
        return new Checklist_1.default({ id, name: options.name });
    }
}
exports.default = ChecklistBuilder;
