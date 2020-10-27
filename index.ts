require('dotenv').config({path: __dirname + '/.env'});
const PQuery = require('prettyquery');
const esc = require('sql-escape');
const Schedule = require('./Schedule').default;

async function main() {
    const pQuery = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE});
    let num;

    switch (process.argv[2]) {
        case 'make':
            let currentTemplate;
            switch (process.argv[3]) {
                case 'template':
                    const scheduleTemplateName = process.argv[4]
                    // Pull up the last schedule template and obsolete it.
                    await pQuery.query('UPDATE schedule_templates SET is_current = false');
                    const outcomeId = (await pQuery.query(`INSERT INTO schedule_templates (name, is_current) VALUES ('${scheduleTemplateName}', true)`)).insertId;
                    console.log('\nSchedule template added:')
                    console.log(`Name: ${scheduleTemplateName}`);
                    console.log(`Id: ${outcomeId}`);
                    break;
                case 'action':
                    const actionName = process.argv[4]
                    if (/\D+/.test(process.argv[5]) {
                        console.log('Must put a number-only duration as the fourth argument');
                        process.exit(0);
                    } 
                    const duration = process.argv[5];
                    const actionId = (await pQuery.query(`INSERT INTO actions (name, duration) VALUES ('${actionName}', ${duration})`)).insertId;
                    // Link to the current schedule template;
                    currentTemplate = (await pQuery.query('SELECT id, name FROM schedule_templates WHERE is_current = true'))[0];
                    // Put the action at the end of the list. Need the count for this.
                    const templateActionCount = (await pQuery.query(`SELECT COUNT(*) stas FROM schedule_template_actions WHERE schedule_template_id = ${currentTemplate.id}`))[0].stas;
                    await pQuery.insert('schedule_template_actions', ['schedule_template_id', 'action_id', 'order_num'], [[currentTemplate.id, actionId, templateActionCount]]);
                    console.log(`\nAction, '${actionName}', added to the template named '${currentTemplate.name}' at position ${templateActionCount}`);
                    break;
                case 'schedule':
                    currentTemplate = (await pQuery.query('SELECT id, name FROM schedule_templates WHERE is_current = true'))[0];
                    if (!currentTemplate) {
                        console.log('Set the current template before scheduling');
                        process.exit(0);
                    }
                    // Take the actions at the current schedule...
                    const scheduleTemplateActions = await pQuery.query(`SELECT a.name, a.duration FROM actions a \
                                                            INNER JOIN schedule_template_actions sta ON a.id = sta.action_id \
                                                            INNER JOIN schedule_templates st ON sta.schedule_template_id = st.id \
                                                            WHERE sta.schedule_template_id = ${currentTemplate.id} ORDER BY sta.order_num`);
                    
                    if (scheduleTemplateActions.length === 0) {
                        console.log('Make actions for the template before scheduling');
                        process.exit(0);
                    }
                    const schedule = new Schedule(scheduleTemplateActions, currentTemplate.id, currentTemplate.name);
                    await schedule.save();
                    console.log(`\nSchedule from template named '${currentTemplate.name}'\n`);
                    console.log(schedule.niceDisplay());
                default:
                    break;
            }
            break;
        case 'set':
            switch (process.argv[3]) {
                case 'template':
                    // Should do some search function to decide what past template to use.
                    
            
                default:
                    break;
            }
            break;
        case 'help':
            const fs = require('fs');
            const man = fs.readFileSync(__dirname + '/help.txt', 'utf8');
            console.log();
            console.log(man);
            break;
        // case 'add-template':
            
        
        // // set new outcome
        // case 'add': 
        //     if (!process.argv[4]) {
        //         console.log('Please add a duration after your action');
        //         process.exit(0);
        //     } else {
        //         if (/\D+/.test(process.argv[4])) {
        //             console.log('Please only add numbers to the duration');
        //             process.exit(0);
        //         } 
        //     }
        //     const actionId = (await pQuery.query(`INSERT INTO actions (name, duration) VALUES ('${process.argv[3]}', '${process.argv[4]}')`)).insertId;
        //     const currentScheduleTemplateId = (await pQuery.query(`SELECT id FROM current_schedule_template LIMIT 1`))[0].id;
        //     await pQuery.insert('schedule_template_actions', ['schedule_template_id', 'action_id'], [[currentScheduleTemplateId, actionId]]);
        //     console.log(`Added the action, '${process.argv[3]}', of duration, '${process.argv[4]}' to outcome ${currentScheduleTemplateId}`);
        //     break;
        // case 'current':

        //     if (process.argv[3] === 'schedule') {
        //         const schedule = await pQuery.query('SELECT * FROM schedules ORDER BY id DESC LIMIT 1');
        //         if (schedule.length === 0) {
        //             console.log('No schedules yet');
        //             process.exit(0);
        //         } else {
        //             console.log(schedule);
        //         }
        //     } else {
        //         const current = await pQuery.query('SELECT * FROM current_schedule_template LIMIT 1');
        //         if (current.length === 0) {
        //             console.log('No schedule template is set as the current');
        //             process.exit(0);
        //         }
        //         const currentScheduleTemplate = (await pQuery.query(`SELECT * FROM schedule_templates WHERE id = ${current[0].current_id}`))[0]
        //         console.log('\nCurrent schedule_template:', currentScheduleTemplate.name);
        //         console.log('Actions:\n');
                // const scheduleTemplateActions = await pQuery.query(`SELECT a.name, a.duration FROM actions a \
                //                                             INNER JOIN schedule_template_actions sta ON a.id = sta.action_id \
                //                                             INNER JOIN schedule_templates st ON sta.schedule_template_id = st.id \
                //                                             WHERE sta.schedule_template_id = ${currentScheduleTemplate.id} ORDER BY sta.order_num`);
        //         scheduleTemplateActions.forEach(sta => console.log(`'${sta.name}' for ${sta.duration} minutes`));
        //     }
            
        //     break;
        // case 'prev':
        //     if (/--amt/.test(process.argv[3])) {
        //         if (/all/.test(process.argv[3])) {
        //             num = 'all';
        //         } else {
        //             num = /\d+/.exec(process.argv[3])[0];
        //             num ? true : num = 10;
        //         }
        //     } else {
        //         num = 10;
        //     }

        //     let scheduleTemplates;
        //     if (num === 'all') {
        //         scheduleTemplates = await pQuery.query(`SELECT * FROM schedule_templates ORDER BY id DESC;`); // gsus! 
        //     } else {
        //         scheduleTemplates = await pQuery.query(`SELECT * FROM schedule_templates ORDER BY id DESC LIMIT ${num};`); // gsus! 
        //     }

        //     console.log('\nPrevious schedule templates:\n');
        //     scheduleTemplates.forEach(st => console.log(`'${st.name}' on:`, st.datetime_submitted));
        //     break;
        // case 'schedule':
        //     const current = await pQuery.query('SELECT * FROM current_schedule_template LIMIT 1');
        //     if (current.length === 0) {
        //         console.log('No schedule template is set as the current');
        //         process.exit(0);
        //     }
        //     const currentScheduleTemplate = (await pQuery.query(`SELECT * FROM schedule_templates WHERE id = ${current[0].current_id}`))[0]
        //     console.log('\nCurrent schedule_template:', currentScheduleTemplate.name);
        //     console.log('Actions:\n');
        //     const scheduleTemplateActions = await pQuery.query(`SELECT a.name, a.duration FROM actions a \
        //                                                 INNER JOIN schedule_template_actions sta ON a.id = sta.action_id \
        //                                                 INNER JOIN schedule_templates st ON sta.schedule_template_id = st.id \
        //                                                 WHERE sta.schedule_template_id = ${currentScheduleTemplate.id} ORDER BY sta.order_num`);
        //     const schedule = new Schedule(scheduleTemplateActions);
        //     schedule.events.forEach(sta => console.log(`'${sta.name}' for ${sta.duration} minutes`));
        // case 'count':
            // const count = (await pQuery.query(`SELECT COUNT(*) num_schedule_templates FROM gratitude;`))[0].num_schedule_templates; 
            // console.log(`\nI have ${count} schedule templates recorded.\n`);
            // break;
        default:
            // await pQuery.insert('gratitude', ['grateful_for'], [[process.argv[2]]]);
            // console.log(`Was grateful for: ${process.argv[2]}`);
            break;
    }
    pQuery.connection.end();
    process.exit(0);
}

main().catch(err => console.error(err));