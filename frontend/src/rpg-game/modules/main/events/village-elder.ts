import { RpgPlayer, RpgEvent, Move, EventMode, type EventDefinition } from "@rpgjs/server"

export function VillageElderEvent(): EventDefinition {
    return {
        name: "Village Elder",
        mode: EventMode.Scenario,

        onInit() {
            this.setGraphic("female")
            this.speed = 1
            this.infiniteMoveRoute([
                Move.turnDown(),
                Move.wait(2),
                Move.turnLeft(),
                Move.wait(1.5),
                Move.turnRight(),
                Move.wait(1.5),
                Move.turnDown(),
            ])
        },

        onChanges(player: RpgPlayer) {
            const questState = player.getVariable("elder-quest")
            if (questState === "completed") {
                this.setGraphic("female")
            }
        },

        async onAction(player: RpgPlayer) {
            const questState = player.getVariable("elder-quest")

            if (questState === "completed") {
                await player.showText("谢谢你，勇敢的冒险者！你的任务已经完成了。", {
                    talkWith: this,
                })
                return
            }

            if (questState === "delivered") {
                player.setVariable("elder-quest", "completed")
                player.gold += 100
                await player.showText("太好了！你成功把消息送到了！这是给你的奖励，100金币。", {
                    talkWith: this,
                })
                player.showNotification("获得了 100 金币！")
                return
            }

            if (questState === "started") {
                await player.showText("快去东边找守卫队长，把消息带给他！时间紧迫！", {
                    talkWith: this,
                })
                return
            }

            const choice = await player.showChoices(
                "勇敢的冒险者！我有一件紧急的事情需要帮助。你能帮我把这个消息送到守卫队长那里吗？",
                [
                    { text: "交给我吧！", value: "accept" },
                    { text: "我现在有点忙...", value: "decline" },
                ]
            )

            if (choice && choice.value === "accept") {
                player.setVariable("elder-quest", "started")
                await player.showText("非常感谢！守卫队长在地图的东边。找到他，把消息带给他，然后回来找我领赏！", {
                    talkWith: this,
                })
            } else {
                await player.showText("没关系，如果你改变主意，随时来找我。", {
                    talkWith: this,
                })
            }
        },
    }
}