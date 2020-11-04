"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PQuery = require('prettyquery');
const pQuery = new PQuery({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE });
const Autoscheduler = require('./Autoscheduler').default;
const autoscheduler = new Autoscheduler({ driver: pQuery });
const esc = require('sql-escape');
class BaseMessenger {
    constructor() {
        this.greeting = '\nThank you for using the Autoscheduler.';
        this.farewell = 'Thank you again for using the autoscheduler. Have a nice day!';
    }
    message() { }
}
exports.BaseMessenger = BaseMessenger;
class CreateTemplateMessenger extends BaseMessenger {
    constructor(options) {
        super();
        this.msg = '';
        this.templateName = options.templateName;
    }
    async message() {
        this.msg += `${this.greeting}`;
        if (!process.argv[3]) {
            await autoscheduler.create.template('');
            this.msg += '\n\nUnnamed schedule template created and set as current.';
        }
        else {
            await autoscheduler.create.template(this.templateName);
            this.msg += `\n\nSchedule template named '${this.templateName}' created and set as the current template.`;
        }
        this.msg += `\n\n${this.farewell}`;
        return this.msg;
    }
}
exports.CreateTemplateMessenger = CreateTemplateMessenger;
class CreateActionMessenger extends BaseMessenger {
    constructor(options) {
        super();
        this.msg = '';
        this.actionName = options.actionName;
        this.actionDuration = options.actionDuration;
        this.actionOrder = options.actionOrder;
        this.currentTemplate = options.currentTemplate;
    }
    async message() {
        this.msg += `${this.greeting}`;
        await autoscheduler.create.action(this.actionName, this.actionDuration); // FIXME: Bad variable name workaround for switch-case scoping
        if (!/\D+/.test(this.actionOrder)) { // If a number-only fifth argument, place it there...
            const orderNum = (await autoscheduler.retrieve.related.actions()).length;
            await autoscheduler.update.template({ signal: 'reorder', actionAt: orderNum, moveTo: this.actionOrder });
            this.msg += `\nAction, '${this.actionName}', added to the template named '${this.currentTemplate.name} at position ${this.actionOrder}'`;
        }
        else {
            this.msg += `\n\nAction, '${this.actionName}', added to the template named '${this.currentTemplate.name}'`;
        }
        this.msg += `\n\n${this.farewell}`;
        return this.msg;
    }
}
exports.CreateActionMessenger = CreateActionMessenger;
