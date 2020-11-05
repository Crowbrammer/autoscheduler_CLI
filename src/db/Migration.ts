export default interface Migration {
    static up();
    down();
    refresh();
}