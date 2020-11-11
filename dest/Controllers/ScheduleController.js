"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ScheduleBuilder_1 = require("../builders/ScheduleBuilder");
const Template_1 = require("../models/Template");
const Schedule_1 = require("../models/Schedule");
class TemplateController {
    async create() {
        // Create a template with the given arguments and return it 
        const template = await new Template_1.default().getCurrentTemplate();
        const schedule = await ScheduleBuilder_1.default.create({ template, setAsCurrent: true });
        return `${schedule.name}
${schedule.niceDisplay()}`;
    }
    async retrieve() {
        const schedule = new Schedule_1.default({ toGetCurrent: true });
        await schedule.getCurrentSchedule();
        return `${schedule.name}
${schedule.niceDisplay()}`;
    }
    async update() { }
    async delete() { }
}
exports.default = TemplateController;
