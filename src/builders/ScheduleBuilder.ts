import Builder from './Builder';
import Schedule from '../models/Schedule';
import Template from '../models/Template';

export default class ScheduleBuilder extends Builder {
    constructor(options) {
        super(options);
    }

    static async create(options: {template: Template, setAsCurrent?: boolean}) {
        if (!options)
            throw new Error('No options set. At minimum, an object with a template: Template property is required');
        if (!options.template || options.template.constructor.name !== 'Template') {
            throw new Error('This ScheduleBuilder require a Template object to build a Schedule.');
        }
        const s = new Schedule({template: options.template, setAsCurrent: options.setAsCurrent});
        // Add it to the db
        await s.save(true);
        await s.buildEvents();
        return s
    }
}