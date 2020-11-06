"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require(`dotenv`).config();
const sqlite3 = require(`sqlite3`);
const open = require(`sqlite`).open;
class CreateTablesMigration {
    driver;
    type;
    constructor(options) {
        this.driver = options.driver;
        this.type = options.type
    }
    async up(loud) {
        if (loud)
            console.log(`Migrating for actions`);
        await this.driver.query(`CREATE TABLE actions (id INTEGER PRIMARY KEY ${this.type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"}, name VARCHAR(255), duration INTEGER, date_created DATETIME DEFAULT (NOW()), date_updated DATETIME DEFAULT (NOW()));`);
        if (loud)
            console.log(`Migrating for schedule_templates`);
        await this.driver.query(`CREATE TABLE schedule_templates (id INTEGER PRIMARY KEY ${this.type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"}, name VARCHAR(255), is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );`);
        if (loud)
            console.log(`Migrating for purposes`);
        await this.driver.query(`CREATE TABLE purposes (id INTEGER PRIMARY KEY ${this.type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"}, name VARCHAR(255), is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );`);
        if (loud)
            console.log(`Migrating for outcomes`);
        await this.driver.query(`CREATE TABLE outcomes (id INTEGER PRIMARY KEY ${this.type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"}, name VARCHAR(255), is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );`);
        if (loud)
            console.log(`Migrating for obstacles`);
        await this.driver.query(`CREATE TABLE obstacles (id INTEGER PRIMARY KEY ${this.type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"}, name VARCHAR(255), is_current BOOLEAN, is_handled BOOLEAN, is_deleted BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );`);
        if (loud)
            console.log(`Migrating for decisions`);
        await this.driver.query(`CREATE TABLE decisions (id INTEGER PRIMARY KEY ${this.type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"}, name VARCHAR(255), is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );`);
        if (loud)
            console.log(`Migrating for schedules`);
        await this.driver.query(`CREATE TABLE schedules (id INTEGER PRIMARY KEY ${this.type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"}, name VARCHAR(255), based_on_template_id INTEGER, is_current BOOLEAN, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );`);
        if (loud)
            console.log(`Migrating for events`);
        await this.driver.query(`CREATE TABLE events (id INTEGER PRIMARY KEY ${this.type === "mysql" ? "AUTO_INCREMENT" : "AUTOINCREMENT"}, summary VARCHAR(255), start DATETIME, end DATETIME, base_action_id INTEGER, date_created DATETIME DEFAULT (NOW()), date_last_used DATETIME DEFAULT (NOW()) );`);
        if (loud)
            console.log(`Migrating for schedule_template_actions`);
        await this.driver.query(`CREATE TABLE schedule_template_actions (schedule_template_id INTEGER, action_id INTEGER, order_num INTEGER, \
                                                    PRIMARY KEY (schedule_template_id, action_id), \
                                                    FOREIGN KEY (schedule_template_id) REFERENCES schedule_templates(id), \
                                                    FOREIGN KEY (action_id) REFERENCES actions(id));`);
        if (loud)
            console.log(`Migrating for schedule_events`);
        await this.driver.query(`CREATE TABLE schedule_events (schedule_id INTEGER, event_id INTEGER, order_num INTEGER, \
                                                    PRIMARY KEY (schedule_id, event_id), \
                                                    FOREIGN KEY (schedule_id) REFERENCES schedules(id), \
                                                    FOREIGN KEY (event_id) REFERENCES events(id));`);
        if (loud)
            console.log(`Migrating for purpose_outcomes`);
        await this.driver.query(`CREATE TABLE purpose_outcomes (purpose_id INTEGER, outcome_id INTEGER, order_num INTEGER, \
                                                    PRIMARY KEY (purpose_id, outcome_id), \
                                                    FOREIGN KEY (purpose_id) REFERENCES purposes(id), \
                                                    FOREIGN KEY (outcome_id) REFERENCES outcomes(id));`);
        if (loud)
            console.log(`Migrating for outcome_obstacles`);
        await this.driver.query(`CREATE TABLE outcome_obstacles (outcome_id INTEGER, obstacle_id INTEGER, order_num INTEGER, \
                                                    PRIMARY KEY (outcome_id, obstacle_id), \
                                                    FOREIGN KEY (outcome_id) REFERENCES outcomes(id), \
                                                    FOREIGN KEY (obstacle_id) REFERENCES obstacles(id));`);
        if (loud)
            console.log(`Migrating for outcome_schedule_templates`);
        await this.driver.query(`CREATE TABLE outcome_schedule_templates (outcome_id INTEGER, schedule_template_id INTEGER, order_num INTEGER, \
                                                    PRIMARY KEY (outcome_id, schedule_template_id), \
                                                    FOREIGN KEY (outcome_id) REFERENCES outcomes(id), \
                                                    FOREIGN KEY (schedule_template_id) REFERENCES schedule_templates(id));`);
        if (loud)
            console.log(`Migrating for obstacle_decisions`);
        await this.driver.query(`CREATE TABLE obstacle_decisions (obstacle_id INTEGER, decision_id INTEGER, order_num INTEGER, \
                                                    PRIMARY KEY (obstacle_id, decision_id), \
                                                    FOREIGN KEY (obstacle_id) REFERENCES obstacles(id), \
                                                    FOREIGN KEY (decision_id) REFERENCES decisions(id));`);
        if (loud)
            console.log(`Migrating for decision_schedule_templates`);
        await this.driver.query(`CREATE TABLE decision_schedule_templates (decision_id INTEGER, schedule_template_id INTEGER, order_num INTEGER, \
                                                    PRIMARY KEY (decision_id, schedule_template_id), \
                                                    FOREIGN KEY (decision_id) REFERENCES decisions(id), \
                                                    FOREIGN KEY (schedule_template_id) REFERENCES schedule_templates(id));`);
        console.log(`Up.`);
    }
    async down(loud) {
        console.log(`Down.`);
        await this.dropTable({ tableName: `decision_schedule_templates`, loud });
        await this.dropTable({ tableName: `obstacle_decisions`, loud });
        await this.dropTable({ tableName: `outcome_schedule_templates`, loud });
        await this.dropTable({ tableName: `outcome_obstacles`, loud });
        await this.dropTable({ tableName: `purpose_outcomes`, loud });
        await this.dropTable({ tableName: `schedule_events`, loud });
        await this.dropTable({ tableName: `schedule_template_actions`, loud });
        await this.dropTable({ tableName: `events`, loud });
        await this.dropTable({ tableName: `schedules`, loud });
        await this.dropTable({ tableName: `decisions`, loud });
        await this.dropTable({ tableName: `obstacles`, loud });
        await this.dropTable({ tableName: `outcomes`, loud });
        await this.dropTable({ tableName: `purposes`, loud });
        await this.dropTable({ tableName: `schedule_templates`, loud });
        await this.dropTable({ tableName: `actions`, loud });
    }
    async dropTable(options) {
        if (options.loud)
            console.log(`Dropping for ${options.table_name}`);
        await this.driver.query(`DROP TABLE IF EXISTS ${options.table_name};`);
    }
    async refresh() {
        console.log(`Refresh.`);
        await this.down();
        await this.up();
    }
}
exports.CreateTablesMigration = CreateTablesMigration;
async function main() {
    const db = await open({
        filename: __dirname + `/database.db`,
        driver: sqlite3.Database
    });
    db.query = db.all;
    const migration = new CreateTablesMigration({ driver: db, type: 'sqlite' });
    console.log(process.argv[2]);
    switch (process.argv[2]) {
        case `up`:
            await migration.up();
            break;
        case `down`:
            await migration.down();
            break;
        case `refresh`:
            await migration.refresh();
            break;
        default:
            break;
    }
}

main().catch(err => console.log(err));