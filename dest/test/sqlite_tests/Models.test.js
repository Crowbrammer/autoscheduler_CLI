const sqlite3  = require('sqlite3');
const { open } = require('sqlite');
const { expect } = require('chai');
const Builder = require('../../builders/Builder').default;
const TemplateBuilder = require('../../builders/TemplateBuilder').default;
const ChecklistBuilder = require('../../builders/ChecklistBuilder').default;
const ActionBuilder = require('../../builders/ActionBuilder').default;
const { AutoschedulerModel } = require('../../models/Model');
const { default: Schedule } = require('../../models/Schedule');
const Checklist = require('../../models/Checklist').default;
const Template = require('../../models/Template').default;


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

        // After: new Template({id: 3}).checkLink(action) where an entry in the schedule_template_actions table
        // Then:
        it('returns the link or null', async function () {
            // Create a schedule_template and store its id
            const t = await TemplateBuilder.create({name: 'Foo'});
            // Create two actions and store its id
            const a = [await ActionBuilder.create({name: 'Bar', duration: 69}), await ActionBuilder.create({name: 'Bar', duration: 420})];
            // Create a linking entry between the CL and one action
            await sqliteInstance.query(`INSERT INTO schedule_template_actions (schedule_template_id, action_id) VALUES (${t.id}, ${a[0].id})`);
            // null if not
            expect(await t.checkLink(a[1])).to.be.null;
            // It should return a query result if exists
            const link = await t.checkLink(a[0]);
            expect(link.schedule_template_id).to.be.a('number');
            expect(link.action_id).to.be.a('number');

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
                const link = await t.checkLink(action);
                expect(link).to.have.property('schedule_template_id');
                expect(link).to.have.property('action_id');
                expect(link).to.have.property('order_num');
                // expect(await cl.checkLink(action)).to.have.all.keys('schedule_template_id', 'action_id', 'order_num');
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
        // After passing in a local time string to Schedule.localToSQLDatetimeString
        // Then
        it('returns a properly formatted SQL datetime string', function () {
            // Pass in a local datetimestring
            const sqlDt = Schedule.posixToSQL();
            const sqlDt = Schedule.localToSQLDatetimeString('11/9/2020, 11:36:00 AM');
            // Return YYYY-MM-DD HH:MM:SS
            expect(sqlDt).to.equal('2020-09-11 11:36:00');

        })
    });
    
    describe('Checklist Model RUDs and links', async function() {
        it('Has a checklists table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'checklists\';')).length).to.equal(1);
        })
        
        it('Has a checklist_actions table', async function () {
            expect((await sqliteInstance.query('SELECT * FROM sqlite_master WHERE name = \'checklist_actions\';')).length).to.equal(1);
        })

        // After: new Checklist({id: 3}).checkLink(action) where an entry in the checklist_actions table
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

