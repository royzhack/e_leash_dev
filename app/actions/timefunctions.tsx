export function timecheck (value, timediffMins: number): boolean {
    if (!value) {
        return false;
    }
    const input = new Date(value);
    if (isNaN(input.getTime())) {
        return false;
    }
    const now = new Date();
    console.log(value, typeof value, value instanceof Date);
    return input - now >= timediffMins * 60 * 1000;
}

export function clearedLongBefore (timediffMins: number) {
    const now = new Date();
    return new Date(now.getTime() - timediffMins*60*1000);
}