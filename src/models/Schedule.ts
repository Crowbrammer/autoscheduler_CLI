import { config }             from 'dotenv';
import { AutoschedulerModel } from "./Model";
import Event                  from "./Event";
import * as toSQLDatetime     from 'js-date-to-sql-datetime';
import Template               from './Template';
import EventBuilder from '../builders/EventBuilder';
import Builder from '../builders/Builder';

config({path: __dirname + '/../.env'});

type Id = number | string;

export default class Schedule extends AutoschedulerModel{

    name;
    start: number; 
    events = []; 
    template: Template;
    constructor(options) {
      super(options);
      if (options.toGetCurrent)
        return;
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

      for (let i = 0; i < this.events.length; i++) {
        const event = this.events[i];
        await this.link(event);
      }

    }
    
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
      } else {
        if (currentSchedule.length > 1) 
          console.log('Multiple schedules set as current.'); // This one'll bite me later.
        this.id = currentSchedule[0].id;
        this.name = currentSchedule[0].name;
        this.templateId = currentSchedule[0].based_on_template_id;
        await this.getEvents();
      }
      return this;
    }

    async getEvents() {
      const pulledEvents = await this.driver.query(`SELECT * FROM schedule_events se INNER JOIN events e ON se.event_id = e.id WHERE schedule_id = ${this.id} ORDER BY order_num`);
      return this.events = pulledEvents.map(e => new Event(e));
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

      return (await this.driver.query(`SELECT id FROM schedules WHERE id = ${this.id}`)).length > 0;

    }

    async markAsCurrent() {

      if ( !this.id )
          throw new Error('This method requires an id to use.');
      
      if ( !( await this.exists() ) ) 
          throw new Error('This schedule\'s id doesn\'t exist in the schedules table.');

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
        niceDisplay = this.events[0].milStart();
        for (let i = 0; i < this.events.length; i++) {
          const event = this.events[i];
          niceDisplay += `\n${event.summary}\n${event.milEnd()}`
        }
      }
      return niceDisplay;
    }
    
    async save(setAsCurrent) {
      const queryResult = await this.driver.query(`INSERT INTO schedules (name, based_on_template_id, is_current) VALUES ('${this.name}' , '${this.template.id}', ${setAsCurrent ? true : false});`);
      this.id = Builder.getInsertId(queryResult);
      if (setAsCurrent)
        await this.markAsCurrent();
    }

}