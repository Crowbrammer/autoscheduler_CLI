export default interface Builder {
    create(any);
}

export class ChecklistBuilder implements Builder {
    create() {}
}