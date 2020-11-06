require('dotenv').config({path: __dirname + '/../../.env'});
const sqlite3  = require('sqlite3');
const { open } = require('sqlite');
const { expect } = require('chai');

describe('SQLite Setup', async function() {
    let db;

    before(async function() {
        db = await open({
            filename: __dirname + '/../db/sqlite/database.db',
            driver: sqlite3.Database
        })
        // await db.exec('CREATE TABLE blah (id INTEGER PRIMARY KEY AUTOINCREMENT);')
    });

    it('Has the right tables', async function() {
        const tables = await db.all('SELECT name FROM sqlite_master;');
        const tableNames = tables.map(table => table.name);
        expect(tableNames).to.include.members(['actions', 'schedule_templates', 'schedule_template_actions', 'schedules', 'events', 'schedule_events']);
    });
});