"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
const Schedule_1 = require("../models/Schedule");
class ScheduleBuilder extends Builder_1.default {
    constructor(options) {
        super(options);
    }
    static async create(options) {
        if (!options)
            throw new Error('No options set. At minimum, an object with a template: Template property is required');
        if (!options.template || options.template.constructor.name !== 'Template') {
            throw new Error('This ScheduleBuilder require a Template object to build a Schedule.');
        }
        const s = new Schedule_1.default({ template: options.template, setAsCurrent: options.setAsCurrent });
        // Add it to the db
        await s.save(options.setAsCurrent ? true : false);
        await s.buildEvents();
        return s;
    }
}
exports.default = ScheduleBuilder;
