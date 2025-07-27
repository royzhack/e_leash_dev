export default function levelfix(level:number) {
    if (level < 0) {
        return "B" + (level * -1);
    } else {
        return level;
    }
}