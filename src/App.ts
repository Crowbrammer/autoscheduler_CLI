import ActionController   from './Controllers/ActionController';
import TemplateController from './Controllers/TemplateController';
import ScheduleController from './Controllers/ScheduleController';

export default class AutoschedulerApp {
    controller;
    data;
    out;
    verb;

    in(verbAndController: string) {

        // The second letter should rep the controller.
        const controllerFlag = verbAndController[1]; // The second letter;
        const verbFlag =       verbAndController[0];
        this.setController(controllerFlag);    
        this.verb = verbFlag;
        this.data = [];
        for (let i = 1; i < arguments.length; i++) {
            this.data.push(arguments[i]);
        }
    }

    async run() {
        switch (this.verb) {
            case 'c':
                this.out = await this.controller.create(this.data);
                break;
        
            case 'r':
                this.out = await this.controller.retrieve(this.data);
                break;

            default:
                break;
        }
    }

    setController(flag: string) {
        switch (flag) {
            case 'a':
                this.controller = new ActionController();
                break;
        
            case 't':
                this.controller = new TemplateController();
                break;

            case 's':
                this.controller = new ScheduleController();
                break;

            default:
                break;
        }
    }
}