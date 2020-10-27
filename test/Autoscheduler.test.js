require('dotenv').config();
const expect = require('chai').expect;
const PQuery = require('prettyquery');
const dbCreds = {user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE};
const pQuery = new PQuery(dbCreds);
const Autoscheduler = require('../Autoscheduler').default;

describe('Autoscheduler', async function() {
    let autoscheduler = new Autoscheduler();
    it('Shows the current schedule template and actions under it', async function () {
        // Add a template
        const templateId = (await pQuery.query('INSERT INTO schedule_templates (name, is_current) VALUES (\'Hello\', true)')).insertId;
        // Create two actions
        const actions = [];
        actions[0] = (await pQuery.query('INSERT INTO actions (name, duration) VALUES (\'Ludacris\', 5)')).insertId;
        actions[1] = (await pQuery.query('INSERT INTO actions (name, duration) VALUES (\'Tupac\', 5)')).insertId;
        // Stitch 'em to the db
        await pQuery.insert('schedule_template_actions', ['schedule_template_id', 'action_id'], [ [templateId, actions[0]], [templateId, actions[1]] ] );
        
    })

    after(async function() {
        pQuery.connection.end();
    });
});

