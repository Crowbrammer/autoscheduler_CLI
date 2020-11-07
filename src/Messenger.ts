export interface Messenger {
    message(updated?);
}

export class BaseMessenger implements Messenger {
    static autoscheduler;
    msg: string = '';
    currentTemplate;
    constructor(options?) {
        if (options) this.currentTemplate = options.currentTemplate;
    }
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
    async message() {
        this.msg += `${this.greeting}`;
        if (!process.argv[3]) {
            await BaseMessenger.autoscheduler.create.template('');
            this.msg += '\n\nUnnamed schedule template created and set as current.';
        } else {
            await BaseMessenger.autoscheduler.create.template(this.templateName);
            this.msg += `\n\nSchedule template named '${this.templateName}' created and set as the current template.`;
        }
        return this.msg += `\n\n${this.farewell}`;
    }
}

export class CreateActionMessenger extends BaseMessenger {
    actionName: string;
    actionDuration: string;
    actionOrder: any;
    constructor(options) {
        super(options);
        this.actionName = options.actionName;
        this.actionDuration = options.actionDuration;
        this.actionOrder = options.actionOrder
    }
    async message() {
        this.msg += `${this.greeting}`
            await BaseMessenger.autoscheduler.create.action(this.actionName, this.actionDuration); // FIXME: Bad variable name workaround for switch-case scoping
            if (!/\D+/.test(this.actionOrder)) {// If a number-only fifth argument, place it there...
                const orderNum = (await BaseMessenger.autoscheduler.retrieve.related.actions()).length;
                await BaseMessenger.autoscheduler.update.template({signal: 'reorder', actionAt: orderNum, moveTo: this.actionOrder});
                this.msg += `\n\nAction, '${this.actionName}', added to the template named '${this.currentTemplate.name} at position ${this.actionOrder}'`;
            } else {
                this.msg += `\n\nAction, '${this.actionName}', added to the template named '${this.currentTemplate.name}'`;
            }
        return this.msg += `\n\n${this.farewell}`;
    }
}

export class PrepMessenger extends BaseMessenger {
    
    async message() {
        
    }
}

export class RetrieveTemplateMessenger extends BaseMessenger {
    
    async message() {
        this.msg += this.greeting;
        this.msg += `\n\nCurrent actions for template: ${this.currentTemplate.name}`
        this.msg += '\n------';
        const actions = await BaseMessenger.autoscheduler.retrieve.related.actions();
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            this.msg += `\n  ${i + 1}  - ${action.name} for ${action.duration} min`;
        }
        this.msg += '\n------';
        return this.msg += `\n\n${this.farewell}`;
    }
}

class ScheduleMessenger extends BaseMessenger {
    schedule: any;
    buildScheduleMessage() {
        this.msg += `${this.greeting}`;
        this.msg += `\n\nSchedule created for the template named '${this.schedule.template.name}'.`;
        this.msg += `\n------`;
        this.msg += `\n${this.schedule.events[0].start.time}`
        for (let i = 0; i < this.schedule.events.length; i++) {
            const event = this.schedule.events[i];
            this.msg += `\n ${i + 1}. ${event.summary}`;
            this.msg += `\n${event.end.time}`;
        }
        this.msg += `\n------`;
        return this.msg += `\n\n${this.farewell}`
    }
}

export class UpdateScheduleMessenger extends ScheduleMessenger {
    updateScheduleMessenger: Messenger;
    actionNum: any;
    constructor(options) {
        super(options);
        this.actionNum = options.actionNum;
    }
    async message() {
        this.schedule = await BaseMessenger.autoscheduler.update.schedule(this.actionNum);
        return this.buildScheduleMessage();
    }
}

export class RetrieveActionsMessenger extends BaseMessenger {
    
    async message(updated) {
        this.msg += `${this.greeting}`;
        const scheduleTemplateActions = await BaseMessenger.autoscheduler.retrieve.related.actions();
        if (scheduleTemplateActions.length > 0) {
            this.msg += `\n\n${updated ? 'Actions updated. ' : ''}Here are the ${updated ? 'new ' : ''}actions for template: ${this.currentTemplate.name}`;
            this.msg += `\n------`
            scheduleTemplateActions.forEach(async action => {
                this.msg += `\n  ${action.order_num} - ${action.name} for ${action.duration}mins`;
            });
            this.msg += `\n------`
        } else {
            this.msg += `\nNo actions created for this template yet.`;
        }
        return this.msg += `\n\n${this.farewell}`;
    }
}

export class ReorderActionsMessenger extends BaseMessenger {
    actionAt: any;
    moveTo: any;
    retrieveActionsMessenger: Messenger;
    constructor(options) {
        super(options);
        this.actionAt = options.actionAt;
        this.moveTo = options.moveTo;
        this.retrieveActionsMessenger = new RetrieveActionsMessenger(options);
    }
    async message() {
        await BaseMessenger.autoscheduler.update.template({ signal: 'reorder', actionAt: this.actionAt, moveTo: this.moveTo });
        return await this.retrieveActionsMessenger.message(true);
    }
}

export class CreateScheduleMessenger extends ScheduleMessenger {
    async message() {
        this.schedule = await BaseMessenger.autoscheduler.create.schedule();
        return this.buildScheduleMessage();
    }
}
