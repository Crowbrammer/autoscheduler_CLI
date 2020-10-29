"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config({ path: __dirname + '/.env' });
const PQuery = require('prettyquery');
const pQuery = new PQuery({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE });
/** Note: This schedule models the GCal API.**/
class Schedule {
    constructor(tasks, templateId, name, start = Date.now()) {
        this.events = [];
        if (!templateId) {
            throw new Error('Need the id of the template this came from');
        }
        this.templateId = templateId;
        this.tasks = tasks;
        this.startTime = start;
        this.buildEvents();
        this.name = name;
        this.start = start;
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
        event.start.SQLDateTime = this.toSQLDateString(event.start.posix);
        event.start.dateTime = new Date(event.start.posix).toISOString();
        event.start.time = new Date(event.start.posix).toLocaleTimeString();
        event.end = {};
        event.end.posix = startTime + task.duration * 60 * 1000;
        event.end.dateTime = new Date(event.end.posix).toISOString();
        event.end.SQLDateTime = this.toSQLDateString(event.end.posix);
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
    toSQLDateString(posix) {
        const datetime = new Date(posix);
        const sqlDatetime = `${datetime.getFullYear()}-${datetime.getMonth()}-${datetime.getDay()} ${datetime.getHours()}:${datetime.getMinutes()}:${datetime.getSeconds()}`;
        return sqlDatetime;
    }
    async save() {
        // Add all the events
        const scheduleId = (await pQuery.query(`INSERT INTO schedules (name, based_on_template_id) VALUES ('${this.name}', ${this.templateId});`)).insertId;
        for (let i = 0; i < this.events.length; i++) {
            const event = this.events[i];
            const eventId = (await pQuery.query(`INSERT INTO events (summary, start, end, base_action_id) VALUES ('${event.summary}', '${event.start.SQLDateTime}', '${event.end.SQLDateTime}', ${event.base_action_id})`)).insertId;
            await pQuery.insert('schedule_events', ['schedule_id', 'event_id'], [[scheduleId, eventId]]);
        }
        this.id = scheduleId;
    }
}
exports.default = Schedule;
