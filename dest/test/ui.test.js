require('dotenv').config();
const dbPath = __dirname + '/../' + process.env.DATABASE_LITE;
const { expect } = require('chai');
const system = require('system-commands');
// const { nameByRace } = require("fantasy-name-generator");
const a = `node ${__dirname}/../index.js`

describe('Focuser', async function() {
    let driver;
    before(async function() {
        
        driver = require('better-sqlite3')(dbPath);

        driver.query = function (query) {
            if (/(INSERT|CREATE|UPDATE)/.test(query)) {
                return this.prepare(query).run();
            } else {
                return this.prepare(query).all();
            }
        }
        
    });

    // After: Creating two actions, then ca --repeat 1 2 3
    // Then:
    it('Repeats the two actions three times', async function() {
        
        await system(`${a} ct Foo`).catch(err => console.error(err));
        await system(`${a} ca Bar 15`).catch(err => console.error(err));
        await system(`${a} ca Buzz 30`).catch(err => console.error(err));
        // Create two actions
        // Run the repeat command
        let output = await system(`${a} ca --repeat 1 2 3`).catch(err => console.error(err));
        expect(output).to.equal('Actions from positions 1 to 2, inclusive, repeated 3 more times.');
        // Create the schedule
        output = await system(`${a} cs`).catch(err => console.error(err));
        // There should nine times and eight actions
        expect(output.match(/\d\d:\d\d/g).length).to.equal(9);
        expect(output.match(/Bar/g).length).to.equal(4);
        expect(output.match(/Buzz/g).length).to.equal(4);
    });

    // After: Creating an action
    // Then:
    it('Gives a nice message', async function() {
        
        await system(`${a} ct Foo`).catch(err => console.error(err));
        const output = await system(`${a} ca Bar 15`).catch(err => console.error(err));
        expect(output).to.contain(`Created action, Bar, of duration 15 minutes.`);
    });
    
    // After: Trying to retrieve the template
    // Then:
    it('Shows me the template as it stands', async function () {
        // Create a template
        await system(`${a} ct Foo`).catch(err => console.error(err));
        // Add a couple actions to it
        await system(`${a} ca Bar 15`).catch(err => console.error(err));
        await system(`${a} ca Buzz 30`).catch(err => console.error(err));
        // Retrieve it
        const output = await system(`${a} rt`).catch(err => console.error(err));
        // Should have two actions and two numbers in it.
        expect(output).to.contain('Foo');
        expect(output).to.contain('Bar');
        expect(output).to.contain('Buzz');
        expect(output).to.contain('15');
        expect(output).to.contain('30');
    })
    
    // After: ca <name> <duration> --times=#
    // Then:
    it('Adds as many copies of the actions as I specify ', async function() {
        // Create a template
        await system(`${a} ct Foo`).catch(err => console.error(err));
        // Create the action with the command
        await system(`${a} ca Bar 15 --times=3`).catch(err => console.error(err));
        // Retrieve the template
        const template = await system(`${a} rt`).catch(err => console.error(err));
        // Expect the action to show up many times
        expect(template.match(/Bar/g).length).to.equal(3);
    });
});