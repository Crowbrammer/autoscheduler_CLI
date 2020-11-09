require('dotenv').config({ path: __dirname + '/../../.env' });
const PQuery = require('prettyquery');
let driver = new PQuery({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: 'localhost' });
(async function () {
    await driver.useDb(process.env.DATABASE);
    await driver.query('ALTER TABLE actions ADD is_deleted BOOLEAN');
    await driver.query('ALTER TABLE schedule_template_actions ADD is_deleted BOOLEAN');
    await driver.query('ALTER TABLE schedule_templates ADD is_deleted BOOLEAN');
    await driver.query('ALTER TABLE schedules ADD is_deleted BOOLEAN');
    await driver.query('ALTER TABLE events ADD is_deleted BOOLEAN');
})();
