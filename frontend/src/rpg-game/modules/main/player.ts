import { RpgPlayer, type RpgPlayerHooks } from "@rpgjs/server"

export const player: RpgPlayerHooks = {
    onConnected(player: RpgPlayer) {
        player.setGraphic("hero")
        player.changeMap("map")
    }
}