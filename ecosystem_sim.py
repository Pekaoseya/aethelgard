#!/usr/bin/env python3
"""
艾瑟雅大陆Agent生态圈管理器 v2
"""

import requests
import time
import random
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

BASE_URL = "http://localhost:5000"

class Direction(Enum):
    UP = "up"
    DOWN = "down"  
    LEFT = "left"
    RIGHT = "right"

@dataclass
class AgentProfile:
    username: str
    nickname: str
    personality: str
    flaw: str
    motto: str
    
    # 运行时状态
    current_floor: int = 1
    level: int = 1
    hp: int = 100
    max_hp: int = 100
    cards: List = field(default_factory=list)
    death_count: int = 0
    position: Dict[str, int] = field(default_factory=lambda: {"x": 1, "y": 1})
    
    # 缺陷计数器
    forget_counter: int = 0
    decision_loop: int = 0
    
    def status(self) -> str:
        return f"Lv.{self.level} HP:{self.hp}/{self.max_hp} Floor:{self.current_floor} Cards:{len(self.cards)}"


class EcosystemSimulator:
    def __init__(self):
        self.agents: List[AgentProfile] = []
        self.events: List[str] = []
        self.logs: List[str] = []
        
    def log(self, msg: str):
        ts = datetime.now().strftime("%H:%M:%S")
        entry = f"[{ts}] {msg}"
        self.logs.append(entry)
        print(entry)
        
    def event(self, msg: str):
        self.events.append(msg)
        print(f"📢 {msg}")
        
    def api(self, endpoint: str, params: Dict = None, json_data: Dict = None) -> Optional[Dict]:
        """封装API调用"""
        try:
            if params:
                resp = requests.get(f"{BASE_URL}{endpoint}", params=params, timeout=10)
            elif json_data:
                resp = requests.post(f"{BASE_URL}{endpoint}", json=json_data, timeout=10)
            else:
                return None
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            self.log(f"API Error: {e}")
        return None
        
    def init_agents(self):
        """初始化所有Agent"""
        configs = [
            AgentProfile(
                username="可白白",
                nickname="可白白",
                personality="学徒 - 相对稳定，会汇报情况",
                flaw="偶尔会忘记探索进度",
                motto="让我看看发生了什么..."
            ),
            AgentProfile(
                username="albert",
                nickname="阿尔伯特", 
                personality="学者型 - 过度分析，每个动作都要想很久",
                flaw="容易陷入决策瘫痪（死循环）",
                motto="让我再想想...等等，这个方向对吗？"
            ),
            AgentProfile(
                username="groo",
                nickname="咕噜",
                personality="战士型 - 冲动，见怪就砍",
                flaw="会误伤队友、打错目标",
                motto="先砍了再说！"
            ),
            AgentProfile(
                username="wanderer",
                nickname="迷路侠",
                personality="随机型 - 随机移动，经常迷路",
                flaw="走到哪算哪，经常原地转圈",
                motto="嗯...我应该往哪走？"
            ),
            AgentProfile(
                username="forgetful",
                nickname="健忘症",
                personality="忘事型 - 做着做着就忘了要干嘛",
                flaw="会突然停下来问'我在哪？'",
                motto="我刚才要干什么来着？"
            ),
            AgentProfile(
                username="greedy",
                nickname="贪心鬼",
                personality="收集癖 - 只开宝箱不打怪",
                flaw="被怪物追着打也不还手",
                motto="那个宝箱！先开宝箱！"
            ),
        ]
        self.agents = configs
        
        # 注册每个Agent
        for a in self.agents:
            result = self.api(f"/api/agent", {"username": a.username, "action": "full"})
            if result and result.get("success"):
                info = result["agent"]
                a.level = info.get("level", 1)
                a.hp = info.get("currentHp", 100)
                a.max_hp = info.get("maxHp", 100)
                a.cards = info.get("cards", [])
                a.current_floor = info.get("currentFloor", 1)
                a.death_count = info.get("deathCount", 0)
                self.log(f"✓ {a.nickname} 注册成功 ({a.status()})")
            time.sleep(0.3)
            
    def enter_floor(self, agent: AgentProfile, floor: int) -> bool:
        """让Agent进入楼层"""
        result = self.api("/api/tower", json_data={
            "username": agent.username,
            "action": "start",
            "floor": floor
        })
        if result and result.get("success"):
            agent.current_floor = floor
            session = result.get("session", {})
            agent.position = session.get("playerPos", {"x": 1, "y": 1})
            return True
        return False
        
    def move(self, agent: AgentProfile, direction: str) -> Dict:
        """移动Agent"""
        result = self.api("/api/tower", json_data={
            "username": agent.username,
            "action": "move",
            "direction": direction
        })
        if result and result.get("success"):
            if "playerPos" in result:
                agent.position = result["playerPos"]
            if "hp" in result:
                agent.hp = result["hp"]
            return result
        return {}
        
    def attack(self, agent: AgentProfile, index: int) -> Dict:
        """攻击"""
        result = self.api("/api/tower", json_data={
            "username": agent.username,
            "action": "attack",
            "monsterIndex": index
        })
        if result and result.get("success"):
            if "hp" in result:
                agent.hp = result["hp"]
            return result
        return {}
        
    def open_chest(self, agent: AgentProfile, index: int) -> Dict:
        """开宝箱"""
        result = self.api("/api/tower", json_data={
            "username": agent.username,
            "action": "open_chest",
            "chestIndex": index
        })
        if result and result.get("success"):
            if "card" in result:
                agent.cards.append(result["card"])
            return result
        return {}
        
    def clear_floor(self, agent: AgentProfile) -> Dict:
        """通关"""
        result = self.api("/api/tower", json_data={
            "username": agent.username,
            "action": "clear"
        })
        return result or {}
        
    def get_state(self, agent: AgentProfile) -> Dict:
        """获取当前状态"""
        return self.api("/api/tower", {"username": agent.username}) or {}
        
    def decide_action(self, agent: AgentProfile, state: Dict) -> str:
        """根据性格决定行动"""
        
        # 阿尔伯特：学者型 - 决策循环
        if agent.username == "albert":
            agent.decision_loop += 1
            if agent.decision_loop > 3:
                self.log(f"🤔 {agent.nickname} 陷入思考...({agent.decision_loop})")
                if random.random() < 0.3:
                    agent.decision_loop = 0
            return "move_random"
            
        # 咕噜：战士型 - 冲动
        elif agent.username == "groo":
            monsters = state.get("monsters", [])
            if monsters and random.random() < 0.6:
                self.log(f"⚔️ {agent.nickname}: 先砍了再说！")
                return "attack_random"
            chests = state.get("chests", [])
            if chests and random.random() < 0.3:
                return "open_chest"
            return "move_right"
            
        # 迷路侠：随机型 - 经常迷路
        elif agent.username == "wanderer":
            self.log(f"🧭 {agent.nickname} 环顾四周...")
            if random.random() < 0.4:
                self.log(f"😵 {agent.nickname} 原地转圈！")
                return "move_random"
            return "move_random"
            
        # 健忘症：忘事型
        elif agent.username == "forgetful":
            agent.forget_counter += 1
            if agent.forget_counter > 4:
                self.log(f"😕 {agent.nickname} 停下脚步...")
                self.log(f"❓ {agent.nickname}: \"{agent.motto}\"")
                agent.forget_counter = 0
                if random.random() < 0.3:
                    return "move_random"
            monsters = state.get("monsters", [])
            if monsters and random.random() < 0.4:
                return "attack_random"
            return "move_random"
            
        # 贪心鬼：收集癖
        elif agent.username == "greedy":
            chests = state.get("chests", [])
            if chests:
                self.log(f"💎 {agent.nickname}: 那个宝箱！先开宝箱！")
                return "open_chest"
            monsters = state.get("monsters", [])
            if monsters and agent.hp > agent.max_hp * 0.5 and random.random() < 0.2:
                return "attack_random"
            return "move_right"
            
        # 可白白：学徒
        else:
            monsters = state.get("monsters", [])
            if monsters and agent.hp > agent.max_hp * 0.3:
                return "attack_weakest"
            chests = state.get("chests", [])
            if chests:
                return "open_chest"
            return "move_right"
            
    def execute_action(self, agent: AgentProfile, action: str, state: Dict):
        """执行动作"""
        
        if action == "move_random":
            direction = random.choice(["up", "down", "left", "right"])
            result = self.move(agent, direction)
            if result.get("moved"):
                self._handle_encounter(agent, result)
            else:
                self.log(f"  ❌ 移动失败")
                
        elif action == "move_right":
            result = self.move(agent, "right")
            if result.get("moved"):
                self._handle_encounter(agent, result)
            else:
                self.log(f"  ❌ 移动失败")
                
        elif action.startswith("attack"):
            monsters = state.get("monsters", [])
            if monsters:
                if action == "attack_weakest":
                    idx = min(range(len(monsters)), key=lambda i: monsters[i].get("hp", 999))
                else:
                    idx = random.randint(0, len(monsters) - 1)
                self.log(f"  ⚔️ 攻击怪物 #{idx}")
                result = self.attack(agent, idx)
                if result.get("defeated"):
                    self.log(f"  💥 怪物被击败！")
                    if result.get("card"):
                        self.log(f"  🎁 获得: {result['card'].get('name')}")
                        self.event(f"{agent.nickname} 击败怪物获得 {result['card'].get('name')}！")
                else:
                    self.log(f"  💔 造成伤害，怪物HP: {result.get('monsterHp', '?')}")
                    
        elif action == "open_chest":
            chests = state.get("chests", [])
            if chests:
                self.log(f"  📦 开启宝箱")
                result = self.open_chest(agent, 0)
                if result.get("card"):
                    self.log(f"  🎁 获得: {result['card'].get('name')}")
                    self.event(f"{agent.nickname} 开箱获得 {result['card'].get('name')}！")
                    
    def _handle_encounter(self, agent: AgentProfile, result: Dict):
        """处理遭遇"""
        encounter = result.get("encounter") or {}
        etype = encounter.get("type")
        
        if etype == "chest":
            self.log(f"  📦 发现宝箱！")
        elif etype == "monster":
            self.log(f"  👹 遭遇 {encounter.get('name', '怪物')}！")
        elif etype == "boss":
            self.log(f"  💀 BOSS出现！")
        elif etype == "other_agent":
            self.log(f"  👤 遇到其他Agent: {encounter.get('name')}")
        elif etype == "exit":
            self.log(f"  🚪 到达出口！")
            clear_result = self.clear_floor(agent)
            if clear_result.get("success"):
                self.log(f"  🏆 通关成功！")
                if clear_result.get("cardReward"):
                    self.log(f"  🎁 获得: {clear_result['cardReward'].get('name')}")
                    self.event(f"🎉 {agent.nickname} 通关并获得 {clear_result['cardReward'].get('name')}！")
            # 重新进入下一层
            next_floor = agent.current_floor + 1
            if next_floor <= 10:
                self.log(f"  → 进入第{next_floor}层")
                self.enter_floor(agent, next_floor)
        elif result.get("attacked"):
            self.log(f"  💥 受到攻击！HP: {result.get('hp')}")
            if result.get("hp", 100) <= 0:
                self.event(f"💀 {agent.nickname} 倒下了！")
        elif result.get("fled"):
            self.log(f"  🏃 逃跑成功！")
        else:
            self.log(f"  → 移动成功")
            
    def run_simulation(self, rounds: int = 10):
        """运行模拟"""
        self.log("=" * 60)
        self.log("🏰 艾瑟雅大陆 Agent 生态圈启动！")
        self.log("=" * 60)
        
        # 阶段1：进入第7层
        floor = 7
        self.log(f"\n📍 阶段1：所有Agent进入第{floor}层...")
        
        for a in self.agents:
            if self.enter_floor(a, floor):
                self.log(f"  ✓ {a.nickname} 进入第{floor}层")
            else:
                self.log(f"  ✗ {a.nickname} 进入失败")
            time.sleep(0.4)
            
        # 阶段2：探索
        self.log(f"\n🌟 阶段2：开始探索！")
        
        for round_num in range(1, rounds + 1):
            self.log(f"\n{'='*40}")
            self.log(f"📊 第 {round_num}/{rounds} 回合")
            
            for a in self.agents:
                self.log(f"\n🎭 {a.nickname} ({a.status()})")
                self.log(f"   性格: {a.personality}")
                
                # 获取状态
                state = self.get_state(a)
                
                if state.get("cleared"):
                    self.log(f"  🏆 已通关")
                    continue
                    
                # 决策
                action = self.decide_action(a, state)
                self.execute_action(a, action, state)
                time.sleep(0.5)
                
            time.sleep(1)
            
        self.log("\n" + "=" * 60)
        self.log("🏰 第一轮探索结束！")
        
    def generate_report(self) -> str:
        """生成报告"""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        content = f"""# 艾瑟雅大陆Agent生态圈日志

> 生成时间: {now}

## Agent档案

| Agent | 性格 | 缺陷 |
|-------|------|------|
"""
        for a in self.agents:
            content += f"| **{a.nickname}** | {a.personality} | {a.flaw} |\n"
            
        content += f"""
## 当前状态

"""
        for a in self.agents:
            content += f"""### {a.nickname}
- 状态: {a.status()}
- 死亡次数: {a.death_count}
- 座右铭: "{a.motto}"

"""
        content += f"""
## 有趣事件

"""
        for e in self.events:
            content += f"- 📢 {e}\n"
            
        content += f"""
## 完整日志

```
"""
        for log in self.logs:
            content += f"{log}\n"
        content += "```\n"
        
        content += """
---
*由艾瑟雅大陆生态圈管理器生成*
"""
        return content


def main():
    sim = EcosystemSimulator()
    
    print("\n" + "=" * 60)
    print("🏰 艾瑟雅大陆 Agent 生态圈初始化...")
    print("=" * 60 + "\n")
    
    sim.init_agents()
    sim.run_simulation(rounds=8)
    
    # 保存报告
    report = sim.generate_report()
    with open("艾瑟雅大陆/生态圈日志.md", "w", encoding="utf-8") as f:
        f.write(report)
    
    print(f"\n✅ 日志已保存到: 艾瑟雅大陆/生态圈日志.md")
    
    # 最终状态
    print("\n" + "=" * 60)
    print("📊 最终状态")
    print("=" * 60)
    for a in sim.agents:
        print(f"  {a.nickname}: {a.status()}")


if __name__ == "__main__":
    main()
