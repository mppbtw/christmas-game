import { Stats } from "pixi-stats";
class StatsHandler {
    constructor(renderer) {
        this.stats = [];
        this.showing = false;
        this.renderer = renderer;
        const div = document.getElementById("statspanel");
        if (div != null) {
            this.div = div;
        }
        else {
            throw "welp, i tried";
        }
    }
    toggle() {
        if (!this.showing) {
            this.showing = true;
            //@ts-ignore
            const stat = new Stats(this.renderer);
            this.div.appendChild(stat.domElement);
            this.stats.push(stat);
        }
        else {
            this.showing = false;
            this.stats = [];
            this.div.innerHTML = "";
        }
    }
}
export { StatsHandler };

