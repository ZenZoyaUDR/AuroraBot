class Tellraw {
    constructor(component) {
        this.components = [];
        if (component != null) this.add(component);
    }

    /**
     * Adds a component to the Tellraw object.
     * @param {Text|string|Array} component - The component to add.
     * @returns {Tellraw} The updated Tellraw object.
     */
    add(component) {
        if (Array.isArray(component)) {
            component.forEach((c) => this.add(c));
            return this;
        }

        if (component == null) return this;
        if (typeof component === 'string') component = new Text(component);

        this.components.push(component);
        return this;
    }

    /**
     * Gets the components of the Tellraw object.
     * @param {boolean} [stringify=false] - Whether to stringify the components.
     * @returns {string|Array} The components.
     */
    get(stringify = false) {
        const components = this.components.map((component) =>
            component.get != null ? component.get(false) : component,
        );

        return stringify ? JSON.stringify(components) : components;
    }
}

class Text {
    clr = null;
    it = null;
    b = null;
    st = null;
    ul = null;
    obf = null;
    command = null;
    hover = null;
    url = null;
    suggest = null;
    copy = null;

    /**
     * Creates a new Text object.
     * @param {string} text - The text content.
     */
    constructor(text) {
        this.text = `${text}` ?? '';
    }

    setItalic(i) {
        this.it = i;
        return this;
    }

    setBold(b) {
        this.b = b;
        return this;
    }

    setStrikethrough(s) {
        this.st = s;
        return this;
    }

    setUnderlined(u) {
        this.ul = u;
        return this;
    }

    setObfuscated(o) {
        this.obf = o;
        return this;
    }

    italic() {
        return this.setItalic(true);
    }

    bold() {
        return this.setBold(true);
    }

    strikethrough() {
        return this.setStrikethrough(true);
    }

    underlined() {
        return this.setUnderlined(true);
    }

    obfuscated() {
        return this.setObfuscated(true);
    }

    setCommand(command) {
        this.command = `${command}`;
        return this;
    }

    setSuggestedCommand(command) {
        this.suggest = `${command}`;
        return this;
    }

    setURL(url) {
        this.url = `${url}`;
        return this;
    }

    setCopy(text) {
        this.copy = `${text}`;
        return this;
    }

    setHover(...components) {
        this.hover = [];
        components.forEach((component) => {
            if (
                typeof component === 'string' ||
                typeof component.get !== 'function'
            ) {
                this.hover.push(component);
            } else {
                this.hover.push(component.get(false));
            }
        });
        return this;
    }

    setColor(color) {
        this.clr = color;
        return this;
    }

    color(color) {
        return this.setColor(color);
    }

    /**
     * Gets the Text object.
     * @param {boolean} [stringify=true] - Whether to stringify the object.
     * @returns {string|Object} The Text object.
     */
    get(stringify = true) {
        const obj = { text: this.text };
        if (this.clr != null) obj.color = this.clr;
        if (this.it != null) obj.italic = this.it;
        if (this.b != null) obj.bold = this.b;
        if (this.st != null) obj.strikethrough = this.st;
        if (this.ul != null) obj.underlined = this.ul;
        if (this.obf != null) obj.obfuscated = this.obf;
        if (this.command != null)
            obj.clickEvent = {
                action: 'run_command',
                value: `${this.command}`,
            };
        if (this.hover != null)
            obj.hoverEvent = { action: 'show_text', contents: this.hover };
        if (this.url != null)
            obj.clickEvent = { action: 'open_url', value: `${this.url}` };
        if (this.suggest != null)
            obj.clickEvent = {
                action: 'suggest_command',
                value: `${this.suggest}`,
            };
        if (this.copy != null)
            obj.clickEvent = {
                action: 'copy_to_clipboard',
                value: `${this.copy}`,
            };

        return stringify ? JSON.stringify(obj) : obj;
    }
}

export { Tellraw, Text };
