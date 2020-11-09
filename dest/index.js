"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config({ path: __dirname + '/../.env' });
/**
 * This won't be needed soon. It'll be in the messengers after a while.
 */
const farewell = '\nThank you again for using the autoscheduler. Have a nice day!';
const greeting = '\nThank you for using the Autoscheduler.';
/**
 * I'm trying to isolate my code ig. It felt cleaner this way rather
 * than having a whole pile of unencapsulated code.
 */
const Messenger_1 = require("./Messenger");
async function main() {
    /**
     * So that I can use this anywhere, I made it able to use SQLite in addition
     * to MySQL. This require some config.
     */
    let driver;
    if (process.env.DB_DRIVER === 'sqlite') {
        const sqlite3 = require('sqlite3');
        const { open } = require('sqlite');
        driver = await open({
            filename: __dirname + '/db/sqlite/database.db',
            driver: sqlite3.Database
        });
        driver.query = function (query) {
            if (/INSERT/.test(query)) {
                return this.run(query);
            }
            else {
                return this.all(query);
            }
        };
    }
    else {
        const PQuery = require('prettyquery');
        driver = new PQuery({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE });
    }
    /**
     * PQuery or prettyquery is a Node.js MySQL promise-basde package
     * I made because I didn't find anything satisfactory at the time.
     */
    /**
     * The Autoscheduler's a bunch of CRUD functions composed together.
     * I feel like it's an example of a Model in MCV apps.
     */
    const Autoscheduler = require('./Autoscheduler').default;
    const autoscheduler = new Autoscheduler({ driver });
    /**
     * The db driver needs to be consistent, and adding a static property
     * that all the Messenger classes refer to seems like the best way
     * to have everyone refer to the same autoscheduler with the same
     * driver instance. Maybe I should turn the autoscheduler into a singleton...
     */
    Messenger_1.BaseMessenger.autoscheduler = autoscheduler;
    const currentTemplate = await autoscheduler.retrieve.current.template();
    let schedule = await autoscheduler.retrieve.current.schedule();
    let ct;
    let messenger;
    switch (process.argv[2]) {
        case 'ct': // Create template
            messenger = new Messenger_1.CreateTemplateMessenger({ templateName: process.argv[3] });
            break;
        case 'ca': // Create action
            if (/\D+/.test(process.argv[4])) {
                console.log('Must put a number-only duration as the fourth argument');
                process.exit(0);
            }
            messenger = new Messenger_1.CreateActionMessenger({ currentTemplate, actionName: process.argv[3], actionDuration: process.argv[4], actionOrder: process.argv[5] });
            break;
        case 'cs': // Create schedule
            messenger = new Messenger_1.CreateScheduleMessenger();
            break;
        case 'ut': // Update template
            switch (process.argv[3]) {
                case 'reorder':
                    messenger = new Messenger_1.ReorderActionsMessenger({ currentTemplate, actionAt: process.argv[4], moveTo: process.argv[5] });
                    break;
                default:
                    break;
            }
            break;
        case 'us': // Update schedule
            if (/\D+/.test(process.argv[3]))
                throw new Error('Yo. Need a number for the update, yo.');
            messenger = new Messenger_1.UpdateScheduleMessenger({ actionNum: process.argv[3] });
            break;
        case 'ra': // Retrieve actions
            messenger = new Messenger_1.RetrieveActionsMessenger({ currentTemplate });
            break;
        case 'rt': // Retrieve template
            messenger = new Messenger_1.RetrieveTemplateMessenger({ currentTemplate });
            break;
        case 'rs': // Retrieve schedule
            console.log(greeting);
            if (!schedule) {
                console.log('\nNo current schedule available.');
                break;
            }
            console.log('\nHere are the events for schedule:', currentTemplate.name);
            console.log('------');
            const scheduledEvents = await autoscheduler.retrieve.related.events(); // Normal schedule API not available like when building.
            if (scheduledEvents.length > 0) {
                console.log(scheduledEvents[0].start);
                // console.log(new Date(scheduledEvents[0].start).toLocaleTimeString());
                ct = 1;
                scheduledEvents.forEach(event => {
                    console.log(` ${ct++}. ${event.summary}`);
                    console.log(event.end);
                    // console.log(new Date(event.end).toLocaleTimeString());
                });
            }
            else {
                console.log('\nThere are no evtents scheduled');
            }
            console.log('------');
            console.log(farewell);
            break;
        case 're': // Retrieve (current) event
            console.log('Here\'s the current event:');
            const currentEvent = await autoscheduler.driver.query(`SELECT summary, start, end FROM schedule_events se \
                                                             INNER JOIN events e on se.event_id = e.id
                                                             WHERE se.schedule_id = ${schedule.id} \
                                                             AND NOW() < end;`);
            // const nowish = await autoscheduler.driver.query('SELECT NOW();');                                                             
            // console.log(nowish);
            console.log(currentEvent);
            break;
        case 'da': // Delete action
            console.log(greeting);
            if (/\D+/.test(process.argv[3]))
                throw new Error('Select an action to delete with a number');
            const relatedActions = await autoscheduler.retrieve.related.actions();
            autoscheduler.delete.action(relatedActions[Number(process.argv[3]) - 1].id); // The ordered actions are 1-indexed;
            console.log(farewell);
            break;
        case 'help':
            const fs = require('fs');
            const man = fs.readFileSync(__dirname + '/help.txt', 'utf8');
            console.log();
            console.log(man);
            break;
        default:
            break;
    }
    if (messenger)
        console.log(await messenger.message());
    try {
        autoscheduler.driver.connection.end();
    }
    catch (err) {
        autoscheduler.driver.close();
    }
    process.exit(0);
}
main().catch(err => console.error(err));
