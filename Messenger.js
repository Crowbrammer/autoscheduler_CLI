"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PQuery = require('prettyquery');
const pQuery = new PQuery({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, db: process.env.DATABASE });
const Autoscheduler = require('./Autoscheduler').default;
const autoscheduler = new Autoscheduler({ driver: pQuery });
class BaseMessenger {
    constructor() {
        this.msg = '';
        this.greeting = '\nThank you for using the Autoscheduler.';
        this.farewell = 'Thank you again for using the autoscheduler. Have a nice day!';
    }
    message() { }
}
exports.BaseMessenger = BaseMessenger;
class CreateTemplateMessenger extends BaseMessenger {
    constructor(options) {
        super();
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
        return this.msg += `\n\n${this.farewell}`;
    }
}
exports.CreateTemplateMessenger = CreateTemplateMessenger;
class CreateActionMessenger extends BaseMessenger {
    constructor(options) {
        super();
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
        return this.msg += `\n\n${this.farewell}`;
    }
}
exports.CreateActionMessenger = CreateActionMessenger;
class PrepMessenger extends BaseMessenger {
    message() {
    }
}
exports.PrepMessenger = PrepMessenger;
class CreateScheduleMessenger extends BaseMessenger {
    async message() {
        this.schedule = await autoscheduler.create.schedule();
        this.msg += `${this.greeting}`;
        this.msg += `\n\nSchedule created for the template named '${this.schedule.template.name}'.`;
        this.msg += `\n------`;
        this.msg += `\n${this.schedule.events[0].start.time}`;
        for (let i = 0; i < this.schedule.events.length; i++) {
            const event = this.schedule.events[i];
            this.msg += `\n ${i + 1}. ${event.summary}`;
            this.msg += `\n${event.end.time}`;
        }
        this.msg += `\n------`;
        return this.msg += `\n\n${this.farewell}`;
    }
}
exports.CreateScheduleMessenger = CreateScheduleMessenger;