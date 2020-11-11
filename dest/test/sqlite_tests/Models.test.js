const sqlite3  = require('sqlite3');
const { open } = require('sqlite');
const { expect } = require('chai');
const Builder = require('../../builders/Builder').default;
const TemplateBuilder = require('../../builders/TemplateBuilder').default;
const ScheduleBuilder = require('../../builders/ScheduleBuilder').default;
const EventBuilder = require('../../builders/EventBuilder').default;
const ChecklistBuilder = require('../../builders/ChecklistBuilder').default;
const ActionBuilder = require('../../builders/ActionBuilder').default;
const { AutoschedulerModel } = require('../../models/Model');
const { default: Schedule } = require('../../models/Schedule');
const Checklist = require('../../models/Checklist').default;
const Template = require('../../models/Template').default;
const Event = require('../../models/Event').default;


describe('Model RUDs and links', async function() {
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
        AutoschedulerModel.driver = sqliteInstance;
        Builder.driver = sqliteInstance;
        
    });
    
    describe('Action Model RUDs and links', async function() {

        it('Has an actions table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'actions\';')).length).to.equal(1);
        })

    });

    describe('Template Model RUDs and links', async function() {

        it('Has a schedule_templates table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'schedule_templates\';')).length).to.equal(1);
        })

        // After: new Template().getCurrentTemplate()
        // Then:
        it('Sets the id and name of the current checklist object to match the current checklist', async function () {
            // Create a checklist, mn
            const t = await TemplateBuilder.create({name: 'Foo'});
            // Mark it as current
            await t.markAsCurrent();
            // Without the builder, create a Template object
            const freshTemplate = new Template();
            // Invoke getCurrentTemplate
            await freshTemplate.getCurrentTemplate();
            // Check that its id and name matches the current Cl's id and name
            expect(freshTemplate.id).to.equal(t.id);
            expect(freshTemplate.name).to.equal(t.name);
        })

        // After: new Template({id: 3}).hasLinkWith(action) where an entry in the schedule_template_actions table
        // Then:
        it('returns the link or null', async function () {
            // Create a schedule_template and store its id
            const t = await TemplateBuilder.create({name: 'Foo'});
            // Create two actions and store its id
            const a = [await ActionBuilder.create({name: 'Bar', duration: 69}), await ActionBuilder.create({name: 'Bar', duration: 420})];
            // Create a linking entry between the CL and one action
            await sqliteInstance.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id) VALUES (${t.id}, ${a[0].id})`);
            // null if not
            expect(await t.hasLinkWith(a[1])).to.be.null;
            // It should return a query result if exists
            const link = await t.hasLinkWith(a[0]);
            expect(link.schedule_template_id).to.be.a('number');
            expect(link.action_id).to.be.a('number');

        })

        // After: I've linked a template to an action and try to link it again
        // Then:
        it('returns the existing link if I\'ve already linked an action', async function () {
            // Create a template
            const t = await TemplateBuilder.create({name: 'Foo'});
            // Create an action
            const a = await ActionBuilder.create({name: 'Bar', duration: 69});
            // Expect the entry to not be there...
            expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${t.id} AND action_id = ${a.id}`)).length).to.equal(0);
            // Link it twice
            await t.link(a);
            expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${t.id} AND action_id = ${a.id}`)).length).to.equal(1);
            // Expect only one entry for the combo to be in the db.
            await t.link(a);
            expect((await sqliteInstance.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${t.id} AND action_id = ${a.id}`)).length).to.equal(1);
        })

        // After: new Template({id: 3}).link;
        // Then: 
        it('It connects the schedule_template to the action', async function () {
            // Create a schedule_template and store its id
            const t = await TemplateBuilder.create({name: 'Foo'});
            // Create a few actions
            const actions = [];
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 69}));
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 420}));
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 1}));
    
            // Run the linking functions
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                await t.link(action); // Pass an object because it can link to different things: Actions, outcomes, schedules(?).
                // Check that they're linked
                const link = await t.hasLinkWith(action);
                expect(link).to.have.property('schedule_template_id');
                expect(link).to.have.property('action_id');
                expect(link).to.have.property('order_num');
                // expect(await cl.hasLinkWith(action)).to.have.all.keys('schedule_template_id', 'action_id', 'order_num');
            }
        })

        // After: new Template({id: 3}).getActions();
        // Then:
        it('Pulls actions related to the schedule_template', async function () {
            // Create a schedule_template
            const t = await TemplateBuilder.create({name: 'Foo'});
            // Create a few actions
            const actions = [await ActionBuilder.create({name: 'Bar', duration: 420}), await ActionBuilder.create({name: 'Bay', duration: 69}), await ActionBuilder.create({name: 'Bor', duration: 1})];
            // Link 'em
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                await t.link(action);
            }
            // Use the function
            const attemptedTemplateActionPull = await t.getActions();
            // Check that it returns the action names (don't worry about the order).
            expect(attemptedTemplateActionPull.map(action => action.name)).to.include.members(['Bar', 'Bay', 'Bor']);
            expect(attemptedTemplateActionPull.map(action => action.duration)).to.include.members([420, 69, 1]);
        })

        // After: new Template({id: 3}).markAsCurrent();
        // Then:
        it('Makes the schedule_template the current one', async function () {
            // Create a schedule_template, mn (mnemonic -> remember it -> store it in a variable)
            const t = await TemplateBuilder.create({name: 'Foo'});
            // Invoke markAsCurrent()
            await t.markAsCurrent();
            // Pull the current schedule_templates, mn
            const pulledTemplates = await sqliteInstance.query(`SELECT id FROM schedule_templates WHERE is_current = true;`);
            // Expect the pull to be an array of length 1
            expect(pulledTemplates.length).to.equal(1);
            // Expect the entry in that array to have the same id as the schedule_template
            expect(pulledTemplates[0].id).to.equal(t.id);
        })

    });

    describe('Schedule Model RUDs and links', async function() {
        it('Has a schedules table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'schedules\';')).length).to.equal(1);
        })
        
        it('Has a schedule_events table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'schedule_events\';')).length).to.equal(1);
        })

        // After: new Schedule({id: 3}).hasLinkWith(event) where an entry in the schedule_events table
        // Then:
        it('returns the link or null', async function () {
            // Create a template for the schedule.
            const template = await TemplateBuilder.create({name: 'Foo'});
            // Create a schedule and store its id
            const s = await ScheduleBuilder.create({name: 'Foo', template});
            // Create two actions and events using these actions and store its id
            const as = [await ActionBuilder.create({name: 'Bloop', duration: 60}), await ActionBuilder.create({name: 'Blop', duration: 420})];
            const start = '2020-11-09 15:15:15';
            const es = [await EventBuilder.create({action: as[0], start}), await EventBuilder.create({action: as[1], start})];
            // Create a linking entry between the CL and one event
            await sqliteInstance.query(`INSERT INTO schedule_events (schedule_id, event_id) VALUES (${s.id}, ${es[0].id})`);
            // null if not
            expect(await s.hasLinkWith(es[1])).to.be.null;
            // It should return a query result if exists
            const link = await s.hasLinkWith(es[0]);
            expect(link.schedule_id).to.be.a('number');
            expect(link.event_id).to.be.a('number');

        })

        // After: new Schedule({id: 3}).link;
        // Then: 
        it('It connects the schedule to the event', async function () {
            // Create a schedule
            const template = await TemplateBuilder.create({name: 'Wabefeto'});
            const s = await ScheduleBuilder.create({template});
            // Create a few events
            const actions = [];
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 69}));
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 420}));
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 1}));
            const events = [];
            events.push(await EventBuilder.create({action: actions[0], start: new Date()}));
            events.push(await EventBuilder.create({action: actions[1], start: new Date()}));
            events.push(await EventBuilder.create({action: actions[2], start: new Date()}));
    
            // Run the linking functions
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                await s.link(event); // Pass an object because it can link to different things: Events, outcomes, schedules(?).
                // Check that they're linked
                const link = await s.hasLinkWith(event);
                expect(link).to.have.property('schedule_id');
                expect(link).to.have.property('event_id');
                expect(link).to.have.property('order_num');
            }
        })

        // After: new Schedule({id: 3}).getEvents();
        // Then:
        it('Pulls events related to the schedule', async function () {
            // Create a schedule
            const template = await TemplateBuilder.create({name: 'Wabefeto'});
            const s = await ScheduleBuilder.create({template});
            // Create a few events
            const actions = [];
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 69}));
            actions.push(await ActionBuilder.create({name: 'Bay', duration: 420}));
            actions.push(await ActionBuilder.create({name: 'Bor', duration: 1}));
            const events = [];
            events.push(await EventBuilder.create({action: actions[0], start: new Date()}));
            events.push(await EventBuilder.create({action: actions[1], start: new Date()}));
            events.push(await EventBuilder.create({action: actions[2], start: new Date()}));
    
            // Run the linking functions
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                await s.link(event); // Pass an object because it can link to different things: Events, outcomes, schedules(?).
                // Check that they're linked
                const link = await s.hasLinkWith(event);
            }
            // Use the function
            const attemptedClEventPull = await s.getEvents();
            // Check that it returns the event names (don't worry about the order).
            expect(attemptedClEventPull.map(event => event.summary)).to.include.members(['Bar', 'Bay', 'Bor']);
            expect(attemptedClEventPull.every(e => e.constructor.name === 'Event')).to.be.true;
        })

        // After: new Schedule({id: 3}).isCurrent();
        // Then
        it(`Tells me if it's current or not`, async function () {
            // Create two schedules. Mark one as current.
            const template = await TemplateBuilder.create({name: 'Wabefeto'});
            const s0 = await ScheduleBuilder.create({template});
            await s0.markAsCurrent();
            const s = await ScheduleBuilder.create({template});
            // Run the function. Expect one to be true, the other false.
            expect(await s0.isCurrent()).to.be.true;
            expect(await s.isCurrent()).to.be.false;
        })

        // After: new Schedule({id: 3}).markAsCurrent();
        // Then:
        it('Makes the schedule the current one', async function () {
            // Create two schedules, mn (mnemonic -> remember it -> store it in a variable)
            const template = await TemplateBuilder.create({name: 'Wabefeto'});
            const s0 = await ScheduleBuilder.create({template});
            const s = await ScheduleBuilder.create({template});
            // Make one of the schedules current with a query.
            await sqliteInstance.query(`UPDATE schedules SET is_current = true WHERE id = ${s0.id};`);
            // Invoke markAsCurrent()
            await s.markAsCurrent();
            // Pull the current schedules, mn
            const pulledCls = await sqliteInstance.query(`SELECT id FROM schedules WHERE is_current = true;`);
            // Expect s0 to be not current
            const s0Query = await sqliteInstance.query(`SELECT is_current FROM schedules WHERE id = ${s0.id};`);
            expect(s0Query[0].is_current).to.equal(0); // Check if something is current or not...
            // Expect the pull to be an array of length 1
            expect(pulledCls.length).to.equal(1);
            // Expect the entry in that array to have the same id as the schedule
            expect(pulledCls[0].id).to.equal(s.id);
        })

        // After: new Schedule().getCurrentSchedule()
        // Then:
        it('Sets the id and name of the current Schedule object to match the current schedule', async function () {
            // Create a schedule, mn
            const template = await TemplateBuilder.create({name: 'Wabefeto'});
            const s = await ScheduleBuilder.create({template});
            // Mark it as current
            await s.markAsCurrent();
            // Without the builder, create a Schedule object
            const freshSchedule = new Schedule({template});
            // Invoke getCurrentSchedule
            await freshSchedule.getCurrentSchedule();
            // Check that its id and name matches the current S's id and name
            expect(freshSchedule.id).to.equal(s.id);
            expect(freshSchedule.name).to.equal(s.name);
            expect(freshSchedule.events.length).to.equal(s.events.length);
        })
    });

    describe('Event Model RUDs and links', async function() {
        it('Has a events table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'events\';')).length).to.equal(1);
        })
        
        it('Has a schedule_events table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'schedule_events\';')).length).to.equal(1);
        })



        // After: new Event({summary: 'Wow', start: 2020-11-09T18:26:15.000Z, end: 2020-11-09T18:36:15.000Z}).milStart()
        // Then: 
        it('Shows the start and end in military time', function () {
            // Expect that it converts it to mil time.
            const e = new Event({start: new Date('2020-11-09T18:26:15.000Z'), end: new Date('2020-11-09T18:36:15.000Z')});
            expect(e.milStart()).to.equal('13:26');
            expect(e.milEnd()).to.equal('13:36');
        })

    });
    
    describe('Checklist Model RUDs and links', async function() {
        it('Has a checklists table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'checklists\';')).length).to.equal(1);
        })
        
        it('Has a checklist_actions table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'checklist_actions\';')).length).to.equal(1);
        })

        // After: new Checklist({id: 3}).hasLinkWith(action) where an entry in the checklist_actions table
        // Then:
        it('returns the link or null', async function () {
            // Create a checklist and store its id
            const cl = await ChecklistBuilder.create({name: 'Foo'});
            // Create two actions and store its id
            const a = [await ActionBuilder.create({name: 'Bar', duration: 69}), await ActionBuilder.create({name: 'Bar', duration: 420})];
            // Create a linking entry between the CL and one action
            await sqliteInstance.query(`INSERT INTO checklist_actions (checklist_id, action_id) VALUES (${cl.id}, ${a[0].id})`);
            // null if not
            expect(await cl.checkLink(a[1])).to.be.null;
            // It should return a query result if exists
            const link = await cl.checkLink(a[0]);
            expect(link.checklist_id).to.be.a('number');
            expect(link.action_id).to.be.a('number');

        })

        // After: new Checklist({id: 3}).link;
        // Then: 
        it('It connects the checklist to the action', async function () {
            // Create a checklist and store its id
            const cl = await ChecklistBuilder.create({name: 'Foo'});
            // Create a few actions
            const actions = [];
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 69}));
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 420}));
            actions.push(await ActionBuilder.create({name: 'Bar', duration: 1}));
    
            // Run the linking functions
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                await cl.link(action); // Pass an object because it can link to different things: Actions, outcomes, schedules(?).
                // Check that they're linked
                const link = await cl.checkLink(action);
                expect(link).to.have.property('checklist_id');
                expect(link).to.have.property('action_id');
                expect(link).to.have.property('order_num');
                // expect(await cl.checkLink(action)).to.have.all.keys('checklist_id', 'action_id', 'order_num');
            }
        })

        // After: new Checklist({id: 3}).getActions();
        // Then:
        it('Pulls actions related to the checklist', async function () {
            // Create a checklist
            const cl = await ChecklistBuilder.create({name: 'Foo'});
            // Create a few actions
            const actions = [await ActionBuilder.create({name: 'Bar', duration: 420}), await ActionBuilder.create({name: 'Bay', duration: 69}), await ActionBuilder.create({name: 'Bor', duration: 1})];
            // Link 'em
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                await cl.link(action);
            }
            // Use the function
            const attemptedClActionPull = await cl.getActions();
            // Check that it returns the action names (don't worry about the order).
            expect(attemptedClActionPull.map(action => action.name)).to.include.members(['Bar', 'Bay', 'Bor']);
            expect(attemptedClActionPull.map(action => action.duration)).to.include.members([420, 69, 1]);
        })

        // After: new Checklist({id: 3}).markAsCurrent();
        // Then:
        it('Makes the checklist the current one', async function () {
            // Create a checklist, mn (mnemonic -> remember it -> store it in a variable)
            const cl = await ChecklistBuilder.create({name: 'Foo'});
            // Invoke markAsCurrent()
            await cl.markAsCurrent();
            // Pull the current checklists, mn
            const pulledCls = await sqliteInstance.query(`SELECT id FROM checklists WHERE is_current = true;`);
            // Expect the pull to be an array of length 1
            expect(pulledCls.length).to.equal(1);
            // Expect the entry in that array to have the same id as the checklist
            expect(pulledCls[0].id).to.equal(cl.id);
        })

        // After: new Checklist().getCurrentChecklist()
        // Then:
        it('Sets the id and name of the current checklist object to match the current checklist', async function () {
            // Create a checklist, mn
            const cl = await ChecklistBuilder.create({name: 'Foo'});
            // Mark it as current
            await cl.markAsCurrent();
            // Without the builder, create a Checklist object
            const freshCl = new Checklist();
            // Invoke getCurrentChecklist
            await freshCl.getCurrentChecklist();
            // Check that its id and name matches the current Cl's id and name
            expect(freshCl.id).to.equal(cl.id);
            expect(freshCl.name).to.equal(cl.name);
        })
    
    });
});

