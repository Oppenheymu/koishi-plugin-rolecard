/**
 * 插件配置 Schema 定义。
 *
 * `types.ts` 中的 `Config` 接口是运行时配置的类型契约，
 * 本文件提供对应的 Koishi Schema 声明（默认值、校验、UI 描述、条件联动）。
 *
 * 条件联动通过 `Schema.intersect` 实现：
 * - 全局层：`enableRandom` / `enableImage` 为真时才显示对应概率项
 * - 群聊层：勾选 `belikov` 角色卡时才显示「别里科夫专属配置组」
 */

import { Schema } from 'koishi';

// ──────────────────────────────────────────────────────────────
// 别里科夫专属配置
// ──────────────────────────────────────────────────────────────

/** 别里科夫的标签选项（与 trigger-words.json 中的 groups 对应）。 */
const belikovTagOptions: { tag: string; name: string }[] = [
    { tag: 'proposal', name: '提议与搞事' },
    { tag: 'emotional', name: '情绪波动与违规边缘' },
    { tag: 'rules', name: '规章制度与日常通知' },
    { tag: 'distancing', name: '撇清关系与甩锅' },
];

/** 别里科夫专属配置组 Schema。 */
const BelikovConfig = Schema.object({
    belikovConfig: Schema.object({
        cooldown: Schema.number()
            .default(60)
            .min(0)
            .description('别里科夫冷却时间（秒），该群聊内两次触发的最小间隔'),
        tags: Schema.array(
            Schema.object({
                tag: Schema.string().required().description('标签名'),
                name: Schema.string().required().description('标签别称'),
                enabled: Schema.boolean()
                    .default(true)
                    .description('是否启用该标签触发'),
            }),
        )
            .role('table')
            .default(belikovTagOptions.map((t) => ({ ...t, enabled: true })))
            .description('启用的触发标签：逐项控制每个标签是否在该群聊生效'),
        enableRandom: Schema.boolean()
            .default(false)
            .description('启用全部消息概率随机触发（神预言效果）'),
        randomProbability: Schema.number()
            .default(0.03)
            .min(0)
            .max(1)
            .step(0.01)
            .description('随机触发概率（0-1，如 0.03 表示 3%）'),
        enableImage: Schema.boolean()
            .default(false)
            .description('启用角色卡插图'),
        imageProbability: Schema.number()
            .default(1)
            .min(0)
            .max(1)
            .step(0.01)
            .description('附带图片的概率（0-1，如 1 表示每次触发都发图）'),
    // biome-ignore lint/suspicious/noExplicitAny: 空对象 default 由 resolver 填充各字段默认值
    }).description('别里科夫专属配置').default({} as any),
});

// ──────────────────────────────────────────────────────────────
// 群聊配置项
// ──────────────────────────────────────────────────────────────

/** 可选角色卡列表（后续扩展新角色卡时在此追加 boolean 开关）。 */

/**
 * 单个群聊配置项。
 *
 * 使用 Schema.intersect 实现条件联动：
 * 基础字段始终显示；当 belikov 开关打开时，别里科夫专属配置组才显示。
 */
const ChannelItem = Schema.intersect([
    Schema.object({
        channelId: Schema.string()
            .required()
            .description('群号或频道号'),
        botId: Schema.string()
            .default('')
            .description('启用的机器人 selfId（留空表示不限定）'),
        belikov: Schema.boolean()
            .default(false)
            .description('启用别里科夫 · 套中人'),
    }),
    Schema.union([
        Schema.object({
            belikov: Schema.const(true).required(),
            ...BelikovConfig.dict,
        }),
        Schema.object({}),
    ]),
]).description('群聊配置');

// ──────────────────────────────────────────────────────────────
// 全局配置
// ──────────────────────────────────────────────────────────────

export const Config = Schema.intersect([
    // ── 基础配置 ──
    Schema.object({
        cooldownWhitelist: Schema.array(Schema.string())
            .default([])
            .role('table')
            .description('冷却白名单：填入用户 ID，这些用户的消息不受冷却限制（用于 Debug）'),
    }),

    // ── 多群聊配置 ──
    Schema.object({
        channels: Schema.array(ChannelItem)
            .default([])
            .description('群聊白名单：仅此处列出的群聊/频道会响应，未配置的群聊不触发'),
    }),
]);
