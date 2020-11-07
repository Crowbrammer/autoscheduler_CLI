require('dotenv').config({path: __dirname + '/../../.env'});
const expect = require('chai').expect;
const PQuery = require('prettyquery');

const Action = require(__dirname + '/../models/Action').default;

describe('Action Model', function () {
    let pQuery;
    before(async function () {
        pQuery = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE});
        const {AutoschedulerModel} = require(__dirname + '/../models/Model');
        AutoschedulerModel.driver = pQuery;
    });

    after(async function () {
        pQuery.connection.end();
        // setTimeout(() => {
        //     process.exit(0);
        // }, 20);
    });

    it('Creates an action', async function() {
        const beforeCount = (await pQuery.query('SELECT COUNT(*) ct FROM actions;'))[0].ct;
        const action = new Action({name: 'Bwa', duration: 15});
        await action.create();
        const afterCount = (await pQuery.query('SELECT COUNT(*) ct FROM actions;'))[0].ct;
        expect(afterCount - beforeCount).to.equal(1);
    });

    it('Retrieves an action', async function() {
        const action = new Action({name: 'Bwa', duration: 5});
        await action.create();
        const actionAgain = new Action({id: action.id});
        await actionAgain.retrieve();
        expect (actionAgain.name).to.equal(action.name);
        expect (actionAgain.duration).to.equal(action.duration);
    });

    it('Updates an action', async function () {
        const action = new Action({name: 'Bwa', duration: 5});
        await action.create();
        action.name = 'Lol';
        action.duration = 69;
        await action.update();
        const actionAgain = new Action({id: action.id});
        await actionAgain.retrieve();
        expect(actionAgain.name).to.equal('Lol');
        expect(actionAgain.duration).to.equal(69);
    });

    it('Soft deletes an action', async function () {
        const action = new Action({name: 'Bwa', duration: 5});
        await action.create();
        await action.delete();
        expect(action.is_deleted).to.be.true;
        expect((await pQuery.query(`SELECT * FROM actions WHERE id = ${action.id}`))[0].is_deleted).to.equal(1);
        const sameAction = new Action({id: action.id});
        await sameAction.retrieve();
        expect(sameAction.name).to.be.undefined;
        expect(sameAction.duration).to.be.undefined;
    });

    it('Links an action to the template', async function () {
        const templateId = (await pQuery.query('INSERT INTO schedule_templates (name) VALUES (\'Haha\')')).insertId;
        const action = new Action({name: 'Wab', duration: 69});
        await action.create();
        let stas = await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${templateId} AND action_id = ${action.id}`);
        expect(stas.length).to.equal(0);
        await action.link(templateId);
        stas = await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${templateId} AND action_id = ${action.id}`);
        expect(stas.length).to.equal(1); // unlink? 
    })
    
    it('Auto-links to the current template on creation', async function () {
        // Current template
        await pQuery.query('UPDATE schedule_templates SET is_current = false;');
        const templateId = (await pQuery.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Haha\', true)')).insertId;
        // No linked actions
        let stas = await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${templateId};`);
        expect(stas.length).to.equal(0);
        // Create an action
        const action = new Action({name: 'Abw', duration: 420});
        await action.create();
        // A linked action
        stas = await pQuery.query(`SELECT * FROM schedule_template_actions WHERE schedule_template_id = ${templateId}`);
        expect(stas.length).to.equal(1);
        expect(stas[0].action_id).to.equal(action.id);
    })
})