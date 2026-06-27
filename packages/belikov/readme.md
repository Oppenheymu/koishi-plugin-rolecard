# koishi-plugin-belikov

[![npm](https://img.shields.io/npm/v/koishi-plugin-belikov?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-belikov)

别里科夫 · 套中人身份卡插件。

灵感源自契诃夫《套中人》中那位谨小慎微、墨守成规、害怕任何改变的别里科夫。机器人会监听群聊，在合适的时机抛出他那忧心忡忡、生怕"闹出什么乱子"的台词，制造一本正经的喜剧效果。

## 功能特性

- **关键词触发**：群消息包含触发词时，从对应分类的台词库中随机取一条回复
- **概率随机触发**：任意消息按概率随机插话，还原小说里别里科夫神经质式的"神预言"
- **四类触发场景**，可在配置中独立开关：
  - 提议与搞事（要不、计划、面基……）
  - 情绪波动与违规边缘（笑死、卧槽、节奏……）
  - 规章制度与日常通知（通知、公告、群规……）
  - 撇清关系与甩锅（都怪、甩锅、谁的锅……）
- **冷却防刷屏**：同频道内两次触发最小间隔可配，支持白名单豁免
- **插图支持**：可附带别里科夫绘图（`assets/image.png`），概率与发送方式可配

## 配置项

| 配置项 | 类型 | 默认 | 说明 |
|--------|------|------|------|
| `cooldown` | number | `60` | 冷却时间（秒），同一频道内两次触发的最小间隔 |
| `cooldownWhitelist` | string[] | `[]` | 冷却白名单，填入用户 ID 后其消息不受冷却限制 |
| `enableProposal` | boolean | `true` | 启用「提议与搞事」类触发词 |
| `enableEmotional` | boolean | `true` | 启用「情绪波动与违规边缘」类触发词 |
| `enableRules` | boolean | `true` | 启用「规章制度与日常通知」类触发词 |
| `enableDistancing` | boolean | `true` | 启用「撇清关系与甩锅」类触发词 |
| `enableRandom` | boolean | `true` | 启用全部消息概率随机触发 |
| `randomProbability` | number | `3` | 随机触发概率（0-100，3 表示 3%） |
| `enableImage` | boolean | `true` | 启用别里科夫插图 |
| `imageWithMessage` | boolean | `true` | 图片与文字一起发送（关闭则图片作为单独消息发送） |
| `imageProbability` | number | `100` | 附带图片的概率（0-100，100 表示每次触发都发图） |

## 台词与触发词资源

插件启动时会从 `assets` 目录加载以下文件，可自行编辑替换：

- `assets/words.json` —— 台词库，每条带 `id`、`text`、`tags`，标签可与触发词分组对应
- `assets/trigger-words.json` —— 触发词分组、优先级、随机触发与冷却配置
- `assets/image.png` —— 别里科夫插图

### 台词标签

| tag | 场景 |
|-----|------|
| `proposal` | 提议泼冷水 |
| `emotional` | 情绪/违规震惊 |
| `rules` | 规章教条 |
| `distancing` | 撇清甩锅 |

一条台词可同时属于多个标签，例如「这固然很好，可是千万别闹出什么乱子」既是 `proposal` 也是 `rules`，避免文本重复。

## 效果示例

```
群友A：我们周末要不去吃火锅？
别里科夫：这固然很好，可是千万别闹出什么乱子

群友B：刚刚那个八卦太笑死我了
别里科夫：唉，千万别传到当局的耳朵里

群主：通知一下，以后群里禁止发砍价链接
别里科夫：这都很好，但愿不要惹出什么事端！
```

## 依赖

- [koishi](https://koishi.chat/) ^4.17.4

## 交流与反馈

遇到问题或有建议？欢迎加入 QQ 群 **[1071284605【晓基地插件工坊】](https://qm.qq.com/q/WngX4RQoca)** 进行交流。

## 许可证

MIT
