interface Orderer {
    add(): void;
    remove(): void;
    update(): void;
}

type Task = {name: string, duration: number}

export default class AutoschedulerOrderer implements Orderer{
    ids: number[];
    constructor(ids) {
        this.ids = ids;
    }
    add(task: Task) {
        return this.ids.length;
    }

    remove() {

    }
    
    update() {}
}