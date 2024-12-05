class Keyboard{
    public pressedKeys: string[] = [];

    constructor() {
        this.addListeners();
    }

    private addListeners() {
        window.addEventListener("keydown", this.downHandler.bind(this), false);
        window.addEventListener("keyup", this.upHandler.bind(this), false);
    }

    private downHandler(e: KeyboardEvent) {
        if (!this.pressedKeys.includes(e.key))
            this.pressedKeys.push(e.key)
    }

    private upHandler(e: KeyboardEvent) {
        this.pressedKeys.forEach( (key, i) => {
            if(key === e.key) this.pressedKeys.splice(i,1);
        });
    }
}
export { Keyboard }
