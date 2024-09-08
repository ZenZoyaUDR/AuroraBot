const smallCapsMap = {
    a: 'ᴀ',
    b: 'ʙ',
    c: 'ᴄ',
    d: 'ᴅ',
    e: 'ᴇ',
    f: 'ғ',
    g: 'ɢ',
    h: 'ʜ',
    i: 'ɪ',
    j: 'ᴊ',
    k: 'ᴋ',
    l: 'ʟ',
    m: 'ᴍ',
    n: 'ɴ',
    o: 'ᴏ',
    p: 'ᴘ',
    q: 'ǫ',
    r: 'ʀ',
    s: 's',
    t: 'ᴛ',
    u: 'ᴜ',
    v: 'ᴠ',
    w: 'ᴡ',
    x: 'x',
    y: 'ʏ',
    z: 'ᴢ',
};

/**
 * Converts a given string to small caps.
 * @param {string} str - The string to convert.
 * @returns {string} The converted string in small caps.
 */
export default function convertFont(str) {
    return str
        .split('')
        .map((char) => smallCapsMap[char.toLowerCase()] || char)
        .join('');
}
