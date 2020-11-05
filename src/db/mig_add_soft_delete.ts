require('dotenv').config({path: __dirname + '/../../.env'});
const PQuery = require('prettyquery');
let pQuery = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: 'localhost'});

(async function () {
    await pQuery.useDb(process.env.DATABASE);
    await pQuery.query('ALTER TABLE actions ADD is_deleted BOOLEAN');
    await pQuery.query('ALTER TABLE schedule_template_actions ADD is_deleted BOOLEAN');
    await pQuery.query('ALTER TABLE schedule_templates ADD is_deleted BOOLEAN');
    await pQuery.query('ALTER TABLE schedules ADD is_deleted BOOLEAN');
    await pQuery.query('ALTER TABLE events ADD is_deleted BOOLEAN');
})()