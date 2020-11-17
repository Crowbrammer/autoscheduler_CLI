import Controller from './Controller';
import ScheduleBuilder from '../builders/ScheduleBuilder';
import Template from '../models/Template';
import Schedule from '../models/Schedule';
import Action from '../models/Action';
import ActionBuilder from '../builders/ActionBuilder';
import TemplateBuilder from '../builders/TemplateBuilder';
import Builder from '../builders/Builder';

export default class TemplateController implements Controller {
    async create() {
        // Create a template with the given arguments and return it 
        const template = await new Template().getCurrentTemplate();
        const schedule = await ScheduleBuilder.create({template, markAsCurrent: true});
        return `${schedule.name}
${schedule.niceDisplay()}`
    }
    async retrieve() {
        const schedule = new Schedule({toGetCurrent: true});
        await schedule.getCurrentSchedule();
        return `${schedule.name}
${schedule.niceDisplay()}`
    }

    async update(data) {
        if (/\D+/.test(data[0])) 
            throw new Error('When updating the schedule, the first arg after \'us\' needs to be a number.');

        // Get the current template
        const t = new Template();
        await t.getCurrentTemplate();
        // Get the current actions
        const actions = await t.getActions();
        // Make a new current template;
        const template = await TemplateBuilder.create({...t, markAsCurrent: true});
        // Get all the actions at position -1 and beyond
        // Build a new template from this
        for (let i = data[0] - 1; i < actions.length; i++) {
            const action = await ActionBuilder.create(actions[i]);
            await template.link(action);
        }
        // Create a new schedule using this
        const s = await ScheduleBuilder.create({template, markAsCurrent: true});
        // Make a pretty message
        let msg = `${s.name}:\n`
        msg += `\n${s.events[0].milStart()}`;
        for (let i = 0; i < s.events.length; i++) {
            const event = s.events[i];
            msg += `\n${event.summary}`;
            msg += `\n${event.milEnd()}`;
        }
        return msg;

    }

    async delete() {}
}