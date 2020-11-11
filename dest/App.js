"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ActionController_1 = require("./Controllers/ActionController");
const TemplateController_1 = require("./Controllers/TemplateController");
const ScheduleController_1 = require("./Controllers/ScheduleController");
class AutoschedulerApp {
    in(verbAndController) {
        // The second letter should rep the controller.
        const controllerFlag = verbAndController[1]; // The second letter;
        const verbFlag = verbAndController[0];
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
    setController(flag) {
        switch (flag) {
            case 'a':
                this.controller = new ActionController_1.default();
                break;
            case 't':
                this.controller = new TemplateController_1.default();
                break;
            case 's':
                this.controller = new ScheduleController_1.default();
                break;
            default:
                break;
        }
    }
}
exports.default = AutoschedulerApp;
