require('dotenv').config({path: __dirname + '/../.env'});
const PQuery = require('prettyquery');


export default async function up(pQuery: any, loud: boolean): Promise<void> {
    if (loud) console.log('Migrating for actions');
    await pQuery.query('CREATE TABLE actions (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), duration INTEGER, date_created DATETIME DEFAULT (NOW()), date_updated DATETIME DEFAULT (NOW()));');
    if (loud) console.log('Migrating for schedule_templates');
    await pQuery.query('CREATE TABLE schedule_templates (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()), is_deleted BOOLEAN );');
    if (loud) console.log('Migrating for purposes');
    await pQuery.query('CREATE TABLE purposes (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );');
    if (loud) console.log('Migrating for outcomes');
    await pQuery.query('CREATE TABLE outcomes (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );');
    if (loud) console.log('Migrating for obstacles');
    await pQuery.query('CREATE TABLE obstacles (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), is_current BOOLEAN, is_handled BOOLEAN, is_deleted BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );');
    if (loud) console.log('Migrating for decisions');
    await pQuery.query('CREATE TABLE decisions (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );');
    if (loud) console.log('Migrating for schedules');
    await pQuery.query('CREATE TABLE schedules (id INTEGER PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), based_on_template_id INTEGER, is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );');
    if (loud) console.log('Migrating for events');
    await pQuery.query('CREATE TABLE events (id INTEGER PRIMARY KEY AUTO_INCREMENT, summary VARCHAR(255), start DATETIME, end DATETIME, base_action_id INTEGER, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );');
    if (loud) console.log('Migrating for schedule_template_actions');
    await pQuery.query('CREATE TABLE schedule_template_actions (schedule_template_id INTEGER, action_id INTEGER, order_num INTEGER, \
                                                PRIMARY KEY (schedule_template_id, action_id), \
                                                FOREIGN KEY (schedule_template_id) REFERENCES schedule_templates(id), \
                                                FOREIGN KEY (action_id) REFERENCES actions(id));');
    if (loud) console.log('Migrating for schedule_events');
    await pQuery.query('CREATE TABLE schedule_events (schedule_id INTEGER, event_id INTEGER, order_num INTEGER, \
                                                PRIMARY KEY (schedule_id, event_id), \
                                                FOREIGN KEY (schedule_id) REFERENCES schedules(id), \
                                                FOREIGN KEY (event_id) REFERENCES events(id));');
    if (loud) console.log('Migrating for purpose_outcomes');
    await pQuery.query('CREATE TABLE purpose_outcomes (purpose_id INTEGER, outcome_id INTEGER, order_num INTEGER, \
                                                PRIMARY KEY (purpose_id, outcome_id), \
                                                FOREIGN KEY (purpose_id) REFERENCES purposes(id), \
                                                FOREIGN KEY (outcome_id) REFERENCES outcomes(id));');
    if (loud) console.log('Migrating for outcome_obstacles');
    await pQuery.query('CREATE TABLE outcome_obstacles (outcome_id INTEGER, obstacle_id INTEGER, order_num INTEGER, \
                                                PRIMARY KEY (outcome_id, obstacle_id), \
                                                FOREIGN KEY (outcome_id) REFERENCES outcomes(id), \
                                                FOREIGN KEY (obstacle_id) REFERENCES obstacles(id));');
    if (loud) console.log('Migrating for outcome_schedule_templates');
    await pQuery.query('CREATE TABLE outcome_schedule_templates (outcome_id INTEGER, schedule_template_id INTEGER, order_num INTEGER, \
                                                PRIMARY KEY (outcome_id, schedule_template_id), \
                                                FOREIGN KEY (outcome_id) REFERENCES outcomes(id), \
                                                FOREIGN KEY (schedule_template_id) REFERENCES schedule_templates(id));');
    if (loud) console.log('Migrating for obstacle_decisions');
    await pQuery.query('CREATE TABLE obstacle_decisions (obstacle_id INTEGER, decision_id INTEGER, order_num INTEGER, \
                                                PRIMARY KEY (obstacle_id, decision_id), \
                                                FOREIGN KEY (obstacle_id) REFERENCES obstacles(id), \
                                                FOREIGN KEY (decision_id) REFERENCES decisions(id));');
    if (loud) console.log('Migrating for decision_schedule_templates');
    await pQuery.query('CREATE TABLE decision_schedule_templates (decision_id INTEGER, schedule_template_id INTEGER, order_num INTEGER, \
                                                PRIMARY KEY (decision_id, schedule_template_id), \
                                                FOREIGN KEY (decision_id) REFERENCES decisions(id), \
                                                FOREIGN KEY (schedule_template_id) REFERENCES schedule_templates(id));');
}

async function down(pQuery: any, loud: boolean): Promise<void> {
    await dropTable(loud, pQuery, 'decision_schedule_templates');
    await dropTable(loud, pQuery, 'obstacle_decisions');
    await dropTable(loud, pQuery, 'outcome_schedule_templates');
    await dropTable(loud, pQuery, 'outcome_obstacles');
    await dropTable(loud, pQuery, 'purpose_outcomes');
    await dropTable(loud, pQuery, 'schedule_events');
    await dropTable(loud, pQuery, 'schedule_template_actions');
    await dropTable(loud, pQuery, 'events');
    await dropTable(loud, pQuery, 'schedules');
    await dropTable(loud, pQuery, 'decisions');
    await dropTable(loud, pQuery, 'obstacles');
    await dropTable(loud, pQuery, 'outcomes');
    await dropTable(loud, pQuery, 'purposes');
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
    await pQuery.useDb(process.env.DATABASE);
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