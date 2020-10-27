require('dotenv').config();
const expect = require('chai').expect;
const PQuery = require('prettyquery');
const dbCreds = {user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE};
const AutoschedulerOrderer = require('../Orderer').default


describe('Orderer', async function() {
    describe('Adding', async function() {
        let orderer = new AutoschedulerOrderer();
        it('Gives the order of a freshly added task', async function() {
            // Adding to an e
            // Pull ordered ids
            // Put into an array
            // Do a splice
        });
    });
});

