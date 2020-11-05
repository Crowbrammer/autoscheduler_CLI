require('dotenv').config({path: __dirname + '/../../.env'});
const expect = require('chai').expect;
const PQuery = require('prettyquery');
const dbCreds = {user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE};
const Action = require(__dirname + '/../models/Action').default;

describe('Action', function () {
    let pQuery;
    before(async function () {
        pQuery = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE});
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
})