const sqlite3  = require('sqlite3');
const { open } = require('sqlite');
const { expect } = require('chai');
const Builder = require('../../builders/Builder').default;
const EventBuilder = require('../../builders/EventBuilder').default;
const TemplateBuilder = require('../../builders/TemplateBuilder').default;
const ChecklistBuilder = require('../../builders/ChecklistBuilder').default;
const ActionBuilder = require('../../builders/ActionBuilder').default;
const ScheduleBuilder = require('../../builders/ScheduleBuilder').default;
const { AutoschedulerModel } = require('../../models/Model');
const { default: Action } = require('../../models/Action');

describe('Builders build', async function() {

    let sqliteInstance;

    before(async function() {

        sqliteInstance = await open({
            filename: __dirname + '/../../db/sqlite/database.db',
            driver: sqlite3.Database
        });

        sqliteInstance.query = function (query) {
            if (/INSERT/.test(query)) {
                return this.run(query);
            } else {
                return this.all(query);
            }
        }

        Builder.driver = sqliteInstance;
        AutoschedulerModel.driver = sqliteInstance;
        
    });

    describe('Creates an event', async function() {
        // After: I run the builder without an action object.
        // Then:
        it ('Returns an error if no action object passed', async function () {
            const errMsg = await EventBuilder.create({start: new Date()}).catch(err => err.message);
            expect(errMsg).to.equal('This EventBuilder requires an Action object to build an Event.');
        })

        // After: I run the builder without a start time.
        // Then:
        it ('Returns an error if no start datetime is passed', async function () {
            // Create an Action, mn
            const action = new Action({name: 'Foo', duration: 69});
            
            // Pass it into EventBuilder.create without a start date.
            // Catch its message and expect it to be an error.
            const errMsg = await EventBuilder.create({action}).catch(err => err.message);
            expect(errMsg).to.equal('This EventBuilder requires a start datetime to build an Event.');
        })

        // After: I run addMinutes, it 
        // Then:
        it('copies a datetime, adds X minutes to it and returns it in a SQL-friendly fashion', function () {
            // Pass in a datetime to it, mn
            const add15Minutes = EventBuilder.addMinutes(15, '2020-11-10 22:15:00');
            // Expect the dt be X minutes from now.
            expect(add15Minutes).to.equal('2020-11-10 22:30:00');
            
            const add2Hours = EventBuilder.addMinutes(120, '2020-11-10 22:15:00');
            // Expect the dt be X minutes from now.
            expect(add2Hours).to.equal('2020-11-11 00:15:00');
        })

        // After: I run the builder with an action and a start time
        // Then: 
        it ('Returns a Event object (id and name)', async function () {
            // Create an Action, mn
            const action = new Action({name: 'Foo', duration: 69});
            
            // Pass it into EventBuilder.create with a start date, mn
            const e = await EventBuilder.create({action, start: new Date()});

            // Expect it to be an Event with a string summary, SQL-friendly date for the start and end property.
            expect(e.constructor.name).to.equal('Event');
            expect(e.summary).to.equal('Foo');
            expect(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(e.start)).to.equal(true, 'The start property is not a SQL-friendly date');
            expect(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(e.end))  .to.equal(true, 'The end property is not a SQL-friendly date');
        })
    
        // After: I run the builder
        // Then: 
        it('adds a event entry in the db', async function() {
            // Check the db for the num of entries
            const numCLEntriesBefore = (await sqliteInstance.query('SELECT COUNT(*) ct FROM events'))[0].ct;
            // Action and start time.
            const action = await ActionBuilder.create({name: 'Foo', duration: 69});
            const start  = '2020-11-10 22:15:00';
            // Add the event with the Action and the start time.
            await EventBuilder.create({action, start});
            // Check the db for the num of entries. Did it increase by one?
            const numCLEntriesAfter = (await sqliteInstance.query('SELECT COUNT(*) ct FROM events'))[0].ct;
            expect(numCLEntriesAfter).to.equal(numCLEntriesBefore + 1);
        });

    });

    describe('Creates (builds) an an action', async function() {

        it('Has an actions table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'actions\';')).length).to.equal(1);
        })

        // After: I run the builder
        // Then: 
        it ('Returns an Action object', async function () {
            const a = await ActionBuilder.create({name: 'Foo', duration: 69})
            expect(a.constructor.name).to.equal('Action');
            expect(a.id).to.be.a('number');
            expect(a.name).to.equal('Foo');
            expect(a.duration).to.equal(69);
        })

        // After: I run the builder
        // Then: 
        it('adds an entry in the actions table', async function() {
            // Check the db for the num of entries
            const numCLEntriesBefore = (await sqliteInstance.query('SELECT COUNT(*) ct FROM actions'))[0].ct;
            // Add the checklist
            await ActionBuilder.create({name: 'Foo', duration: 69});
            // Check the db for the num of entries. Did it increase by one?
            const numCLEntriesAfter = (await sqliteInstance.query('SELECT COUNT(*) ct FROM actions'))[0].ct;
            expect(numCLEntriesAfter).to.equal(numCLEntriesBefore + 1);
        });

        // After: I run the builder without a duration
        // Then:
        it('throws an error for not having a duration', async function () {
            const err = await ActionBuilder.create({name: 'Foo'}).catch(err => err);
            expect(err.message).to.equal('Add a duration to build an Action.');
        })

        // After: I run the builder without a name
        // Then:
        it('throws an error for not having a name', async function () {
            const err = await ActionBuilder.create({duration: 69}).catch(err => err);
            expect(err.message).to.equal('Add a name to build an Action.');
        })
    });

    describe('Creates (builds) a checklist', async function() {

        it('Has a checklists table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'checklists\';')).length).to.equal(1);
        })
    
        // After: I run the builder
        // Then: 
        it ('Returns a Checklist object (id and name)', async function () {
            const cl = await ChecklistBuilder.create({name: 'Foo'})
            expect(cl.constructor.name).to.equal('Checklist');
            expect(cl.name).to.equal('Foo');
        })
    
        // After: I run the builder
        // Then: 
        it('adds a checklist entry in the db', async function() {
            // Check the db for the num of entries
            const numCLEntriesBefore = (await sqliteInstance.query('SELECT COUNT(*) ct FROM checklists'))[0].ct;
            // Add the checklist
            await ChecklistBuilder.create({name: 'Foo'});
            // Check the db for the num of entries. Did it increase by one?
            const numCLEntriesAfter = (await sqliteInstance.query('SELECT COUNT(*) ct FROM checklists'))[0].ct;
            expect(numCLEntriesAfter).to.equal(numCLEntriesBefore + 1);
        });

        // After: I run the builder without a name
        // Then:
        it('throws an error for not having a name', async function () {
            const err = await ChecklistBuilder.create({}).catch(err => err);
            expect(err.message).to.equal('Add a name to build a Checklist.');
        })

    });

    describe('Creates (builds) a schedule_template', async function() {

        it('Has a schedule_templates table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'schedule_templates\';')).length).to.equal(1);
        })
    
        // After: I run the builder
        // Then: 
        it ('Returns a Template object (id and name)', async function () {
            const t = await TemplateBuilder.create({name: 'Foo'})
            expect(t.constructor.name).to.equal('Template');
            expect(t.name).to.equal('Foo');
        })
    
        // After: I run the builder
        // Then: 
        it('adds a schedule_template entry in the db', async function() {
            // Check the db for the num of entries
            const numTemplateEntriesBefore = (await sqliteInstance.query('SELECT COUNT(*) ct FROM schedule_templates'))[0].ct;
            // Add the schedule_template
            await TemplateBuilder.create({name: 'Foo', templateId: 1});
            // Check the db for the num of entries. Did it increase by one?
            const numTemplateEntriesAfter = (await sqliteInstance.query('SELECT COUNT(*) ct FROM schedule_templates'))[0].ct;
            expect(numTemplateEntriesAfter).to.equal(numTemplateEntriesBefore + 1);
        });

    });

    describe('Creates a schedule', async function() {
        it('Has a schedules table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'schedules\';')).length).to.equal(1);
        })

        // After: I run the builder without a Template
        // Then:
        it('Errors if I try to create a schedule without a Template', async function() {
            // Try to create it without a Template
            const errMsg = await ScheduleBuilder.create({}).catch(err => err.message);
            expect(errMsg).to.equal('This ScheduleBuilder require a Template object to build a Schedule.');
        });

        // After: I run the builder with the template
        // Then: 
        it ('Returns a Schedule object (with a series of events)', async function () {
            // Create a Template
            const template = await TemplateBuilder.create({name: 'Foo'});
            // Create a few Actions
            const actions = [await ActionBuilder.create({name: 'Bar', duration: 5}), await ActionBuilder.create({name: 'Bay', duration: 10}), await ActionBuilder.create({name: 'Bor', duration: 15})];
            // Link the actions to the template.
            for (let i = 0; i < actions.length; i++) {
                const a = actions[i];
                await template.link(a);
            }
            
            // Run the builder with a name and the actiosn, mn
            const s = await ScheduleBuilder.create({template});
            // Expect it to return a schedule object with its name                                                              
            expect(s.constructor.name).to.equal('Schedule');
            expect(s.name).to.equal('Foo');
            // Expect it to have three event objects
            expect(s.events.length).to.equal(3);
            expect(s.events.every(e => e.constructor.name === 'Event')).to.be.true;
        })

        // After: I run the create method
        // Then:
        xit('Has events with accurate datetimes', async function () {
            // Create three actions of durations, five, ten, and fifteen minutes.
            const actions = [await ActionBuilder.create({name: 'Bar', duration: 5}), await ActionBuilder.create({name: 'Bay', duration: 10}), await ActionBuilder.create({name: 'Bor', duration: 15})];
            // Run the create method
            const s = await ScheduleBuilder.create({templateId: 1, name: 'Foo', 
                                                    actions});
            // Get the current Datetime
            const cdt = Date.now();
            // In the Schedule object
            // expect the first event's start to be within 2 minutes of the current Datetime 
            expect(s.startTime).to.be.within(addMins(cdt, -2), addMins(cdt, 2));
            expect(s.events.shift().start.posix).to.be.within(addMins(cdt, -2), addMins(cdt, 2));
            // expect the last event's end to be within 2 minutes of thirty minutes from the current Datetime 
            expect(s.events.pop().end.posix).to.be.within(addMins(cdt, 30-2), addMins(cdt, 30+2));
            
            // In the db: 
            const es = await sqliteInstance.query(`SELECT * FROM schedule_events se INNER JOIN events e ON se.event_id = e.id WHERE se.schedule_id = ${s.id};`);
            // Get the first connected event from the db
            const firstEvent = es.shift().start
            // // expect the first event's start to be within 2 minutes of the current Datetime 
            expect(new Date(firstEvent).getTime()).to.be.within(addMins(cdt, -2), addMins(cdt, 2));
            // // Get the last connected event from the db
            const lastEvent = es.pop().end;
            // // expect the last event's end to be within 2 minutes of thirty minutes from the current Datetime 
            expect(new Date(lastEvent).getTime()).to.be.within(addMins(cdt, 30-2), addMins(cdt, 30+2));

            function addMins(dt, mins) {
                return dt + 1000 * 60 * mins;
            }
        })

        // After: ScheduleBuilder.create({name: '', actions: [...], isCurrent: true})
        // Then:
        xit('Makes the schedule current on creation if marked', async function () {
            // Two schedules; One with the flag and one without.
            const s0 = await ScheduleBuilder.create({templateId: 1, name: 'Foo', isCurrent: true});
            const s = await ScheduleBuilder.create({templateId: 1, name: 'Foo', isCurrent: false});
            // Expect one to be current and the other not. 
            expect(await s0.isCurrent()).to.be.true;
            expect(await s.isCurrent()).to.be.false;
        })
    });

});

function clog(message) {
    console.log(message);
}
