import { RpgPlayer, RpgPlayerHooks } from '@rpgjs/server'
import { createModule } from '@rpgjs/common'
import server from './server'

export const player: RpgPlayerHooks = {
    onConnected(player: RpgPlayer) {
        player.changeMap('map', {
            x: 300,
            y: 400
        })
        player.name.set('Hero')
        player.setGraphic('hero')
        player.initializeDefaultStats()
    },
    onInput(player: RpgPlayer, { action }) {
        if (action == 'escape') {
            player.callMainMenu()
        }
    },
    async onJoinMap(player: RpgPlayer) {
        await player.showText('Welcome to Aethelgard!')
    }
}

export function provideMain() {
    return createModule('main', [{
        player,
        server
    }])
}
