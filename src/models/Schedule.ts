import { config }             from 'dotenv';
import { AutoschedulerModel } from "./Model";
import Event                  from "./Event";
import * as toSQLDatetime     from 'js-date-to-sql-datetime';
import Template               from './Template';
import EventBuilder from '../builders/EventBuilder';

config({path: __dirname + '/../.env'});

type Id = number | string;

export default class Schedule extends AutoschedulerModel{

    name;
    start: number; 
    events = []; 
    template: Template;
    constructor(options) {
      super(options);
      this.template = options.template;
      this.start = Date.now() || options.start;
      this.name = options.template.name; 
    }
    
    // This should be on the ScheduleBuilder...
    async buildEvents() {
      // Get the actions from the template;
      const as = await this.template.getActions();
      
      if (as.length === 0) 
          return this.events = [];

      // Build the first event with the action and now as the start time.
      this.events = [await EventBuilder.create({action: as[0], start: this.start})];

      // Build the rest of the this.events in order, using the previous event's end time as the start.
      for (let i = 1; i < as.length; i++) {
        const action = as[i];
        this.events.push(await EventBuilder.create({action, start: this.events[i-1].end}))
      }

      // Set it as this Schedule object's events property.

      // Build an event with the action... using the last event 


      // Make sure the template has its actions...
      // Refer to the templates actions...
      // this.events[0] = this.buildEvent(this.start, this.actions[0]);
      // for (let i = 1; i < this.actions.length; i++) {
      //   const action = this.actions[i];
      //   const startPosixTime = this.events[i-1].end.posix;
      //   const event = this.buildEvent(startPosixTime, action);
      //   this.events.push(event);
      // }
    }
    
    // This should be on the EventBuilder...
    // buildEvent(startTime, action) {
    //   let event               = new Event();
    //   event.start             = {};
    //   event.start.posix       = startTime;
    //   event.start.dateTime    = new Date(event.start.posix).toLocaleString();
    //   event.start.time        = new Date(event.start.posix).toLocaleTimeString();
    //   event.end               = {};
    //   event.end.posix         = startTime + action.duration * 60 * 1000;
    //   event.end.dateTime      = new Date(event.end.posix).toLocaleString();
    //   event.end.time          = new Date(event.end.posix).toLocaleTimeString();
    //   event.summary           = action.name;
    //   event.base_action_id    = action.id;
    //   return event;
    // }

    async hasLinkWith(obj) {
      if (!this.id) 
        throw new Error('Attach an id to this Schedule object check for links.');
      if (!obj.id) 
        throw new Error('Attach an id to the object for which you\'re checking for links.');
      switch (obj.constructor.name) {
        case 'Event':
          // Check the schedule_events table for an entry connecting it
          const links = await this.driver.query(`SELECT schedule_id, event_id, order_num FROM schedule_events WHERE schedule_id = ${this.id} AND event_id = ${obj.id}`);
          // If it's there (> 0), return the query;
          // If it's not there, return null
          return links.length > 0 ? links[0] : null;
      
        default:
          break;
      }
    }

    async getCurrentSchedule() {
      const currentSchedule = await this.driver.query(`SELECT * FROM schedules WHERE is_current = true ORDER BY id DESC;`);
      if (currentSchedule.length === 0) {
          throw new Error('No schedule set as current.');
      } else if (currentSchedule.length > 1) {
          console.log('Multiple schedules set as current.'); // This one'll bite me later.
      } else {
          this.id = currentSchedule[0].id;
          this.name = currentSchedule[0].name;
          this.templateId = currentSchedule[0].based_on_template_id;
      }
      return this;
    }

    async getEvents() {
      const pulledEvents = await this.driver.query(`SELECT * FROM schedule_events se INNER JOIN events e ON se.event_id = e.id WHERE schedule_id = ${this.id} ORDER BY order_num`);
      return pulledEvents.map(e => new Event(e));
    }

    async isCurrent() {

      if ( !this.id )
        throw new Error('This method requires that this Schedule object have an id.')

      // Select the current things...
      const currentSchedules = await this.driver.query(`SELECT id FROM schedules WHERE is_current = true`);

      // Error if there's more than one
      if ( currentSchedules.length > 1 )
        console.log(`There\'s more than one current schedule: ${ currentSchedules }`);
        
      // If the id of the current schedule matches, return true. Else return false.
      return currentSchedules[0].id === this.id;
    }

    async exists() {

      return (await this.driver.query(`SELECT id FROM schedules WHERE id = ${this.id}`)).length === 0;

    }

    async markAsCurrent() {

      if ( !this.id )
          throw new Error('This method requires an id to use.');
      
      if ( !( await this.exists() ) ) 
          throw new Error('This checklist\'s id doesn\'t exist in the schedules table.');

      await this.driver.query('UPDATE schedules SET is_current = false');
      return await this.driver.query(`UPDATE schedules SET is_current = true WHERE id = ${this.id}`);

    }

    async link(obj) {
      switch ( obj.constructor.name ) {
          case 'Event':
            const existingLink = await this.hasLinkWith(obj);
            if (existingLink)
              return existingLink;

            await this.driver.query(`INSERT INTO schedule_events (schedule_id, event_id) VALUES (${this.id}, ${obj.id});`);
            const link = await this.driver.query(`SELECT * FROM schedule_events WHERE schedule_id = ${this.id} AND event_id = ${obj.id}`);

            if (!(await this.hasLinkWith(obj))) 
              throw new Error('Link function not adding the link');

            return link.length === 1 ? link[0] : null;
      
          default:
              break;
      }
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

    async save(isCurrent: boolean) {
      // Add all the events
      let scheduleId;
      if (isCurrent)
        await AutoschedulerModel.driver.query('UPDATE schedules SET is_current = false;');
        
      if (AutoschedulerModel.driver.constructor.name === 'PQuery') {

        scheduleId = (await AutoschedulerModel.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${this.name}', ${this.templateId}, ${isCurrent ? true : false});`)).insertId;
  
      } else {

        scheduleId = (await AutoschedulerModel.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${this.name}', ${this.templateId}, ${isCurrent ? true : false});`)).lastID;
      
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