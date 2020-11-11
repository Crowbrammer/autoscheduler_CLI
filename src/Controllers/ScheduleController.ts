import Controller from './Controller';
import ScheduleBuilder from '../builders/ScheduleBuilder';
import Template from '../models/Template';
import Schedule from '../models/Schedule';

export default class TemplateController implements Controller {
    async create() {
        // Create a template with the given arguments and return it 
        const template = await new Template().getCurrentTemplate();
        const schedule = await ScheduleBuilder.create({template, setAsCurrent: true});
        return `${schedule.name}
${schedule.niceDisplay()}`
    }
    async retrieve() {
        const schedule = new Schedule({toGetCurrent: true});
        await schedule.getCurrentSchedule();
        return `${schedule.name}
${schedule.niceDisplay()}`
    }
    async update() {}
    async delete() {}
}