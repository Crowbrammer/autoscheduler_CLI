require('dotenv').config();
const PQuery = require('prettyquery');


async function up(pQuery: any, loud: boolean): Promise<void> {
    if (loud) console.log('Migrating for actions');
    await pQuery.query('CREATE TABLE actions (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), duration INTEGER);');
    if (loud) console.log('Migrating for schedule_templates');
    await pQuery.query('CREATE TABLE schedule_templates (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );');
    if (loud) console.log('Migrating for schedules');
    await pQuery.query('CREATE TABLE schedules (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );');
    if (loud) console.log('Migrating for events');
    await pQuery.query('CREATE TABLE events (id INTEGER PRIMARY KEY AUTO_INCREMENT, summary VARCHAR(255), start DATETIME, end DATETIME, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );');
    if (loud) console.log('Migrating for schedule_template_actions');
    await pQuery.query('CREATE TABLE schedule_template_actions (action_id INTEGER, schedule_template_id INTEGER, order_num INTEGER, \
                                                PRIMARY KEY (action_id, schedule_template_id), \
                                                FOREIGN KEY (action_id) REFERENCES actions(id), \
                                                FOREIGN KEY (schedule_template_id) REFERENCES schedule_templates(id));');
    if (loud) console.log('Migrating for schedule_events');
    await pQuery.query('CREATE TABLE schedule_events (schedule_id INTEGER, event_id INTEGER, order_num INTEGER, \
                                                PRIMARY KEY (schedule_id, event_id), \
                                                FOREIGN KEY (schedule_id) REFERENCES schedules(id), \
                                                FOREIGN KEY (event_id) REFERENCES events(id));');
}

async function down(pQuery: any, loud: boolean): Promise<void> {
    await dropTable(loud, pQuery, 'schedule_events');
    await dropTable(loud, pQuery, 'schedule_template_actions');
    await dropTable(loud, pQuery, 'events');
    await dropTable(loud, pQuery, 'schedules');
    await dropTable(loud, pQuery, 'schedule_templates');
    await dropTable(loud, pQuery, 'actions');
}

async function dropTable(loud: boolean, pQuery: any, table_name: string) {
    if (loud)
    console.log(`Dropping for ${table_name}`);
    await pQuery.query(`DROP TABLE IF EXISTS ${table_name};`);
}

async function refresh(pQuery: any, loud: boolean): Promise<void> {
    await down(pQuery, loud);
    await up(pQuery, loud);
}

async function main(isTest:boolean, loud: boolean): Promise<void> {
    let pQuery = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: 'localhost'});
    await pQuery.useDb('autoscheduler');
    await refresh(pQuery, loud);
    pQuery.connection.end();
}

if (require.main === module) {
    if (/l|(loud)/i.test(process.argv[2])) {
        main('loud').catch(err => console.error(err));
    } else {
        main().catch(err => console.error(err));
    }
}


delete require.cache[module.id];
module.exports = main;

/**
 * Adding a new one
 * Removing
 * Moving a different
 */