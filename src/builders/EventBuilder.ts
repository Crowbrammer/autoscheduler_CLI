import Builder from './Builder';
import Event from '../models/Event';

export default class EventBuilder extends Builder {
    static async create(options: {summary: string, start: any, end: any, scheduleId: number | string}) {
        if (!options.summary)
            throw new Error('Add a summary to build an Event.');
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}}$/.test(options.start))
            throw new Error('Your start time needs to be a SQL-friendly datetime.')
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}}$/.test(options.end))
            throw new Error('Your end time needs to be a SQL-friendly datetime.')
        // Add it to the db
        const queryResult = await this.driver.query(`INSERT INTO events (summary, start, end) VALUES ('${options.summary}' , '${options.start}', '${options.end}');`);
        const id = Builder.getInsertId(queryResult);
        // Return an object with a summary, start datetime, and end datetime
        return new Event({id, summary: options.summary, start: options.start, end: options.end});
    }
}
