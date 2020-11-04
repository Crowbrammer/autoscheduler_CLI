require('dotenv').config();
const expect = require('chai').expect;
const PQuery = require('prettyquery');
const dbCreds = {user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE};

describe('Server setup', async function() {
    it('Retrieves the schedule', async function () {
        // Given, session: have a cookie that confirms the person's ID
        // GET schedules
    })
});