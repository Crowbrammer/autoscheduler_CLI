require('dotenv').config();
const dbPath = __dirname + '/../' + process.env.DATABASE_LITE;
const { expect } = require('chai');
const system = require('system-commands');
const a = `node ${__dirname}/../index.js`

describe('UI', async function() {
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
        const whoop = await system(`${a} ca Bar 15`).catch(err => console.error(err));
        console.log(whoop);
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
    
    // After: rm <pos>
    // Then:
    it('Deletes an action at a given position (temp)', async function() {
        // Create a template
        await system(`${a} ct Foo`).catch(err => console.error(err));
        // Create the action with the command
        await system(`${a} ca Bar 15 --times=3`).catch(err => console.error(err));
        // Prove this was done
        let template = await system(`${a} rt`).catch(err => console.error(err));
        expect(template.match(/Bar/g).length).to.equal(3);
        // Delete the action
        await system(`${a} da 3`).catch(err => console.error(err));
        // Assert that the template is empty
        template = await system(`${a} rt`).catch(err => console.error(err));
        expect(template.match(/Bar/g).length).to.equal(2);
    });

    // After: re
    // Then:
    it('Retrieves the current event with time left', async function() {
        // Create a template, actions, schedule
        await system(`${a} ct Foo`).catch(err => console.error(err));
        await system(`${a} ca Bar 15 --times=3`).catch(err => console.error(err));
        await system(`${a} cs`).catch(err => console.error(err));

        // Pull the current event
        let retrievedEvents = await system(`${a} re`).catch(err => console.error(err));
        // Expect it to be the first event and to show how much time is left
        expect(retrievedEvents.match(/\d\d:\d\d/g).length).to.be.greaterThan(1);
        expect(retrievedEvents).to.contain('Bar');
        expect(/14 minutes/.test(retrievedEvents)).to.be.true;
    });

    // After: Creating two actions, then ca --r 1 2 3
    // Then:
    it('Shorthand repeats the two actions three times', async function() {
        
        await system(`${a} ct Foo`).catch(err => console.error(err));
        await system(`${a} ca Bar 15`).catch(err => console.error(err));
        await system(`${a} ca Buzz 30`).catch(err => console.error(err));
        // Create two actions
        // Run the repeat command
        let output = await system(`${a} ca -r 1 2 3`).catch(err => console.error(err));
        expect(output).to.equal('Actions from positions 1 to 2, inclusive, repeated 3 more times.');
        // Create the schedule
        output = await system(`${a} cs`).catch(err => console.error(err));
        // There should nine times and eight actions
        expect(output.match(/\d\d:\d\d/g).length).to.equal(9);
        expect(output.match(/Bar/g).length).to.equal(4);
        expect(output.match(/Buzz/g).length).to.equal(4);
    });

    // After: updating the schedule at a certain position
    // Then:
    it('Recreates the schedule starting just before the selected action', async function() {
        // T, A x3, S
        await system(`${a} ct Foo`).catch(err => console.error(err));
        await system(`${a} ca Bar 15 --times=3`).catch(err => console.error(err));
        await system(`${a} cs`).catch(err => console.error(err));
        // Update at 2
        const update = await system(`${a} us 2`).catch(err => console.error(err));
        const newSchedule = await system(`${a} rs`).catch(err => console.error(err));
        // Only 2 and 3 should be in the schedule
        expect(newSchedule.match(/\d\d:\d\d/g).length).to.equal(3);
        expect(newSchedule.match(/Bar/g).length).to.equal(2);
    });

    // After: ca <name> <duration> <position> 
    // Then: 
    it('Creates an action at a specific condition', async function() {
        // T, A x3, S
        await system(`${a} ct Foo`).catch(err => console.error(err));
        await system(`${a} ca Bar 15 --times=3`).catch(err => console.error(err));
        // Create action at the pos
        await system(`${a} ca Zoo 20 2`).catch(err => console.error(err));
        const atPos = await system(`${a} cs`).catch(err => console.error(err));
        // Bar, Zoo, Bar, Bar
        expect(/Bar[\s\S.]*Zoo[\s\S.]*Bar[\s\S.]*Bar/.test(atPos)).to.be.true;

    });

    // After: Creating two actions, then ca --r 1 2
    // Then:
    it('Repeats it once if undefined', async function() {
        
        await system(`${a} ct Foo`).catch(err => console.error(err));
        await system(`${a} ca Bar 15`).catch(err => console.error(err));
        await system(`${a} ca Buzz 30`).catch(err => console.error(err));
        // Create two actions
        // Run the repeat command
        let output = await system(`${a} ca -r 1 2`).catch(err => console.error(err));
        expect(output).to.equal('Actions from positions 1 to 2, inclusive, repeated 1 more time.');
        // Create the schedule
        output = await system(`${a} cs`).catch(err => console.error(err));
        // There should nine times and eight actions
        expect(output.match(/\d\d:\d\d/g).length).to.equal(5);
        expect(output.match(/Bar/g).length).to.equal(2);
        expect(output.match(/Buzz/g).length).to.equal(2);
    });

});