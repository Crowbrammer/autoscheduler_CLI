import Builder                    from './Builder';
import Event                      from '../models/Event';
import Action                     from '../models/Action';
// import * as toSQLDatetime         from 'js-date-to-sql-datetime';
const toSQLDatetime = require('js-date-to-sql-datetime');
import { default as isValidDate } from 'pretty-easy-date-check';

export default class EventBuilder extends Builder {
    static async create(options: {action: Action, start: any}) {
        if (!options.action || options.action.constructor.name !== 'Action')
            throw new Error('This EventBuilder requires an Action object to build an Event.');
        if (!EventBuilder.isValidDate(options.start))
            throw new Error('This EventBuilder requires a start datetime to build an Event.');

        // Return an object with a summary, start datetime, and end datetime
        const start = toSQLDatetime(options.start);
        const end   = EventBuilder.addMinutes(options.action.duration, start);
        const e     = new Event({ summary: options.action.name, start, end });

        // Add it to the db
        const queryResult = await this.driver.query(`INSERT INTO events (summary, start, end) VALUES ('${e.summary}' , '${e.start}', '${e.end}');`);
        e.id = Builder.getInsertId(queryResult);

        return e
    }

    static isValidDate(dt) {
        return /** SQL dt string **/ /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dt) || isValidDate(dt) || typeof dt === 'number';
    }

    static addMinutes(mins: number, dt: any) {
        // Convert the dt to POSIX
        let dtPosix = new Date(dt).getTime();
        // Add mins in milliseconds to POSIX
        dtPosix += 1000 * 60 * mins;
        // Convert the new POSIX timestamp to a SQL timestamp and return it
        return toSQLDatetime(dtPosix);
    }
}
