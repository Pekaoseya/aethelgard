import { defineModule } from "@rpgjs/common"
import { RpgServer } from "@rpgjs/server"
import { player } from "./player"
import { VillageElderEvent } from "./events/village-elder"
import { GuardCaptainEvent } from "./events/guard-captain"
import { MerchantEvent } from "./events/merchant"

export default defineModule<RpgServer>({
    player,
    maps: [
        {
            id: "map",
            events: [
                {
                    id: "village-elder",
                    x: 288,
                    y: 416,
                    event: VillageElderEvent(),
                },
                {
                    id: "guard-captain",
                    x: 672,
                    y: 416,
                    event: GuardCaptainEvent(),
                },
                {
                    id: "wandering-merchant",
                    x: 480,
                    y: 544,
                    event: MerchantEvent(),
                },
            ],
        },
    ],
})