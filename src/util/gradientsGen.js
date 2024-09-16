export function generateGradientText(text, color1, color2, color3 = null) {
    const length = text.length;
    const gradientTextArray = [];

    for (let i = 0; i < length; i++) {
        let color;
        if (color3) {
            const mid = length / 2;
            color =
                i < mid
                    ? interpolateColor(color1, color2, i / mid)
                    : interpolateColor(color2, color3, (i - mid) / mid);
        } else {
            color = interpolateColor(color1, color2, i / length);
        }
        gradientTextArray.push({ char: text[i], color });
    }

    return gradientTextArray;
}

function interpolateColor(color1, color2, factor) {
    const hex = (color) => parseInt(color.slice(1), 16);
    const r1 = (hex(color1) >> 16) & 0xff;
    const g1 = (hex(color1) >> 8) & 0xff;
    const b1 = hex(color1) & 0xff;
    const r2 = (hex(color2) >> 16) & 0xff;
    const g2 = (hex(color2) >> 8) & 0xff;
    const b2 = hex(color2) & 0xff;

    const r = Math.round(r1 + (r2 - r1) * factor)
        .toString(16)
        .padStart(2, '0');
    const g = Math.round(g1 + (g2 - g1) * factor)
        .toString(16)
        .padStart(2, '0');
    const b = Math.round(b1 + (b2 - b1) * factor)
        .toString(16)
        .padStart(2, '0');

    return `#${r}${g}${b}`;
}
