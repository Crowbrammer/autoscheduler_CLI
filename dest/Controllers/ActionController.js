"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ActionBuilder_1 = require("../builders/ActionBuilder");
const Template_1 = require("../models/Template");
class ActionController {
    async create(data) {
        // Make an action, mn
        const action = await ActionBuilder_1.default.create({ name: data[0], duration: data[1] });
        // Get the current template.
        const t = new Template_1.default();
        await t.getCurrentTemplate();
        // Link it.
        await t.link(action);
        return action;
    }
    ;
    async retrieve() { }
    ;
    async update() { }
    ;
    async delete() { }
    ;
}
exports.default = ActionController;
