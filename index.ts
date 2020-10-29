require('dotenv').config({path: __dirname + '/.env'});
const PQuery = require('prettyquery');
const esc = require('sql-escape');
// const Schedule = require('./Schedule').default;
const Autoscheduler = require('./Autoscheduler').default;
const greeting = '\nThank you for using the Autoscheduler.'
const farewell = '\nThank you again for using the autoscheduler. Have a nice day!'

async function main() {
    const pQuery = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE});
    const query = pQuery.query;
    const autoscheduler = new Autoscheduler({driver: pQuery});
    const currentTemplate = await autoscheduler.retrieve.current.template();
    let schedule;
    let ct;
    switch (process.argv[2]) {
        case 'ct': // Create template
            console.log(greeting);
            if (!process.argv[3]) {
                await autoscheduler.create.template('');
                console.log('Unnamed schedule template created and set as current.')
            } else {
                await autoscheduler.create.template(process.argv[3]);
                console.log(`Schedule template named '${process.argv[3]}' created and set as the current template.`)
            }
            console.log(farewell);
            break;
        case 'ca': // Create action
            const actionName = process.argv[3]
            if (/\D+/.test(process.argv[4])) {
                console.log('Must put a number-only duration as the fourth argument');
                process.exit(0);
            } 
            await autoscheduler.create.action(process.argv[3], process.argv[4]);
            console.log(`\nAction, '${actionName}', added to the template named '${currentTemplate.name}'`);
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
        case 'cs': // Create schedule
            schedule = await autoscheduler.create.schedule();
            console.log(greeting);
            console.log('\nSchedule created for the template named \'' + schedule.template.name + '\'.');
            console.log('------');
            console.log(schedule.events[0].start.time)
            ct = 1
            schedule.events.forEach(event => {
                console.log(` ${ct++}. ${event.summary}`);
                console.log(event.end.time);
            });
            console.log('------');
            console.log(farewell)
            break;
        case 'ra': // Retrieve actions
            console.log(greeting);
            console.log('\nHere are the actions for template:', currentTemplate.name);
            console.log('------')
            const scheduleTemplateActions = await autoscheduler.retrieve.related.actions();
            scheduleTemplateActions.forEach(async action => {
                console.log(`  ${action.order_num} - ${action.name} for ${action.duration}mins`);
            });
            console.log('------')
            console.log(farewell);
            break;
        default:
            break;
    }
    // switch (process.argv[2]) {
    //     case 'make':
    //         let currentTemplate;
    //         let outcomeId;
    //         switch (process.argv[3]) {
    //             case 'purpose':
    //                 const purpose = process.argv[4];
    //                 await pQuery.query('UPDATE purposes SET is_current = false');
    //                 const purposeId = (await pQuery.query(`INSERT INTO purposes (name, is_current) VALUES ('${purpose}', true)`)).insertId;
    //                 console.log('\nPurpose added:')
    //                 console.log(`Name: ${purpose}`);
    //                 console.log(`Id: ${purposeId}`);
    //                 break;
    //             case 'outcome':
    //                 const outcome = process.argv[4];
    //                 await pQuery.query('UPDATE outcomes SET is_current = false');
    //                 outcomeId = (await pQuery.query(`INSERT INTO outcomes (name, is_current) VALUES ('${outcome}', true)`)).insertId;
    //                 const currentPurposes = (await pQuery.query(`SELECT id FROM purposes WHERE is_current = true`));
    //                 if (currentPurposes.length === 0 ) {
    //                     console.log('Set a purpose before setting an outcome.');
    //                     process.exit(0);
    //                 }
    //                 const currentPurpose = currentPurposes[0];
    //                 await pQuery.insert('purpose_outcomes', ['purpose_id', 'outcome_id'], [[currentPurpose.id, outcomeId]]);
    //                 console.log('\nOutcome added:')
    //                 console.log(`Under purpose: ${currentPurpose.name}`);
    //                 console.log(`Name: ${outcome}`);
    //                 console.log(`Id: ${outcomeId}`);
    //                 break;
    //             case 'template':
    //                 const scheduleTemplateName = process.argv[4]
    //                 // Pull up the last schedule template and obsolete it.
    //                 await pQuery.query('UPDATE schedule_templates SET is_current = false');
    //                 const scheduleTemplateId = (await pQuery.query(`INSERT INTO schedule_templates (name, is_current) VALUES ('${scheduleTemplateName}', true)`)).insertId;
    //                 console.log('\nSchedule template added:')
    //                 console.log(`Name: ${scheduleTemplateName}`);
    //                 // console.log(`Id: ${outcomeId}`);
    //                 break;
    //             case 'action':
                    // const actionName = process.argv[4]
                    // if (/\D+/.test(process.argv[5])) {
                    //     console.log('Must put a number-only duration as the fourth argument');
                    //     process.exit(0);
                    // } 
                    // const duration = process.argv[5];
                    // const actionId = (await pQuery.query(`INSERT INTO actions (name, duration) VALUES ('${actionName}', ${duration})`)).insertId;
                    // // Link to the current schedule template;
                    // currentTemplate = (await pQuery.query('SELECT id, name FROM schedule_templates WHERE is_current = true'))[0];
                    // // Put the action at the end of the list. Need the count for this.
                    // const templateActionCount = (await pQuery.query(`SELECT COUNT(*) stas FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplate.id}`))[0].stas;
                    // await pQuery.insert('schedule_template_actions', ['schedule_template_id', 'action_id', 'order_num'], [[currentTemplate.id, actionId, templateActionCount]]);
                    // console.log(`\nAction, '${actionName}', added to the template named '${currentTemplate.name}' at position ${templateActionCount}`);
                    // break;
    //             case 'schedule':
    //                 currentTemplate = (await pQuery.query('SELECT id, name FROM schedule_templates WHERE is_current = true'))[0];
    //                 if (!currentTemplate) {
    //                     console.log('Set the current template before scheduling');
    //                     process.exit(0);
    //                 }
    //                 // Take the actions at the current schedule...
    //                 const scheduleTemplateActions = await pQuery.query(`SELECT a.name, a.duration FROM actions a \
    //                                                         INNER JOIN schedule_template_actions sta ON a.id = sta.action_id \
    //                                                         INNER JOIN schedule_templates st ON sta.schedule_template_id = st.id \
    //                                                         WHERE sta.schedule_template_id = ${currentTemplate.id} ORDER BY sta.order_num`);
                    
    //                 if (scheduleTemplateActions.length === 0) {
    //                     console.log('Make actions for the template before scheduling');
    //                     process.exit(0);
    //                 }
    //                 const schedule = new Schedule(scheduleTemplateActions, currentTemplate.id, currentTemplate.name);
    //                 await schedule.save();
    //                 console.log(`\nSchedule from template named '${currentTemplate.name}'\n`);
    //                 console.log(schedule.niceDisplay());
    //             default:
    //                 break;
    //         }
    //         break;
    //     case 'set':
    //         switch (process.argv[3]) {
    //             case 'template':
    //                 // Should do some search function to decide what past template to use.
                    
            
    //             default:
    //                 break;
    //         }
    //         break;
    //     case 'help':
    //         const fs = require('fs');
    //         const man = fs.readFileSync(__dirname + '/help.txt', 'utf8');
    //         console.log();
    //         console.log(man);
    //         break;

    //     default:
    //         break;
    // }
    pQuery.connection.end();
    process.exit(0);
}

main().catch(err => console.error(err));