"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Schedule_1 = require("../models/Schedule");
class EventController {
    create() { }
    ;
    async retrieve() {
        const curPosix = Date.now();
        // Get the current schedule
        const s = new Schedule_1.default({});
        await s.getCurrentSchedule();
        // Get the current event for the schedule
        const events = await s.getEvents();
        // console.log(events[0].end - events[0].start);
        const currentEvent = events.filter(function (e) {
            // Convert to POSIX
            const startPosix = e.start.getTime();
            const endPosix = e.end.getTime();
            return (startPosix < curPosix) && (curPosix < endPosix);
        });
        if (currentEvent.length > 0) {
            // How much time is left until the end of the event?
            const eightyPercent = (currentEvent[0].end.getTime() - currentEvent[0].start.getTime()) * 0.8;
            const twentyPercentLeft = new Date(currentEvent[0].start.getTime() + eightyPercent);
            const timeLeft = (currentEvent[0].end.getTime() - curPosix) / (1000 * 60);
            const timeLeftToTwentyPercent = (twentyPercentLeft.getTime() - curPosix) / (1000 * 60);
            // Make a pretty message for the event.
            let msg = `\n${currentEvent[0].start.toLocaleTimeString()}`;
            msg += `\n     ${currentEvent[0].summary}`;
            msg += `\n${twentyPercentLeft.toLocaleTimeString()} (${Math.floor(timeLeftToTwentyPercent)} minutes left)`;
            msg += `\n${currentEvent[0].end.toLocaleTimeString()} (${Math.floor(timeLeft)} minutes left.)`;
            return msg;
        }
        else {
            return 'No current events.';
        }
        console.log(currentEvent);
    }
    ;
    update() { }
    ;
    delete() { }
    ;
}
exports.default = EventController;
