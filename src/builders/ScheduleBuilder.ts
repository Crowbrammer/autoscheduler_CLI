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
        await s.buildEvents();

        // Add it to the db
        const queryResult = await Builder.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${s.name}' , '${s.template.id}', ${options.setAsCurrent ? true : false});`);
        s.id = Builder.getInsertId(queryResult);

        return s
    }
}

function clog(message) {
    console.log(message);
}