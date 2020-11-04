require('dotenv').config({path: __dirname + '/.env'});
const PQuery        = require('prettyquery');
const pQuery        = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE});
const Autoscheduler = require('./Autoscheduler').default;
const autoscheduler = new Autoscheduler({driver: pQuery});
const esc           = require('sql-escape');
const farewell      = '\nThank you again for using the autoscheduler. Have a nice day!'
const greeting      = '\nThank you for using the Autoscheduler.'
import { CreateTemplateMessenger, 
         CreateActionMessenger,
         Messenger, 
         CreateScheduleMessenger,
         ReorderActionsMessenger,
         RetrieveActionsMessenger} from './Messenger';


async function main() {
    const currentTemplate = await autoscheduler.retrieve.current.template();
    let schedule = await autoscheduler.retrieve.current.schedule();
    let ct;
    let messenger: Messenger;

    switch (process.argv[2]) {
        case 'ct': // Create template
            messenger = new CreateTemplateMessenger({templateName: process.argv[3]});
            break;
        case 'ca': // Create action
            if (/\D+/.test(process.argv[4])) {
                console.log('Must put a number-only duration as the fourth argument');
                process.exit(0);
            } 
            messenger = new CreateActionMessenger({currentTemplate, actionName: process.argv[3], actionDuration: process.argv[4], actionOrder: process.argv[5]});
            break;
        case 'cs': // Create schedule
            messenger = new CreateScheduleMessenger();
            break;

        case 'ut':
            switch (process.argv[3]) {
                case 'reorder':
                    messenger = new ReorderActionsMessenger({currentTemplate, actionAt: process.argv[4], moveTo: process.argv[5]});
                    break;
            
                default:
                    break;
            }
            break;
        case 'us': // Update schedule
            if (/\D+/.test(process.argv[3])) throw new Error('Yo. Need a number for the update, yo.');
            schedule = await autoscheduler.update.schedule(process.argv[3]);
            console.log(greeting);
            console.log('\nSchedule updated for the template named \'' + schedule.template.name + '\'.');
            console.log('------');
            console.log(schedule.events[0].start.time);
            ct = 1;
            schedule.events.forEach(event => {
                console.log(` ${ct++}. ${event.summary}`);
                console.log(event.end.time);
            });
            console.log('------');
            console.log(farewell);
            break;
        
        case 'ra': // Retrieve actions
            messenger = new RetrieveActionsMessenger({currentTemplate});
            break;
        case 'rt': // Retrieve template
            console.log(greeting);
            console.log(`\nCurrent actions for template: ${currentTemplate.name}`)
            console.log('------');
            const actions = await autoscheduler.retrieve.related.actions();
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                console.log(`  ${i + 1}  - ${action.name} for ${action.duration} min`);
            }
            console.log('------');
            console.log(farewell);
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
                console.log(scheduledEvents[0].start.slice(11, 16));
                ct = 1;
                scheduledEvents.forEach(event => {
                    console.log(` ${ct++}. ${event.summary}`);
                    console.log(event.end.toLocaleTimeString());
                });
            } else {
                console.log('\nThere are no events scheduled')
            }
            
            console.log('------')
            console.log(farewell);
            break;
        case 'da':
            console.log(greeting)
            if (/\D+/.test(process.argv[3]))
                throw new Error('Select an action to delete with a number');
            const relatedActions = await autoscheduler.retrieve.related.actions();
            autoscheduler.delete.action(relatedActions[Number(process.argv[3]) - 1].id); // The ordered actions are 1-indexed;
            console.log(farewell)
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
    if (messenger) console.log(await messenger.message());
    pQuery.connection.end();
    process.exit(0);
}

main().catch(err => console.error(err));