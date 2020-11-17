"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ScheduleBuilder_1 = require("../builders/ScheduleBuilder");
const Template_1 = require("../models/Template");
const Schedule_1 = require("../models/Schedule");
const ActionBuilder_1 = require("../builders/ActionBuilder");
const TemplateBuilder_1 = require("../builders/TemplateBuilder");
class TemplateController {
    async create() {
        // Create a template with the given arguments and return it 
        const template = await new Template_1.default().getCurrentTemplate();
        const schedule = await ScheduleBuilder_1.default.create({ template, markAsCurrent: true });
        return `${schedule.name}
${schedule.niceDisplay()}`;
    }
    async retrieve() {
        const schedule = new Schedule_1.default({ toGetCurrent: true });
        await schedule.getCurrentSchedule();
        return `${schedule.name}
${schedule.niceDisplay()}`;
    }
    async update(data) {
        if (/\D+/.test(data[0]))
            throw new Error('When updating the schedule, the first arg after \'us\' needs to be a number.');
        // Get the current template
        const t = new Template_1.default();
        await t.getCurrentTemplate();
        // Get the current actions
        const actions = await t.getActions();
        // Make a new current template;
        const template = await TemplateBuilder_1.default.create({ ...t, markAsCurrent: true });
        // Get all the actions at position -1 and beyond
        // Build a new template from this
        for (let i = data[0] - 1; i < actions.length; i++) {
            const action = await ActionBuilder_1.default.create(actions[i]);
            await template.link(action);
        }
        // Create a new schedule using this
        const s = await ScheduleBuilder_1.default.create({ template, markAsCurrent: true });
        // Make a pretty message
        let msg = `${s.name}:\n`;
        msg += `\n${s.events[0].milStart()}`;
        for (let i = 0; i < s.events.length; i++) {
            const event = s.events[i];
            msg += `\n${event.summary}`;
            msg += `\n${event.milEnd()}`;
        }
        return msg;
    }
    async delete() { }
}
exports.default = TemplateController;
