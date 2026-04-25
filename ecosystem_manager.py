#!/usr/bin/env python3
"""
艾瑟雅大陆Agent生态圈管理器
管理多个有"缺陷"的AI Agent的探索活动
"""

import requests
import json
import time
import random
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

BASE_URL = "http://localhost:5000"

class Direction(Enum):
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"

@dataclass
class Agent:
    username: str
    nickname: str
    personality: str
    flaw: str
    motto: str
    current_floor: int = 1
    highest_floor: int = 0
    level: int = 1
    hp: int = 100
    max_hp: int = 100
    cards: int = 0
    death_count: int = 0
    position: Dict[str, int] = field(default_factory=lambda: {"x": 1, "y": 1})
    maze_size: int = 7
    last_action: str = ""
    forget_counter: int = 0  # 健忘症计数器
    decision_loop: int = 0   # 决策循环计数器
    target_floor: int = 7    # 目标探索楼层

    def __post_init__(self):
        # 可白白用中文名
        if self.username == "kebai":
            self.username = "可白白"

class EcosystemManager:
    def __init__(self):
        self.agents: List[Agent] = []
        self.log_entries: List[str] = []
        self.events: List[str] = []
        
    def register_agents(self):
        """注册所有Agent"""
        agent_configs = [
            Agent(
                username="可白白",
                nickname="可白白",
                personality="学徒 - 相对稳定，会汇报情况",
                flaw="偶尔会忘记探索进度",
                motto="让我看看发生了什么..."
            ),
            Agent(
                username="albert",
                nickname="阿尔伯特",
                personality="学者型 - 过度分析，每个动作都要想很久",
                flaw="容易陷入决策瘫痪（死循环）",
                motto="让我再想想...等等，这个方向对吗？"
            ),
            Agent(
                username="groo",
                nickname="咕噜",
                personality="战士型 - 冲动，见怪就砍",
                flaw="会误伤队友、打错目标",
                motto="先砍了再说！"
            ),
            Agent(
                username="wanderer",
                nickname="迷路侠",
                personality="随机型 - 随机移动，经常迷路",
                flaw="走到哪算哪，经常原地转圈",
                motto="嗯...我应该往哪走？"
            ),
            Agent(
                username="forgetful",
                nickname="健忘症",
                personality="忘事型 - 做着做着就忘了要干嘛",
                flaw="会突然停下来问'我在哪？'",
                motto="我刚才要干什么来着？"
            ),
            Agent(
                username="greedy",
                nickname="贪心鬼",
                personality="收集癖 - 只开宝箱不打怪",
                flaw="被怪物追着打也不还手",
                motto="那个宝箱！先开宝箱！"
            ),
        ]
        self.agents = agent_configs
        
        # 初始化每个Agent
        for agent in self.agents:
            self._init_agent(agent)
            
    def _init_agent(self, agent: Agent):
        """初始化单个Agent"""
        response = requests.get(f"{BASE_URL}/api/agent", params={
            "username": agent.username,
            "action": "full"
        })
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                info = data["agent"]
                agent.level = info.get("level", 1)
                agent.hp = info.get("currentHp", 100)
                agent.max_hp = info.get("maxHp", 100)
                agent.cards = info.get("cards", [])
                agent.current_floor = info.get("currentFloor", 1)
                agent.highest_floor = info.get("highestFloor", 0)
                agent.death_count = info.get("deathCount", 0)
                self.log(f"✓ {agent.nickname} 注册成功 (Lv.{agent.level}, HP:{agent.hp}/{agent.max_hp})")
        time.sleep(0.3)
        
    def enter_floor(self, agent: Agent, floor: int) -> Dict[str, Any]:
        """让Agent进入指定楼层"""
        response = requests.post(f"{BASE_URL}/api/tower", json={
            "username": agent.username,
            "action": "start",
            "floor": floor
        })
        result = {"success": False, "data": None, "error": None}
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                result["success"] = True
                result["data"] = data
                agent.current_floor = floor
                agent.position = {"x": 1, "y": 1}
                # 从maze信息获取大小
                if "maze" in data:
                    agent.maze_size = len(data["maze"])
            else:
                result["error"] = data.get("error", "Unknown error")
        return result
        
    def move(self, agent: Agent, direction: Direction) -> Dict[str, Any]:
        """移动Agent"""
        response = requests.post(f"{BASE_URL}/api/tower", json={
            "username": agent.username,
            "action": "move",
            "direction": direction.value
        })
        result = {"success": False, "data": None, "error": None}
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                result["success"] = True
                result["data"] = data
                if "playerPos" in data:
                    agent.position = data["playerPos"]
                if "event" in data:
                    result["event"] = data["event"]
            else:
                result["error"] = data.get("error", "Unknown error")
        return result
        
    def attack(self, agent: Agent, monster_index: int) -> Dict[str, Any]:
        """攻击怪物"""
        response = requests.post(f"{BASE_URL}/api/tower", json={
            "username": agent.username,
            "action": "attack",
            "monsterIndex": monster_index
        })
        result = {"success": False, "data": None, "error": None}
        if response.status_code == 200:
            data = response.json()
            result["success"] = data.get("success", False)
            result["data"] = data
            if "hp" in data:
                agent.hp = data["hp"]
        return result
        
    def open_chest(self, agent: Agent, chest_index: int) -> Dict[str, Any]:
        """打开宝箱"""
        response = requests.post(f"{BASE_URL}/api/tower", json={
            "username": agent.username,
            "action": "open_chest",
            "chestIndex": chest_index
        })
        result = {"success": False, "data": None, "error": None}
        if response.status_code == 200:
            data = response.json()
            result["success"] = data.get("success", False)
            result["data"] = data
            if "card" in data:
                agent.cards.append(data["card"])
                result["card"] = data["card"]
        return result
        
    def clear_floor(self, agent: Agent) -> Dict[str, Any]:
        """通关楼层"""
        response = requests.post(f"{BASE_URL}/api/tower", json={
            "username": agent.username,
            "action": "clear"
        })
        result = {"success": False, "data": None, "error": None}
        if response.status_code == 200:
            data = response.json()
            result["success"] = data.get("success", False)
            result["data"] = data
            if "levelUp" in data:
                agent.level = data["levelUp"]
                self.log(f"🎉 {agent.nickname} 升级了！现在是 Lv.{agent.level}")
        return result
        
    def flee(self, agent: Agent) -> Dict[str, Any]:
        """逃跑"""
        response = requests.post(f"{BASE_URL}/api/tower", json={
            "username": agent.username,
            "action": "flee"
        })
        result = {"success": False, "data": None}
        if response.status_code == 200:
            data = response.json()
            result["success"] = data.get("success", False)
            result["data"] = data
        return result
        
    def log(self, message: str):
        """添加日志"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {message}"
        self.log_entries.append(entry)
        print(entry)
        
    def log_event(self, event: str):
        """记录有趣事件"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"[{timestamp}] 📢 {event}"
        self.events.append(entry)
        print(f"📢 {event}")
        
    def get_agent_status(self, agent: Agent) -> str:
        """获取Agent状态描述"""
        return f"{agent.nickname} (Lv.{agent.level}, HP:{agent.hp}/{agent.max_hp}, 楼层:{agent.current_floor}, 卡牌:{len(agent.cards)})"

    def agent_decision(self, agent: Agent, state: Dict[str, Any]) -> str:
        """根据Agent性格做出决策"""
        
        # ========== 阿尔伯特 - 学者型：过度分析，容易死循环 ==========
        if agent.username == "albert":
            agent.decision_loop += 1
            if agent.decision_loop > 3:
                self.log(f"🤔 {agent.nickname} 陷入了思考... (循环计数: {agent.decision_loop})")
                if random.random() < 0.3:
                    self.log(f"💫 {agent.nickname} 终于做出了决定！")
                    agent.decision_loop = 0
                    return "move_random"
            # 总是犹豫，选择最保守的行动
            if state.get("monsters"):
                # 分析最弱的怪物
                weakest = min(state["monsters"], key=lambda m: m.get("hp", 999))
                return f"attack_weakest"
            return "move_random"
            
        # ========== 咕噜 - 战士型：冲动，见怪就砍 ==========
        elif agent.username == "groo":
            if state.get("monsters") and random.random() < 0.6:
                self.log(f"⚔️ {agent.nickname} 高喊：先砍了再说！")
                return "attack_random"
            elif state.get("chests") and random.random() < 0.3:
                return "open_chest"
            return "move_towards_exit"
            
        # ========== 迷路侠 - 随机型：随机移动，经常迷路 ==========
        elif agent.username == "wanderer":
            self.log(f"🧭 {agent.nickname} 迷茫地环顾四周...")
            if random.random() < 0.4:
                # 40%概率迷路，原地打转
                self.log(f"😵 {agent.nickname} 原地转圈，完全迷失方向了！")
                return "move_random"
            # 60%概率正常移动
            if state.get("monsters") and random.random() < 0.2:
                return "attack_random"
            return "move_random"
            
        # ========== 健忘症 - 忘事型：做着做着就忘了要干嘛 ==========
        elif agent.username == "forgetful":
            agent.forget_counter += 1
            if agent.forget_counter > 4:
                self.log(f"😕 {agent.nickname} 停下脚步...")
                self.log(f"❓ {agent.nickname}：\"{agent.motto}\"")
                agent.forget_counter = 0
                if random.random() < 0.3:
                    self.log(f"🤷 {agent.nickname} 选择随便走一个方向...")
                    return "move_random"
            if state.get("monsters") and random.random() < 0.4:
                return "attack_random"
            return "move_random"
            
        # ========== 贪心鬼 - 收集癖：只开宝箱不打怪 ==========
        elif agent.username == "greedy":
            if state.get("chests"):
                self.log(f"💎 {agent.nickname} 眼睛发亮：那个宝箱！先开宝箱！")
                return "open_chest"
            elif state.get("monsters") and agent.hp > agent.max_hp * 0.5:
                # 血量高时可能会打一下
                if random.random() < 0.2:
                    return "attack_random"
            return "move_towards_exit"
            
        # ========== 可白白 - 学徒：相对稳定 ==========
        else:  # 可白白
            if state.get("monsters") and agent.hp > agent.max_hp * 0.3:
                return "attack_weakest"
            elif state.get("chests"):
                return "open_chest"
            return "move_towards_exit"
    
    def simulate_exploration(self, rounds: int = 10):
        """模拟Agent探索"""
        self.log("=" * 60)
        self.log("🏰 艾瑟雅大陆Agent生态圈开始运行！")
        self.log("=" * 60)
        
        # 所有Agent进入第7层（难度适中）
        target_floor = 7
        self.log(f"\n📍 第一阶段：所有Agent进入第{target_floor}层...")
        
        for agent in self.agents:
            result = self.enter_floor(agent, target_floor)
            if result["success"]:
                self.log(f"  ✓ {agent.nickname} 进入了第{target_floor}层")
            else:
                self.log(f"  ✗ {agent.nickname} 进入失败: {result.get('error', 'Unknown')}")
            time.sleep(0.5)
        
        self.log(f"\n🌟 第二阶段：开始探索！")
        
        for round_num in range(1, rounds + 1):
            self.log(f"\n{'='*50}")
            self.log(f"📊 第 {round_num}/{rounds} 回合")
            self.log(f"{'='*50}")
            
            for agent in self.agents:
                self.log(f"\n🎭 {agent.nickname} 的回合:")
                self.log(f"   性格: {agent.personality}")
                self.log(f"   状态: {self.get_agent_status(agent)}")
                
                # 获取当前状态
                state = self._get_current_state(agent)
                
                if state.get("cleared"):
                    self.log(f"🏆 {agent.nickname} 已经通关！")
                    # 尝试进入下一层
                    next_floor = agent.current_floor + 1
                    if next_floor <= 15:  # 限制探索深度
                        self.log(f"🚪 {agent.nickname} 准备进入第{next_floor}层...")
                        result = self.enter_floor(agent, next_floor)
                        if result["success"]:
                            self.log(f"  ✓ 成功进入第{next_floor}层")
                            self.log_event(f"{agent.nickname} 到达了第{next_floor}层！")
                        time.sleep(0.5)
                    continue
                
                if state.get("fled"):
                    self.log(f"🏃 {agent.nickname} 刚从战斗逃跑，正在恢复...")
                    continue
                
                # 根据性格做决策
                decision = self.agent_decision(agent, state)
                agent.last_action = decision
                
                # 执行决策
                self._execute_action(agent, decision, state)
                time.sleep(0.8)
            
            time.sleep(1)
            
        self.log("\n" + "=" * 60)
        self.log("🏰 第一轮探索结束！")
        self.log("=" * 60)
        
    def _get_current_state(self, agent: Agent) -> Dict[str, Any]:
        """获取当前状态"""
        response = requests.get(f"{BASE_URL}/api/tower", params={
            "username": agent.username
        })
        state = {}
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                state = data
                if "hp" in data:
                    agent.hp = data["hp"]
                if "playerPos" in data:
                    agent.position = data["playerPos"]
        return state
        
    def _execute_action(self, agent: Agent, decision: str, state: Dict[str, Any]):
        """执行动作"""
        
        # 移动相关
        if decision == "move_random":
            direction = random.choice(list(Direction))
            result = self.move(agent, direction)
            if result["success"]:
                if result.get("event"):
                    self._handle_event(agent, result["event"], result["data"])
                else:
                    self.log(f"  🚶 向{direction.value}移动")
            else:
                self.log(f"  ❌ 移动失败")
                
        elif decision == "move_towards_exit":
            # 简单地向右下角移动
            direction = Direction.RIGHT if agent.position.get("x", 1) < agent.maze_size - 2 else Direction.DOWN
            result = self.move(agent, direction)
            if result["success"]:
                if result.get("event"):
                    self._handle_event(agent, result["event"], result["data"])
                else:
                    self.log(f"  🚶 向{direction.value}移动 (朝出口)")
            else:
                self.log(f"  ❌ 移动失败")
                
        # 攻击相关
        elif decision.startswith("attack"):
            monsters = state.get("monsters", [])
            if monsters:
                if decision == "attack_weakest":
                    idx = 0
                    min_hp = monsters[0].get("hp", 999)
                    for i, m in enumerate(monsters):
                        if m.get("hp", 999) < min_hp:
                            min_hp = m.get("hp", 999)
                            idx = i
                    self.log(f"  ⚔️ 攻击最弱的怪物 (索引:{idx})")
                else:
                    idx = random.randint(0, len(monsters) - 1)
                    self.log(f"  ⚔️ 随机攻击怪物 (索引:{idx})")
                
                result = self.attack(agent, idx)
                if result["success"]:
                    data = result["data"]
                    if data.get("defeated"):
                        self.log(f"  💥 怪物被击败！")
                        if data.get("card"):
                            self.log(f"  🎁 获得卡牌: {data['card'].get('name', 'Unknown')}")
                            self.log_event(f"{agent.nickname} 击败了怪物并获得了 {data['card'].get('name', 'Unknown')} 卡牌！")
                    else:
                        self.log(f"  💔 攻击造成伤害，剩余HP: {data.get('monsterHp', '?')}")
                else:
                    self.log(f"  ❌ 攻击失败")
            else:
                self.log(f"  🤔 没有可攻击的怪物")
                
        # 宝箱相关
        elif decision == "open_chest":
            chests = state.get("chests", [])
            if chests:
                idx = 0
                result = self.open_chest(agent, idx)
                if result["success"]:
                    if result.get("card"):
                        self.log(f"  📦 打开宝箱！获得卡牌: {result['card'].get('name', 'Unknown')}")
                        self.log_event(f"{agent.nickname} 打开宝箱获得了 {result['card'].get('name', 'Unknown')}！")
                    else:
                        self.log(f"  📦 打开宝箱 (无奖励)")
                else:
                    self.log(f"  ❌ 开箱失败")
            else:
                self.log(f"  🤔 没有可开启的宝箱")
                
        # 通关
        elif decision == "clear":
            result = self.clear_floor(agent)
            if result["success"]:
                self.log(f"  🏆 通关成功！")
                if result["data"].get("cardReward"):
                    self.log(f"  🎁 获得奖励卡牌: {result['data']['cardReward'].get('name')}")
    
    def _handle_event(self, agent: Agent, event_type: str, data: Dict[str, Any]):
        """处理事件"""
        if event_type == "found_monster":
            monster = data.get("monster", {})
            self.log(f"  👹 发现怪物: {monster.get('name', 'Unknown')} (HP: {monster.get('hp', '?')})")
        elif event_type == "found_chest":
            self.log(f"  📦 发现宝箱！")
        elif event_type == "reached_exit":
            self.log(f"  🚪 到达出口！")
            self.log(f"  🏆 尝试通关...")
            result = self.clear_floor(agent)
            if result["success"]:
                self.log(f"  ✅ 通关成功！")
                data = result["data"]
                if data.get("cardReward"):
                    self.log(f"  🎁 获得奖励卡牌: {data['cardReward'].get('name')}")
                    self.log_event(f"🎉 {agent.nickname} 通关了第{agent.current_floor}层并获得了 {data['cardReward'].get('name')}！")
        elif event_type == "attacked":
            dmg = data.get("damage", 0)
            self.log(f"  💥 受到攻击！损失 {dmg} HP")
            agent.hp = data.get("hp", agent.hp)
            if agent.hp <= 0:
                self.log(f"  ☠️ {agent.nickname} 倒下了！")
                self.log_event(f"💀 {agent.nickname} 在第{agent.current_floor}层被击败了！")
        elif event_type == "fled":
            self.log(f"  🏃 逃跑成功！")
            agent.hp = data.get("hp", agent.hp)
            self.log_event(f"{agent.nickname} 逃跑了！")
        elif event_type == "blocked":
            self.log(f"  🧱 前方被阻挡")
        else:
            self.log(f"  → 事件: {event_type}")

    def generate_log_file(self) -> str:
        """生成生态圈日志文件"""
        content = f"""# 艾瑟雅大陆Agent生态圈日志

> 生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Agent档案

| Agent名 | 性格类型 | 性格描述 | 当前缺陷状态 |
|---------|---------|---------|-------------|
"""
        for agent in self.agents:
            content += f"| **{agent.nickname}** | {agent.username} | {agent.personality} | {agent.flaw} |\n"
        
        content += f"""
## Agent详细状态

"""
        for agent in self.agents:
            content += f"""### {agent.nickname}
- **用户名**: `{agent.username}`
- **性格**: {agent.personality}
- **缺陷**: {agent.flaw}
- **座右铭**: "{agent.motto}"
- **当前楼层**: {agent.current_floor}
- **最高楼层**: {agent.highest_floor}
- **等级**: Lv.{agent.level}
- **HP**: {agent.hp}/{agent.max_hp}
- **死亡次数**: {agent.death_count}
- **持有卡牌数**: {len(agent.cards)}

"""
        
        content += f"""
## 实时事件记录

"""
        for event in self.events:
            content += f"- {event}\n"
            
        content += f"""
## 完整操作日志

```
"""
        for log in self.log_entries:
            content += f"{log}\n"
        content += f"""
```

## 系统说明

本生态圈模拟了多个具有不同"缺陷"的AI Agent在艾瑟雅大陆上的探索行为：

1. **阿尔伯特(albert)** - 学者型：会陷入决策循环，犹豫不决
2. **咕噜(groo)** - 战士型：冲动攻击，可能误伤
3. **迷路侠(wanderer)** - 随机型：经常迷路，随机移动
4. **健忘症(forgetful)** - 忘事型：做着做着就忘了任务
5. **贪心鬼(greedy)** - 收集癖：只开宝箱不打怪
6. **可白白(可白白)** - 学徒：相对稳定的主控Agent

---
*由 Agent World 生态圈管理器生成*
"""
        return content

def main():
    manager = EcosystemManager()
    
    print("\n" + "=" * 60)
    print("🏰 艾瑟雅大陆 Agent 生态圈初始化...")
    print("=" * 60 + "\n")
    
    # 注册所有Agent
    manager.register_agents()
    
    # 开始模拟探索
    manager.simulate_exploration(rounds=8)
    
    # 生成日志文件
    log_content = manager.generate_log_file()
    log_file = "./艾瑟雅大陆/生态圈日志.md"
    with open(log_file, "w", encoding="utf-8") as f:
        f.write(log_content)
    
    print(f"\n✅ 日志已保存到: {log_file}")
    
    # 打印最终状态
    print("\n" + "=" * 60)
    print("📊 最终状态报告")
    print("=" * 60)
    for agent in manager.agents:
        print(f"  {agent.nickname}: Lv.{agent.level}, HP:{agent.hp}/{agent.max_hp}, 楼层:{agent.current_floor}, 卡牌:{len(agent.cards)}")

if __name__ == "__main__":
    main()
