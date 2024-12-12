class Keyboard{
    public pressedKeys: string[] = [];
    private clickHandlers: ClickHandler[] = [];

    constructor() {
        this.addListeners();
    }

    public addClickHandler(key: string, f: () => void) {
        this.clickHandlers.push(new ClickHandler(key, f));

    }

    private addListeners() {
        window.addEventListener("keydown", this.downHandler.bind(this), false);
        window.addEventListener("keyup", this.upHandler.bind(this), false);
    }

    private downHandler(e: KeyboardEvent) {
        if (!this.pressedKeys.includes(e.key))
            this.pressedKeys.push(e.key)

        this.clickHandlers.forEach((h) => {
            if (h.key == e.key)
                h.f();
        })
    }

    private upHandler(e: KeyboardEvent) {
        this.pressedKeys.forEach( (key, i) => {
            if(key === e.key) this.pressedKeys.splice(i,1);
        });
    }
}
class ClickHandler {
    key: string;
    f: () => void;
    constructor(key: string, f: () => void) {
        this.key = key;
        this.f = f;
    }
}

export { Keyboard }
