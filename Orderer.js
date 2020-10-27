"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AutoschedulerOrderer {
    constructor(ids) {
        this.ids = ids;
    }
    add(task) {
        return this.ids.length;
    }
    remove() {
    }
    update() { }
}
exports.default = AutoschedulerOrderer;
