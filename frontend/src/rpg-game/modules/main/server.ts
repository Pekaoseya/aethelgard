import { defineModule } from "@rpgjs/common";
import { RpgServer } from "@rpgjs/server";
import { RpgPlayer } from "@rpgjs/server";

class Hero extends RpgPlayer {
    onInit() {
        this.maxHp = 100;
        this.hp = 100;
    }
}

export default defineModule<RpgServer>({
    player: Hero,
    maps: [
        {
            id: "map"
        }
    ]
});
