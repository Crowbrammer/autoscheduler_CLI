import { AutoschedulerModel } from "./Model";
const zeroFill = require('zero-fill');

export default class Event extends AutoschedulerModel {
    end;
    start;
    summary;
    constructor(options) {
        super(options);
        if (!options) options = {};
        this.id = options.id;
        this.summary = options.summary;
        this.start = options.start;
        this.end = options.end;
    }
    
    milTime(dt) {
        const hh = zeroFill(2, dt.getHours());
        const mm = zeroFill(2, dt.getMinutes());
        return `${hh}:${mm}`;
    }
    milStart() {
        if (!this.start)
            throw new Error('Need to substantiate the start property before getting military time.');
        return this.milTime(new Date(this.start));
    }
    
    milEnd() {
        if (!this.end)
           throw new Error('Need to substantiate the end property before getting military time.');
        return this.milTime(new Date(this.end));
    }
}