/**
 * koishi-plugin-rolecard 插件入口。
 *
 * 架构概览：
 *
 * - `types.ts`   共享类型契约（角色卡内容 + 运行时配置）
 * - `loader.ts`  角色卡加载器（扫描并解析 rolecards/ 目录）
 * - `core.ts`    核心引擎（通用台词引擎，与具体角色解耦）
 * - `index.ts`   本文件，组装三者并对接 Koishi 生命周期
 *
 * 角色卡是纯数据资源，存放在 `rolecards/<id>/` 下。用户通过 Config.rolecard
 * 选择要激活的角色卡。新增角色卡只需添加数据目录，无需改动任何源码。
 */

import { resolve } from 'node:path';
import type { Context } from 'koishi';
import { Schema } from 'koishi';
import { RolecardEngine } from './core';
import { loadRolecards } from './loader';
import type { Config as ConfigType } from './types';

export const name = 'rolecard';

export const usage = `
<div style="border-radius: 10px; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="margin-top: 0; color: #4a6ee0;">🎭 角色卡插件 · Rolecard</h2>
  <p>数据驱动的角色台词引擎。核心逻辑与角色卡内容完全解耦——角色卡是纯数据资源（台词库 + 触发词 + 插图），引擎根据数据自动驱动对话。</p>
  <ul>
    <li>在 <code>rolecards/</code> 目录下放置角色卡，每个角色卡一个子目录</li>
    <li>通过配置项 <code>rolecard</code> 选择要加载的角色卡 ID</li>
    <li>支持关键词触发（按优先级）与概率随机触发</li>
    <li>冷却防刷屏、插图发送、响应范围均可配置</li>
  </ul>
</div>

<div style="border-radius: 10px; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="margin-top: 0; color: #4a6ee0;">💬 交流与反馈</h2>
  <p>🌟 喜欢这个插件？欢迎加入 QQ 群 <a href="https://qm.qq.com/q/WngX4RQoca" style="color:#4a6ee0;text-decoration:none;"><strong>1071284605</strong></a>【晓基地插件工坊】进行交流</p>
  <p>🐛 遇到问题？欢迎在群内反馈，或点击 <a href="https://qm.qq.com/q/WngX4RQoca" style="color:#4a6ee0;text-decoration:none;">此链接</a> 加入群聊</p>
</div>
`;

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

export function apply(ctx: Context, config: ConfigType) {
    const logger = ctx.logger('rolecard');

    // 角色卡目录位于插件包根目录下的 rolecards/
    const rolecardsDir = resolve(__dirname, '..', 'rolecards');
    const rolecards = loadRolecards(rolecardsDir);

    if (rolecards.length === 0) {
        logger.warn('未找到任何角色卡，请检查 rolecards 目录');
        return;
    }

    const availableIds = rolecards.map((r) => r.manifest.id).join(', ');
    logger.info(`发现角色卡：${availableIds}`);

    // 按配置选择角色卡；留空则取第一个
    const selected = config.rolecard
        ? rolecards.filter((r) => r.manifest.id === config.rolecard)
        : [rolecards[0]];

    if (selected.length === 0) {
        logger.warn(`未找到角色卡 "${config.rolecard}"，可用：${availableIds}`);
        return;
    }

    for (const rolecard of selected) {
        new RolecardEngine(ctx, rolecard, config);
    }
}
