import { AutoschedulerModel } from "./Model";
import Event from "./Event";
// import toSQLDate from 'js-date-to-sql-datetime';
const toSQLDatetime = require('js-date-to-sql-datetime');

require('dotenv').config({path: __dirname + '/../.env'});
type Id = number | string;

/** Note: This schedule models the GCal API.**/
export default class Schedule extends AutoschedulerModel{
    id;
    name;
    actions;
    startTime;
    events = [];
    start: number;
    templateId: Id;
    driver: any;
    constructor(options) {
      super(options);
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
      this.events[0] = this.buildEvent(this.startTime, this.actions[0]);
      for (let i = 1; i < this.actions.length; i++) {
        const action = this.actions[i];
        const startPosixTime = this.events[i-1].end.posix;
        const event = this.buildEvent(startPosixTime, action);
        this.events.push(event);
      }
    }
    
    buildEvent(startTime, action) {
      let event               = new Event();
      event.start             = {};
      event.start.posix       = startTime;
      event.start.dateTime    = new Date(event.start.posix).toLocaleString();
      // console.log(event.start.dateTime.slice(0, 10), event.start.dateTime.slice(11, 19));
      event.start.time        = new Date(event.start.posix).toLocaleTimeString();
      event.end               = {};
      event.end.posix         = startTime + action.duration * 60 * 1000;
      event.end.dateTime      = new Date(event.end.posix).toLocaleString();
      event.end.time          = new Date(event.end.posix).toLocaleTimeString();
      event.summary           = action.name;
      event.base_action_id    = action.id;
      return event;
    }

    niceDisplay() {
      let niceDisplay;
      if (this.events.length === 0) {
        console.log('No event to display')
      } else {
        niceDisplay = new Date(this.start).toLocaleTimeString();
        for (let i = 0; i < this.events.length; i++) {
          const event = this.events[i];
          const eventEndTime = new Date(event.end.posix).toLocaleTimeString();
          niceDisplay += `\n${event.summary}\n${event.end.time}`
        }
      }
      return niceDisplay;
    }

    async save() {
      // Add all the events
      let scheduleId;
        
      if (AutoschedulerModel.driver.constructor.name === 'PQuery') {

        scheduleId = (await AutoschedulerModel.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${this.name}', ${this.templateId}, true);`)).insertId;
  
      } else {

        scheduleId = (await AutoschedulerModel.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${this.name}', ${this.templateId}, true);`)).lastID;
      
      }

      for (let i = 0; i < this.events.length; i++) {

        const event = this.events[i];
        let eventId

        if (AutoschedulerModel.driver.constructor.name === 'PQuery') {

          eventId = (await AutoschedulerModel.driver.query(`INSERT INTO events (summary, start, end, base_action_id) VALUES ('${event.summary}', '${toSQLDatetime(event.start.posix)}', '${toSQLDatetime(event.end.posix)}', ${event.base_action_id})`)).insertId;

        } else {

          eventId = (await AutoschedulerModel.driver.query(`INSERT INTO events (summary, start, end, base_action_id) VALUES ('${event.summary}', '${toSQLDatetime(event.start.posix)}', '${toSQLDatetime(event.end.posix)}', ${event.base_action_id})`)).lastID;
          
        }

        await AutoschedulerModel.driver.query(`INSERT INTO schedule_events (schedule_id, event_id) VALUES (${scheduleId}, ${eventId})`);

      }

      this.id = scheduleId;
      return this;
    }
}