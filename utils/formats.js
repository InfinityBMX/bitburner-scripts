const symbols = ["", "k", "m", "b", "t", "q", "Q", "s", "S", "o", "n", "e33", "e36", "e39"];

export function formatNumberShort(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
    for (var i = 0, sign = Math.sign(num), num = Math.abs(num); num >= 1000 && i < symbols.length; i++) num /= 1000;
    return ((sign < 0) ? "-" : "") + num.toFixed(Math.max(0, Math.min(maxDecimalPlaces, maxSignificantFigures - Math.floor(1 + Math.log10(num))))) + symbols[i];
}

export function formatDuration(duration) {
    if (duration < 1000) return `${duration.toFixed(0)}ms`
    const portions = [];
    const msInHour = 1000 * 60 * 60;
    const hours = Math.trunc(duration / msInHour);
    if (hours > 0) {
        portions.push(hours + 'h');
        duration -= (hours * msInHour);
    }
    const msInMinute = 1000 * 60;
    const minutes = Math.trunc(duration / msInMinute);
    if (minutes > 0) {
        portions.push(minutes + 'm');
        duration -= (minutes * msInMinute);
    }
    let seconds = (duration / 1000.0)
    // Include millisecond precision if we're on the order of seconds
    seconds = (hours == 0 && minutes == 0) ? seconds.toPrecision(3) : seconds.toFixed(0);
    if (seconds > 0) {
        portions.push(seconds + 's');
        duration -= (minutes * 1000);
    }
    return portions.join(' ');
}

export function formatMoney(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
    let numberShort = formatNumberShort(num, maxSignificantFigures, maxDecimalPlaces);
    return num >= 0 ? "$" + numberShort : numberShort.replace("-", "-$");
}