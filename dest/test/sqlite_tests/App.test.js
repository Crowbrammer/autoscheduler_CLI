const sqlite3  = require('sqlite3');
const { open } = require('sqlite');
const { expect } = require('chai');
const { default: Builder } = require('../../builders/Builder');
const { AutoschedulerModel } = require('../../models/Model');
const { default: AutoschedulerApp } = require('../../App');
const { default: TemplateBuilder } = require('../../builders/TemplateBuilder');

describe('User Interface', async function() {

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

    // After: app.setController('a');
    // Then:
    it('Sets the controller to an ActionController', function() {
        // Instantiate the app
        const app = new AutoschedulerApp();
        // Put in 'ca' to 
        app.setController('a');
        // Check that the ActionController is used
        expect(app.controller.constructor.name).to.equal('ActionController');
    });

    // After: I put in ca <name>
    // Then:
    it('Sets the controller to an ActionController from app.in', function () {
        // Instantiate the app
        const app = new AutoschedulerApp();
        // Put in 'ca' to 
        app.in('ca', 'boop');
        // Check that the ActionController is used
        expect(app.controller.constructor.name).to.equal('ActionController');

    })

    // After: I put in ct <name>
    // Then:
    it('Sets the controller to a TemplateController from app.in', function () {
        // Instantiate the app
        const app = new AutoschedulerApp();
        // Put in 'ct' to 
        app.in('ct', 'boop');
        // Check that the TemplateController is used
        expect(app.controller.constructor.name).to.equal('TemplateController');

    })


    // After: ct Foo
    it('Creates a new template named foo and marks it as current', async function () {
        // Count the number of templates, mn
        const numTemplatesBefore = (await sqliteInstance.query('SELECT COUNT(*) ct FROM schedule_templates;'))[0].ct;
        // Put the 'ct' and 'Bar' into the app
        const app = new AutoschedulerApp();
        app.in('ct', 'Bar');
        // Run the app
        await app.run();
        // Check that the new template is
        // Count the number of templates, mn; expect there to be one more
        const numTemplatesAfter = (await sqliteInstance.query('SELECT COUNT(*) ct FROM schedule_templates;'))[0].ct;
        expect(numTemplatesAfter).to.equal(numTemplatesBefore + 1);

    })

    // After: ca Bar 15
    it('Creates a new action named Bar of duration fifteen minutes', async function () {
        // Create a current template
        const t = await TemplateBuilder.create({name: 'Loop', markAsCurrent: true});
        // Count the number of templates, mn
        const numActionsBefore = (await sqliteInstance.query('SELECT COUNT(*) ct FROM actions;'))[0].ct;
        // Put the 'ct' and 'Bar' into the app
        const app = new AutoschedulerApp();
        app.in('ca', 'Bar', 15);
        // Run the app
        await app.run();
        // Check that the new template is
        // Count the number of templates, mn; expect there to be one more
        const numActionsAfter = (await sqliteInstance.query('SELECT COUNT(*) ct FROM actions;'))[0].ct;
        expect(numActionsAfter).to.equal(numActionsBefore + 1);
        const lastAction = (await sqliteInstance.query(`SELECT * FROM actions ORDER BY id DESC LIMIT 1;`))[0];
        expect((await t.getActions()).length).to.equal(1);
        expect((await t.getActions())[0].id).to.equal(lastAction.id);

    })

    // After: ct Foo, ca Bar 15, a ca Fizz, a ca Buzz, a cs
    // Then: 
    it('shows three events between four military times.', async function () {
        const app = new AutoschedulerApp();
        // ct Foo
        app.in('ct', 'Foo');
        await app.run();
        // ca Bar 15
        app.in('ca', 'Bar', 15);
        await app.run();
        // ca Fizz 15 
        app.in('ca', 'Fizz', 15);
        await app.run();
        // ca Buzz 30 
        app.in('ca', 'Buzz', 15);
        await app.run();
        // cs
        app.in('cs');
        await app.run();
        expect(app.out.match(/\d\d:\d\d/g).length).to.equal(4);
        expect(/F/.test(app.out)).to.be.true;
    })
    
    // After: ct Foo, ca Bar 15, a ca Fizz, a ca Buzz, a cs, a rs
    // Then:
    it('shows three events between four military times.', async function () {
        const app = new AutoschedulerApp();
        // ct Foo
        app.in('ct', 'Foo');
        await app.run();
        // ca Bar 15
        app.in('ca', 'Bar', 15);
        await app.run();
        // ca Fizz 15 
        app.in('ca', 'Fizz', 15);
        await app.run();
        // ca Buzz 30 
        app.in('ca', 'Buzz', 15);
        await app.run();
        // cs
        app.in('cs');
        await app.run();
        // There was leftover from the previous app. Should work starting fresh.
        const app2 = new AutoschedulerApp();
        // rs
        app2.in('rs');
        await app2.run();
        expect(app2.out.match(/\d\d:\d\d/g).length).to.equal(4);
        expect(/F/.test(app2.out)).to.be.true;
    });

});