# koishi-plugin-rolecard

[![npm](https://img.shields.io/npm/v/koishi-plugin-rolecard?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-rolecard)

数据驱动的角色台词引擎 · 让经典文学角色在你的群里"活"过来。

核心逻辑与角色卡内容**完全解耦**：引擎是通用的，角色卡是纯数据资源。新增角色只需在 `assets/` 下添加一个数据目录，**无需改动任何源码**。

---

## 🎭 内置角色卡

### 别里科夫 · 《套中人》—— 契诃夫

> "当然，行是行的，这固然很好，可是千万别闹出什么乱子。"

谨小慎微、墨守成规、害怕任何改变。群友一搞事他就泼冷水。

| 标签 | 场景 | 触发示例 |
|------|------|----------|
| `proposal` | 提议与搞事 | "要不我们去面基？" |
| `emotional` | 情绪波动 | "笑死/卧槽/离谱" |
| `rules` | 规章制度 | "群主发公告了" |
| `distancing` | 甩锅撇清 | "都怪你/谁的锅" |

---

### 格里高尔 · 《变形记》—— 卡夫卡

> "我的天哪！我选择的是多么辛苦的职业啊，我日复一日地处于旅途之中。"

变成甲虫的旅行推销员，心系家庭却被逐渐遗弃。社畜之魂代言人。

| 标签 | 场景 | 触发示例 |
|------|------|----------|
| `work` | 工作与加班 | "又要加班/996/好累" |
| `late` | 迟到与请假 | "睡过头了/闹钟没响" |
| `despair` | 破防与绝望 | "我崩溃了/没救了" |
| `family` | 家庭与责任 | "父母/还债/养家" |
| `body` | 变形与身体 | "生病了/动不了" |
| `music` | 音乐与美好 | "这首歌好听/小提琴" |

---

### 孔乙己 · 《孔乙己》—— 鲁迅

> "窃书不能算偷……窃书！……读书人的事，能算偷么？"

站着喝酒而穿长衫的唯一的人，满口之乎者也的落魄读书人。

| 标签 | 场景 | 触发示例 |
|------|------|----------|
| `steal` | 偷窃与狡辩 | "抄/Bug/白嫖/Ctrl+C" |
| `defend` | 清白辩护 | "冤枉/污蔑/血口喷人" |
| `showoff` | 卖弄学问 | "科普/教你/冷知识" |
| `debt` | 欠债与穷困 | "穷/还钱/花呗" |
| `drink` | 喝酒 | "干杯/喝酒/来一杯" |
| `laugh` | 被嘲笑 | "笑死/取笑/别笑了" |

---

### 阿Q · 《阿Q正传》—— 鲁迅

> "我们先前——比你阔的多啦！你算是什么东西！"

精神胜利法大师，未庄第一个自轻自贱的人。

| 标签 | 场景 | 触发示例 |
|------|------|----------|
| `victory` | 精神胜利 | "算了不亏/就当/想当年" |
| `curse` | 骂人嘴硬 | "妈的/记着罢/晦气" |
| `bully` | 欺软怕硬 | "欺负/和尚动得/小尼姑" |
| `revolution` | 造反革命 | "造反/革命/发财/自由" |
| `poor` | 穷酸炫耀 | "现钱/城里/上城/吹牛" |
| `trial` | 糊涂受审 | "审问/画押/二十年/不认字" |

---

### 哈姆雷特 · 《哈姆雷特》—— 莎士比亚

> "生存还是毁灭，这是一个值得考虑的问题。"

丹麦王子，装疯复仇的沉思者，人类史上最著名的犹豫症患者。

| 标签 | 场景 | 触发示例 |
|------|------|----------|
| `ponder` | 沉思与独白 | "意义/选择/二选一/去不去" |
| `madness` | 装疯卖傻 | "阴阳/讽刺/呵呵/钓鱼" |
| `revenge` | 复仇与愤怒 | "背叛/报仇/篡位/奸贼" |
| `despair` | 绝望与厌世 | "emo/摆烂/心碎/看透" |
| `action` | 行动与决断 | "冲/干了/动手/拼了" |

---

### 堂吉诃德 · 《堂吉诃德》—— 塞万提斯

> "那边出现了三十多个大得出奇的巨人。我打算去跟他们交手！"

拉曼却的游侠骑士，把风车当巨人、把旅店当城堡的理想主义者。

| 标签 | 场景 | 触发示例 |
|------|------|----------|
| `challenge` | 挑战与冲锋 | "困难/挑战/冲/巨人/敌人" |
| `chivalry` | 骑士信条 | "正义/责任/使命/守护" |
| `fantasy` | 幻想与妄想 | "魔法/幻觉/过度解读" |
| `failure` | 失败嘴硬 | "失败/翻车/借口/运气" |
| `freedom` | 自由与理想 | "自由/理想/束缚/规则" |
| `love` | 骑士之爱 | "表白/公主/意中人/暗恋" |

---

## 🏗️ 架构

```
src/
  types.ts     共享类型契约（角色卡内容 + 运行时配置接口）
  config.ts    配置 Schema 声明（默认值、校验、条件联动）
  loader.ts    角色卡加载器（扫描并解析 assets/ 目录）
  core.ts      核心引擎（通用台词引擎，与具体角色解耦）
  index.ts     插件入口（组装以上模块，对接 Koishi 生命周期）
assets/
  Belikov/     rolecard.json + words.json + trigger-words.json
  GregorSamsa/ rolecard.json + words.json + trigger-words.json
  KongYiji/    rolecard.json + words.json + trigger-words.json
  AhQ/         rolecard.json + words.json + trigger-words.json
  Hamlet/      rolecard.json + words.json + trigger-words.json
  DonQuixote/  rolecard.json + words.json + trigger-words.json
```

| 模块 | 职责 | 依赖 |
|------|------|------|
| `types.ts` | 定义角色卡数据结构与运行时配置的契约 | 无 |
| `config.ts` | Koishi Schema 声明，含默认值与条件联动 | `types.ts` |
| `loader.ts` | 从磁盘扫描、解析、校验角色卡目录 | `types.ts` |
| `core.ts` | 通用台词引擎：关键词匹配、概率触发、冷却、插图 | `types.ts` |
| `index.ts` | 加载角色卡、按群聊配置实例化引擎 | 以上全部 |

角色卡只包含数据，不含任何可执行逻辑。引擎与角色完全解耦，任何新角色卡只要提供符合 `types.ts` 契约的数据文件即可被引擎驱动。

---

## ⚙️ 配置

插件采用**多群聊配置**模型：每个群聊可独立勾选启用的角色卡，并为每个角色卡设置专属参数。

### 全局配置

| 配置项 | 类型 | 默认 | 说明 |
|--------|------|------|------|
| `cooldownWhitelist` | string[] | `[]` | 冷却白名单，填入用户 ID 后其消息不受冷却限制 |

### 群聊配置

| 配置项 | 类型 | 默认 | 说明 |
|--------|------|------|------|
| `channelId` | string | - | 群号或频道号 |
| `botId` | string | `''` | 机器人 selfId（留空不限定） |
| `belikov` | boolean | `false` | 启用别里科夫 |
| `gregorSamsa` | boolean | `false` | 启用格里高尔 |
| `kongYiji` | boolean | `false` | 启用孔乙己 |
| `ahQ` | boolean | `false` | 启用阿Q |
| `hamlet` | boolean | `false` | 启用哈姆雷特 |
| `donQuixote` | boolean | `false` | 启用堂吉诃德 |

每个角色卡勾选后会出现专属配置面板：

| 配置项 | 类型 | 默认 | 说明 |
|--------|------|------|------|
| `cooldown` | number | `60` | 冷却时间（秒），该群聊内两次触发的最小间隔 |
| `tags` | table | 全部启用 | 触发标签开关，逐项控制 |
| `enableRandom` | boolean | `false` | 启用概率随机触发 |
| `randomProbability` | number | `0.03` | 随机触发概率（0-1） |
| `enableImage` | boolean | `false` | 启用插图 |
| `imageProbability` | number | `1` | 附带图片的概率（0-1） |

---

## 🚀 添加新角色卡

三步走，不改源码：

### 1. 创建数据目录

```
assets/MyCharacter/
  rolecard.json        清单
  words.json           台词库
  trigger-words.json   触发词配置
```

### 2. 编写 `rolecard.json`

```json
{
  "id": "my-character",
  "name": "我的角色",
  "description": "一句话描述",
  "source": "作者《作品》"
}
```

### 3. 编写 `words.json` 台词库

```json
{
  "character": "我的角色",
  "source": "作者《作品》",
  "quotes": [
    { "id": "m01", "text": "这是一句原文台词。", "tags": ["tag1", "tag2"] }
  ]
}
```

### 4. 编写 `trigger-words.json` 触发词

```json
{
  "groups": [
    {
      "tag": "tag1",
      "name": "场景名称",
      "matchMode": "include",
      "priority": 1,
      "keywords": ["关键词1", "关键词2"]
    }
  ],
  "random": { "enabled": true, "probability": 0.03, "pool": "all" },
  "cooldown": 60
}
```

### 5. 注册到插件

在 `src/types.ts`、`src/config.ts`、`src/index.ts` 各加约 10 行——参看已有角色卡的 PR 即可。

> 💡 全部流程已有 `belikov` → `gregor-samsa` → `kong-yiji` → `ah-q` → `hamlet` → `don-quixote` 六个渐进示例。

---

## 📦 安装

```bash
npm install koishi-plugin-rolecard
```

## 💬 交流反馈

- 🐛 Issue: [GitHub](https://github.com/Oppenheymu/koishi-plugin-rolecard)
- 💬 QQ 群: [1071284605](https://qm.qq.com/q/WngX4RQoca) 「晓基地插件工坊」

## 📄 License

MIT
