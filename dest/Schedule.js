"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config({ path: __dirname + '/../.env' });
/** Note: This schedule models the GCal API.**/
class Schedule {
    constructor(options) {
        this.events = [];
        if (!options.driver)
            throw new Error('Specify a db driver');
        if (!options.templateId) {
            throw new Error('Need the id of the template this came from');
        }
        this.driver = options.driver;
        this.templateId = options.templateId;
        this.tasks = options.tasks;
        this.startTime = Date.now() || options.start;
        this.name = options.name;
        this.buildEvents();
    }
    buildEvents() {
        this.events[0] = this.buildEvent(this.startTime, this.tasks[0]);
        for (let i = 1; i < this.tasks.length; i++) {
            const task = this.tasks[i];
            const startPosixTime = this.events[i - 1].end.posix;
            const event = this.buildEvent(startPosixTime, task);
            this.events.push(event);
        }
    }
    buildEvent(startTime, task) {
        let event = {};
        event.start = {};
        event.start.posix = startTime;
        event.start.dateTime = new Date(event.start.posix).toISOString();
        event.start.SQLDateTime = this.toSQLDateString(event.start.dateTime);
        console.log(event.start.SQLDateTime);
        console.log(event.start.dateTime.slice(0, 10), event.start.dateTime.slice(11, 19));
        event.start.time = new Date(event.start.posix).toLocaleTimeString();
        event.end = {};
        event.end.posix = startTime + task.duration * 60 * 1000;
        event.end.dateTime = new Date(event.end.posix).toISOString();
        event.end.SQLDateTime = this.toSQLDateString(event.end.dateTime);
        event.end.time = new Date(event.end.posix).toLocaleTimeString();
        event.summary = task.name;
        event.base_action_id = task.id;
        return event;
    }
    niceDisplay() {
        let niceDisplay;
        if (this.events.length === 0) {
            console.log('No event to display');
        }
        else {
            niceDisplay = new Date(this.start).toLocaleTimeString();
            for (let i = 0; i < this.events.length; i++) {
                const event = this.events[i];
                const eventEndTime = new Date(event.end.posix).toLocaleTimeString();
                niceDisplay += `\n${event.summary}\n${event.end.time}`;
            }
        }
        return niceDisplay;
    }
    toSQLDateString(isoDatetimeString) {
        // const datetime = new Date(posix);
        // const sqlDatetime = `${datetime.getFullYear()}-${datetime.getMonth()}-${datetime.getDay()} ${datetime.getHours()}:${datetime.getMinutes()}:${datetime.getSeconds()}`;
        return `${isoDatetimeString.slice(0, 10)} ${isoDatetimeString.slice(11, 19)}`;
    }
    async save() {
        // Add all the events
        let scheduleId;
        if (this.driver.constructor.name === 'PQuery') {
            scheduleId = (await this.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${this.name}', ${this.templateId}, true);`)).insertId;
        }
        else {
            scheduleId = (await this.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${this.name}', ${this.templateId}, true);`)).lastID;
        }
        for (let i = 0; i < this.events.length; i++) {
            const event = this.events[i];
            let eventId;
            if (this.driver.constructor.name === 'PQuery') {
                eventId = (await this.driver.query(`INSERT INTO events (summary, start, end, base_action_id) VALUES ('${event.summary}', '${event.start.SQLDateTime}', '${event.end.SQLDateTime}', ${event.base_action_id})`)).insertId;
            }
            else {
                eventId = (await this.driver.query(`INSERT INTO events (summary, start, end, base_action_id) VALUES ('${event.summary}', '${event.start.SQLDateTime}', '${event.end.SQLDateTime}', ${event.base_action_id})`)).lastID;
            }
            await this.driver.query(`INSERT INTO schedule_events (schedule_id, event_id) VALUES (${scheduleId}, ${eventId})`);
        }
        this.id = scheduleId;
    }
}
exports.default = Schedule;
