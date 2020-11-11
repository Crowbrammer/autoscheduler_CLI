"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
const Event_1 = require("../models/Event");
// import * as toSQLDatetime         from 'js-date-to-sql-datetime';
const toSQLDatetime = require('js-date-to-sql-datetime');
const pretty_easy_date_check_1 = require("pretty-easy-date-check");
class EventBuilder extends Builder_1.default {
    static async create(options) {
        if (!options.action || options.action.constructor.name !== 'Action')
            throw new Error('This EventBuilder requires an Action object to build an Event.');
        if (!EventBuilder.isValidDate(options.start))
            throw new Error('This EventBuilder requires a start datetime to build an Event.');
        // Return an object with a summary, start datetime, and end datetime
        const start = toSQLDatetime(options.start);
        const end = EventBuilder.addMinutes(options.action.duration, start);
        const e = new Event_1.default({ summary: options.action.name, start, end });
        // Add it to the db
        const queryResult = await this.driver.query(`INSERT INTO events (summary, start, end) VALUES ('${e.summary}' , '${e.start}', '${e.end}');`);
        e.id = Builder_1.default.getInsertId(queryResult);
        return e;
    }
    static isValidDate(dt) {
        return /** SQL dt string **/ /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dt) || pretty_easy_date_check_1.default(dt) || typeof dt === 'number';
    }
    static addMinutes(mins, dt) {
        // Convert the dt to POSIX
        let dtPosix = new Date(dt).getTime();
        // Add mins in milliseconds to POSIX
        dtPosix += 1000 * 60 * mins;
        // Convert the new POSIX timestamp to a SQL timestamp and return it
        return toSQLDatetime(dtPosix);
    }
}
exports.default = EventBuilder;
