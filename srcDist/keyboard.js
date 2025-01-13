class Keyboard {
    constructor() {
        this.pressedKeys = [];
        this.clickHandlers = [];
        this.addListeners();
    }
    addClickHandler(key, f) {
        this.clickHandlers.push(new ClickHandler(key, f));
    }
    isWasdPressed() {
        for (let i = 0; i < this.pressedKeys.length; i++) {
            const k = this.pressedKeys[i];
            if (k == "w" || k == "a" || k == "s" || k == "d") {
                return true;
            }
        }
        return false;
    }
    addListeners() {
        window.addEventListener("keydown", this.downHandler.bind(this), false);
        window.addEventListener("keyup", this.upHandler.bind(this), false);
    }
    downHandler(e) {
        if (!this.pressedKeys.includes(e.key))
            this.pressedKeys.push(e.key);
        this.clickHandlers.forEach((h) => {
            if (h.key == e.key)
                h.f();
        });
    }
    upHandler(e) {
        this.pressedKeys.forEach((key, i) => {
            if (key === e.key)
                this.pressedKeys.splice(i, 1);
        });
    }
}
class ClickHandler {
    constructor(key, f) {
        this.key = key;
        this.f = f;
    }
}
export { Keyboard };

