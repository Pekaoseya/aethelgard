import { RpgPlayer, Move, EventMode, type EventDefinition } from "@rpgjs/server"

export function MerchantEvent(): EventDefinition {
    return {
        name: "Wandering Merchant",
        mode: EventMode.Shared,

        onInit() {
            this.setGraphic("female")
            this.speed = 2
            this.infiniteMoveRoute([
                Move.right(3),
                Move.wait(1),
                Move.turnDown(),
                Move.down(2),
                Move.wait(1),
                Move.turnLeft(),
                Move.left(3),
                Move.wait(1),
                Move.turnUp(),
                Move.up(2),
                Move.wait(1),
                Move.turnRight(),
            ])
        },

        async onAction(player: RpgPlayer) {
            const choice = await player.showChoices(
                "欢迎，冒险者！我这里有些稀奇古怪的玩意儿。虽然现在还没进货，但你可以随便看看！",
                [
                    { text: "有什么好东西吗？", value: "goods" },
                    { text: "这村子最近怎么样？", value: "news" },
                    { text: "再见！", value: "bye" },
                ]
            )

            if (!choice) return

            if (choice.value === "goods") {
                await player.showText("哈哈，真正的宝物可不会随便摆出来。下次带些稀有材料来，我们也许可以做笔交易。", {
                    talkWith: this,
                })
            } else if (choice.value === "news") {
                await player.showText("最近村子还算平静。不过我听说长老好像在找人手帮忙，你不如去问问他？他就在西边的屋子附近。", {
                    talkWith: this,
                })
            } else {
                await player.showText("一路顺风！有需要随时来找我。", {
                    talkWith: this,
                })
            }
        },
    }
}