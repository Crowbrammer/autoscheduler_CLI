export default interface Migration {
    up();
    down();
    refresh();
}