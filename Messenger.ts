const Autoscheduler = require('./Autoscheduler').default;
const autoscheduler = new Autoscheduler({driver: pQuery});
const esc           = require('sql-escape');
const PQuery        = require('prettyquery');
const pQuery        = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE});

export interface Messenger {
    create();
    retrieve();
    update();
    delete();
    current(); 
}

export class BaseMessenger implements Messenger {
    greeting: string = '\nThank you again for using the autoscheduler. Have a nice day!';
    farewell: string;
    create() {};
    retrieve() {};
    update() {};
    delete() {};
    current() {}; 
}

export class CreateTemplateMessenger extends BaseMessenger implements Messenger {
    msg: string = '';
    async message() {
        console.log(this.greeting);
        this.msg += greeting
        if (!process.argv[3]) {
            await autoscheduler.create.template('');
            this.msg += '\nUnnamed schedule template created and set as current.';
        } else {
            await autoscheduler.create.template(process.argv[3]);
            this.msg += `\nSchedule template named '${process.argv[3]}' created and set as the current template.`;
        }
        this.msg += `\n${this.farewell}`;
    }
}

export class ActionMessenger implements Messenger {

}

export class ScheduleMessenger implements Messenger {

}
