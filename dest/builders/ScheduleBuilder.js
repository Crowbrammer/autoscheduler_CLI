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
        await s.buildEvents();
        // Add it to the db
        const queryResult = await Builder_1.default.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${s.name}' , '${s.template.id}', ${options.setAsCurrent ? true : false});`);
        s.id = Builder_1.default.getInsertId(queryResult);
        return s;
    }
}
exports.default = ScheduleBuilder;
function clog(message) {
    console.log(message);
}
