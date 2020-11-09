"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = require("./Model");
const Event_1 = require("./Event");
// import toSQLDate from 'js-date-to-sql-datetime';
const toSQLDatetime = require('js-date-to-sql-datetime');
require('dotenv').config({ path: __dirname + '/../.env' });
/** Note: This schedule models the GCal API.**/
class Schedule extends Model_1.AutoschedulerModel {
    constructor(options) {
        super(options);
        this.events = [];
        if (!options.templateId) {
            throw new Error('Need the id of the template this came from');
        }
        this.templateId = options.templateId;
        this.actions = options.actions;
        this.startTime = Date.now() || options.start;
        this.name = options.name;
        this.buildEvents();
    }
    buildEvents() {
        if (!this.actions || this.actions.length === 0)
            return this.events = [];
        this.events[0] = this.buildEvent(this.startTime, this.actions[0]);
        for (let i = 1; i < this.actions.length; i++) {
            const action = this.actions[i];
            const startPosixTime = this.events[i - 1].end.posix;
            const event = this.buildEvent(startPosixTime, action);
            this.events.push(event);
        }
    }
    buildEvent(startTime, action) {
        let event = new Event_1.default();
        event.start = {};
        event.start.posix = startTime;
        event.start.dateTime = new Date(event.start.posix).toLocaleString();
        event.start.time = new Date(event.start.posix).toLocaleTimeString();
        event.end = {};
        event.end.posix = startTime + action.duration * 60 * 1000;
        event.end.dateTime = new Date(event.end.posix).toLocaleString();
        event.end.time = new Date(event.end.posix).toLocaleTimeString();
        event.summary = action.name;
        event.base_action_id = action.id;
        return event;
    }
    async checkLink(obj) {
        if (!this.id)
            throw new Error('Attach an id to this Schedule object check for links.');
        if (!obj.id)
            throw new Error('Attach an id to the object for which you\'re checking for links.');
        switch (obj.constructor.name) {
            case 'Event':
                // Check the schedule_events table for an entry connecting it
                const link = await this.driver.query(`SELECT schedule_id, event_id FROM schedule_events WHERE schedule_id = ${this.id} AND event_id = ${obj.id}`);
                // If it's there (> 0), return the query;
                // If it's not there, return null
                return link.length === 1 ? link[0] : null;
            default:
                break;
        }
    }
    async isCurrent() {
        if (!this.id)
            throw new Error('This method requires that this Schedule object have an id.');
        // Select the current things...
        const currentSchedules = await this.driver.query(`SELECT id FROM schedules WHERE is_current = true`);
        // Error if there's more than one
        if (currentSchedules.length > 1)
            throw new Error(`There\'s more than one current schedule: ${currentSchedules}`);
        // If the id of the current schedule matches, return true. Else return false.
        return currentSchedules[0].id === this.id;
    }
    async markAsCurrent() {
        if (!this.id)
            throw new Error('This method requires an id to use.');
        const pullWhereThisId = await this.driver.query(`SELECT id FROM schedules WHERE id = ${this.id}`);
        if (pullWhereThisId.length === 0)
            throw new Error('This checklist\'s id doesn\'t exist in the schedules table.');
        await this.driver.query('UPDATE schedules SET is_current = false');
        return await this.driver.query(`UPDATE schedules SET is_current = true WHERE id = ${this.id}`);
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
    async save() {
        // Add all the events
        let scheduleId;
        if (Model_1.AutoschedulerModel.driver.constructor.name === 'PQuery') {
            scheduleId = (await Model_1.AutoschedulerModel.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${this.name}', ${this.templateId}, false);`)).insertId;
        }
        else {
            scheduleId = (await Model_1.AutoschedulerModel.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${this.name}', ${this.templateId}, false);`)).lastID;
        }
        for (let i = 0; i < this.events.length; i++) {
            const event = this.events[i];
            let eventId;
            if (Model_1.AutoschedulerModel.driver.constructor.name === 'PQuery') {
                eventId = (await Model_1.AutoschedulerModel.driver.query(`INSERT INTO events (summary, start, end, base_action_id) VALUES ('${event.summary}', '${toSQLDatetime(event.start.posix)}', '${toSQLDatetime(event.end.posix)}', ${event.base_action_id})`)).insertId;
            }
            else {
                eventId = (await Model_1.AutoschedulerModel.driver.query(`INSERT INTO events (summary, start, end, base_action_id) VALUES ('${event.summary}', '${toSQLDatetime(event.start.posix)}', '${toSQLDatetime(event.end.posix)}', ${event.base_action_id})`)).lastID;
            }
            await Model_1.AutoschedulerModel.driver.query(`INSERT INTO schedule_events (schedule_id, event_id) VALUES (${scheduleId}, ${eventId})`);
        }
        this.id = scheduleId;
        return this;
    }
}
exports.default = Schedule;
