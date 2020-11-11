"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TemplateBuilder_1 = require("../builders/TemplateBuilder");
class TemplateController {
    async create(args) {
        // Create a template with the given arguments and return it 
        await TemplateBuilder_1.default.create({ name: args[0], markAsCurrent: true });
        if (!args[0]) {
            return `Created an unnamed template.`;
        }
        else {
            return `Created new template named '${args[0]}'.`;
        }
    }
    async retrieve() { }
    async update() { }
    async delete() { }
}
exports.default = TemplateController;
