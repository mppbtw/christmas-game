import { Stats } from "pixi-stats";
import { Renderer } from "pixi.js";

class StatsHandler {
    stats: Stats[] = []
    showing: boolean = false
    renderer: Renderer
    div: HTMLElement

    constructor(renderer: Renderer) {
        this.renderer = renderer
        const div: any = document.getElementById("statspanel")
        if (div != null)  {
            this.div = div
        } else {
            throw "welp, i tried"
        }
    }

    toggle() {
        if (!this.showing) {
            this.showing = true
            const stat = new Stats(this.renderer)
            this.div.appendChild(stat.domElement)
            this.stats.push(stat)

        } else {
            this.showing = false
            this.stats = []
            this.div.innerHTML = "";
        }
    }
}

export {StatsHandler}
