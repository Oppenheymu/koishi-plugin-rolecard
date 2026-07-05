/**
 * 插件配置 Schema 定义。
 *
 * `types.ts` 中的 `Config` 接口是运行时配置的类型契约，
 * 本文件则提供对应的 Koishi Schema 声明（默认值、校验、UI 描述），
 * 二者共同构成配置层。后续提升配置复杂度与通用度时，集中在此维护。
 */

import { Schema } from 'koishi';
import type { Config as ConfigType } from './types';

export const Config: Schema<ConfigType> = Schema.object({
    rolecard: Schema.string()
        .default('')
        .description('要加载的角色卡 ID（留空则自动加载第一个找到的角色卡）。例如：belikov'),
    cooldown: Schema.number()
        .default(60)
        .min(0)
        .description('冷却时间（秒），同一频道内两次触发的最小间隔，防止刷屏'),
    cooldownWhitelist: Schema.array(Schema.string())
        .default([])
        .description('冷却白名单：填入用户 ID，这些用户的消息不受冷却限制'),
    disabledTags: Schema.array(Schema.string())
        .default([])
        .description('禁用的触发标签（留空表示全部启用）。例如填入 emotional 可关闭「情绪」类触发'),
    enableRandom: Schema.boolean()
        .default(true)
        .description('启用全部消息概率随机触发（神预言效果）'),
    randomProbability: Schema.number()
        .default(3)
        .min(0)
        .max(100)
        .description('随机触发概率（0-100，3 表示 3%）'),
    enableImage: Schema.boolean().default(true).description('启用角色卡插图'),
    imageWithMessage: Schema.boolean()
        .default(true)
        .description('将图片与文字一起发送（关闭则图片作为单独消息发送）'),
    imageProbability: Schema.number()
        .default(100)
        .min(0)
        .max(100)
        .description('附带图片的概率（0-100，100 表示每次触发都发图）'),
    respondIn: Schema.union([
        Schema.const('group').description('仅群聊'),
        Schema.const('private').description('仅私聊'),
        Schema.const('both').description('群聊与私聊'),
    ])
        .default('group')
        .description('响应范围'),
});
