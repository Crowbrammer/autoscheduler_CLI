const PQuery        = require('prettyquery');
const pQuery        = new PQuery({user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE});
const Autoscheduler = require('./Autoscheduler').default;
const autoscheduler = new Autoscheduler({driver: pQuery});
const esc           = require('sql-escape');

export interface Messenger {
    message();
}

export class BaseMessenger implements Messenger {
    message() {}
    greeting: string = '\nThank you for using the Autoscheduler.';
    farewell: string = 'Thank you again for using the autoscheduler. Have a nice day!';
}

export class CreateTemplateMessenger extends BaseMessenger {
    templateName: string;
    constructor(options) {
        super();
        this.templateName = options.templateName;
    }
    msg: string = '';
    async message() {
        this.msg += `${this.greeting}`;
        if (!process.argv[3]) {
            await autoscheduler.create.template('');
            this.msg += '\n\nUnnamed schedule template created and set as current.';
        } else {
            await autoscheduler.create.template(this.templateName);
            this.msg += `\n\nSchedule template named '${this.templateName}' created and set as the current template.`;
        }
        this.msg += `\n\n${this.farewell}`;
        return this.msg;
    }
}

export class CreateActionMessenger extends BaseMessenger {
    actionName: string;
    actionDuration: string;
    actionOrder: any;
    currentTemplate: any;
    constructor(options) {
        super();
        this.actionName = options.actionName;
        this.actionDuration = options.actionDuration;
        this.actionOrder = options.actionOrder
        this.currentTemplate = options.currentTemplate;
    }
    msg: string = '';
    async message() {
        this.msg += `${this.greeting}`
            await autoscheduler.create.action(this.actionName, this.actionDuration); // FIXME: Bad variable name workaround for switch-case scoping
            if (!/\D+/.test(this.actionOrder)) {// If a number-only fifth argument, place it there...
                const orderNum = (await autoscheduler.retrieve.related.actions()).length;
                await autoscheduler.update.template({signal: 'reorder', actionAt: orderNum, moveTo: this.actionOrder});
                this.msg += `\nAction, '${this.actionName}', added to the template named '${this.currentTemplate.name} at position ${this.actionOrder}'`;
            } else {
                this.msg += `\n\nAction, '${this.actionName}', added to the template named '${this.currentTemplate.name}'`;
            }
        this.msg += `\n\n${this.farewell}`;
        return this.msg;
    }
}

