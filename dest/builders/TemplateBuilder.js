"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
const Template_1 = require("../models/Template");
class TemplateBuilder extends Builder_1.default {
    static async create(options) {
        // Insert it into the db, tracking the Id;
        const query = await Builder_1.default.driver.query(`INSERT INTO schedule_templates (name) VALUES ('${options.name}');`);
        let id = Builder_1.default.getInsertId(query);
        const template = new Template_1.default({ id, name: options.name ? options.name : '' });
        if (options.markAsCurrent)
            await template.markAsCurrent();
        return template;
    }
}
exports.default = TemplateBuilder;
