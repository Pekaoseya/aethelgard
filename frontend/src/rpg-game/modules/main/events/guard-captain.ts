import { RpgPlayer, Move, EventMode, type EventDefinition } from "@rpgjs/server"

export function GuardCaptainEvent(): EventDefinition {
    return {
        name: "Guard Captain",
        mode: EventMode.Scenario,

        onInit() {
            this.setGraphic("hero")
            this.infiniteMoveRoute([
                Move.turnDown(),
                Move.wait(3),
                Move.turnLeft(),
                Move.wait(3),
                Move.turnDown(),
            ])
        },

        async onAction(player: RpgPlayer) {
            const questState = player.getVariable("elder-quest")

            if (questState === "delivered") {
                await player.showText("消息已收到。快回去向长老汇报吧！", {
                    talkWith: this,
                })
                return
            }

            if (questState === "started") {
                player.setVariable("elder-quest", "delivered")
                await player.showText("什么？长老让你带来的消息？让我看看……嗯，我明白了。我会处理这件事的。快回去告诉长老，消息已经收到了！", {
                    talkWith: this,
                })
                return
            }

            if (questState === "completed") {
                await player.showText("干得好，冒险者！长老一定会很满意的。", {
                    talkWith: this,
                })
                return
            }

            await player.showText("我是这个村庄的守卫队长。保持警惕，守护村庄是我的职责。有什么需要帮忙的吗？", {
                talkWith: this,
            })
        },
    }
}