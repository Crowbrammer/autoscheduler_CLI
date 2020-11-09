"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
const Schedule_1 = require("../models/Schedule");
class ScheduleBuilder extends Builder_1.default {
    static async create(options) {
        if (!options.name)
            throw new Error('Add a name to build an Schedule.');
        const s = new Schedule_1.default({ templateId: options.templateId, actions: options.actions, name: options.name });
        return await s.save();
    }
}
exports.default = ScheduleBuilder;
