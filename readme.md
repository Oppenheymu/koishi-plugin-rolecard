# koishi-plugin-rolecard

[![npm](https://img.shields.io/npm/v/koishi-plugin-rolecard?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-rolecard)

数据驱动的角色台词引擎 · 角色卡插件。

核心逻辑与角色卡内容**完全解耦**：引擎是通用的，角色卡是纯数据资源。新增角色只需在 `rolecards/` 下添加一个数据目录，无需改动任何源码。

## 架构

```
src/
  types.ts    共享类型契约（角色卡内容 + 运行时配置）
  loader.ts   角色卡加载器（扫描并解析 rolecards/ 目录）
  core.ts     核心引擎（通用台词引擎，与具体角色解耦）
  index.ts    插件入口（组装三者，对接 Koishi 生命周期）
rolecards/
  belikov/    别里科夫角色卡（数据资源）
    rolecard.json        清单
    words.json           台词库
    trigger-words.json   触发词配置
    image.png            插图
```

### 分层职责

| 模块 | 职责 | 依赖 |
|------|------|------|
| `types.ts` | 定义角色卡数据结构与运行时配置的契约 | 无 |
| `loader.ts` | 从磁盘扫描、解析、校验角色卡目录 | `types.ts` |
| `core.ts` | 通用台词引擎：关键词匹配、概率触发、冷却、插图 | `types.ts` |
| `index.ts` | 加载角色卡、按配置实例化引擎 | 以上三者 |

角色卡（`rolecards/<id>/`）只包含数据，不含任何可执行逻辑，因此可以自由替换、增删，引擎自动适配。

## 内置角色卡

### 别里科夫 · 套中人

灵感源自契诃夫《套中人》中那位谨小慎微、墨守成规、害怕任何改变的别里科夫。机器人会监听群聊，在合适的时机抛出他那忧心忡忡、生怕"闹出什么乱子"的台词，制造一本正经的喜剧效果。

四类触发场景：

- **proposal** — 提议与搞事（要不、计划、面基……）
- **emotional** — 情绪波动与违规边缘（笑死、卧槽、节奏……）
- **rules** — 规章制度与日常通知（通知、公告、群规……）
- **distancing** — 撇清关系与甩锅（都怪、甩锅、谁的锅……）

## 配置项

| 配置项 | 类型 | 默认 | 说明 |
|--------|------|------|------|
| `rolecard` | string | `''` | 要加载的角色卡 ID（留空则自动加载第一个找到的角色卡） |
| `cooldown` | number | `60` | 冷却时间（秒），同一频道内两次触发的最小间隔 |
| `cooldownWhitelist` | string[] | `[]` | 冷却白名单，填入用户 ID 后其消息不受冷却限制 |
| `disabledTags` | string[] | `[]` | 禁用的触发标签（留空表示全部启用） |
| `enableRandom` | boolean | `true` | 启用全部消息概率随机触发 |
| `randomProbability` | number | `3` | 随机触发概率（0-100，3 表示 3%） |
| `enableImage` | boolean | `true` | 启用角色卡插图 |
| `imageWithMessage` | boolean | `true` | 图片与文字一起发送（关闭则图片作为单独消息发送） |
| `imageProbability` | number | `100` | 附带图片的概率（0-100） |
| `respondIn` | string | `group` | 响应范围：`group` / `private` / `both` |

## 添加新角色卡

1. 在 `rolecards/` 下新建目录，如 `rolecards/mycharacter/`
2. 创建 `rolecard.json` 清单：

   ```json
   {
     "id": "mycharacter",
     "name": "我的角色",
     "description": "角色简介",
     "source": "角色来源"
   }
   ```

3. 创建 `words.json` 台词库：

   ```json
   {
     "character": "我的角色",
     "source": "来源",
     "quotes": [
       { "id": "q1", "text": "台词内容", "tags": ["tag1"] }
     ]
   }
   ```

4. 创建 `trigger-words.json` 触发词配置：

   ```json
   {
     "groups": [
       {
         "tag": "tag1",
         "name": "分组名",
         "matchMode": "include",
         "priority": 1,
         "keywords": ["关键词1", "关键词2"]
       }
     ]
   }
   ```

5. 可选：放入 `image.png` 插图

6. 在插件配置中将 `rolecard` 设为 `mycharacter` 即可加载

`tags` 字段是台词与触发词之间的桥梁——触发词分组的 `tag` 对应台词的 `tags`，引擎据此筛选候选台词。

## 依赖

- [koishi](https://koishi.chat/) ^4.17.4

## 交流与反馈

遇到问题或有建议？欢迎加入 QQ 群 **[1071284605【晓基地插件工坊】](https://qm.qq.com/q/WngX4RQoca)** 进行交流。

## 许可证

MIT
