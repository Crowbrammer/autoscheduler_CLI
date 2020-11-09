const sqlite3  = require('sqlite3');
const { open } = require('sqlite');
const { expect } = require('chai');
const { default: Builder } = require('../../builders/Builder')
const { AutoschedulerModel } = require('../../models/Model');
const { CreateChecklistMessenger, RetrieveChecklistActionsMessenger } = require('../../Messenger');
const { default: ChecklistBuilder } = require('../../builders/ChecklistBuilder');
const { default: ActionBuilder } = require('../../builders/ActionBuilder');

describe('Wield the Models', async function() {
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

    // After: CreateChecklist controller is used
    // Then:
    it('Returns a string with the name checklist', async function () {
        // Create the CreateChecklist controllor
        const ccc = new CreateChecklistMessenger({name: 'Foo'});
        // Invoke the message element
        const msg = await ccc.message();
        // Check if it has the checklist's name in it
        expect(msg).to.contain('Foo');
    });

    // After: CreateChecklist Controller is used
    // Then: 
    it('Creates a checklist', async function () {
        // Check the number of checklists, remember it 
        const numChecklistsBefore = (await sqliteInstance.query('SELECT COUNT(*) ct FROM checklists'))[0].ct;
        // Create a CreateChecklistMessenger
        const ccc = new CreateChecklistMessenger({name: 'Woof'});
        // Invoke the message
        const msg = await ccc.message();
        // Check the number of checklists. 
        const numChecklistsAfter = (await sqliteInstance.query('SELECT COUNT(*) ct FROM checklists'))[0].ct;
        // Expect it to have one more.
        expect(numChecklistsAfter).to.equal(numChecklistsBefore + 1);
    });

    // After: RetrieveChecklistActionsMessenger.message();
    // Then:
    it('Shows actions related to the current checklist', async function () {
        // Create a checklist.
        const cl = await ChecklistBuilder.create({name: 'Foo'});
        // Mark it as current.
        await cl.markAsCurrent();
        // Create actions.
        const actions = [await ActionBuilder.create({name: 'Bar', duration: 420}), await ActionBuilder.create({name: 'Bay', duration: 69}), await ActionBuilder.create({name: 'Bor', duration: 1})];
        // Link 'em
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            await cl.link(action);
        }
        // Create the RetrieveChecklistActionsMessenger
        const rclam = new RetrieveChecklistActionsMessenger();
        // Invoke its message
        // Expect the message to have the names of the checklist and the actions
        const msg = await rclam.message();
        expect(msg).to.contain(cl.name);
        expect(msg).to.contain(actions[0].name);
        expect(msg).to.contain(actions[1].name);
        expect(msg).to.contain(actions[2].name);
    })

    // After: RetrieveScheduleMessenger...message
    // Then: It displays the schedule name and accurate events and time.

});