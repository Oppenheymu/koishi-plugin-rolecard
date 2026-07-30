/**
 * koishi-plugin-rolecard 插件入口。
 *
 * 架构概览：
 *
 * - `types.ts`   共享类型契约（角色卡内容 + 运行时配置接口）
 * - `config.ts`  配置 Schema 声明（默认值、校验、UI 描述、条件联动）
 * - `loader.ts`  角色卡加载器（扫描并解析 assets/ 目录）
 * - `core.ts`    核心引擎（通用台词引擎，与具体角色解耦）
 * - `index.ts`   本文件，组装以上模块并对接 Koishi 生命周期
 *
 * 角色卡是纯数据资源，存放在 `assets/<id>/` 下。用户通过各群聊配置中的
 * `rolecards` 字段选择该群聊启用哪些角色卡。新增角色卡只需添加数据目录。
 */

import { resolve } from 'node:path';
import type { Context } from 'koishi';
import { Config } from './config';
import { RolecardEngine } from './core';
import { loadRolecards } from './loader';
import type { ChannelConfig, Config as ConfigType, Rolecard } from './types';

export const name = 'rolecard';

export const usage = `
<div style="border-radius: 10px; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="margin-top: 0; color: #4a6ee0;">🎭 角色卡插件 · Rolecard</h2>
  <p>数据驱动的角色台词引擎。核心逻辑与角色卡内容完全解耦——角色卡是纯数据资源（台词库 + 触发词 + 插图），引擎根据数据自动驱动对话。</p>
  <ul>
    <li>在 <code>assets/</code> 目录下放置角色卡，每个角色卡一个子目录</li>
    <li>在「多群聊配置」中为每个群聊勾选要启用的角色卡</li>
    <li>支持关键词触发（按优先级）与概率随机触发</li>
    <li>冷却防刷屏、触发标签开关、插图发送均可按群聊独立配置</li>
  </ul>
  <p>🤝 想贡献新的角色卡？欢迎提交 PR，前往 <a href="https://github.com/Oppenheymu/koishi-plugin-rolecard" style="color:#4a6ee0;text-decoration:none;">仓库</a> 参与共建</p>
</div>

<div style="border-radius: 10px; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="margin-top: 0; color: #4a6ee0;">💬 交流与反馈</h2>
  <p>🌟 喜欢这个插件？欢迎加入 QQ 群 <a href="https://qm.qq.com/q/WngX4RQoca" style="color:#4a6ee0;text-decoration:none;"><strong>1071284605</strong></a>【晓基地插件工坊】进行交流</p>
  <p>🐛 遇到问题？欢迎在群内反馈，或点击 <a href="https://qm.qq.com/q/WngX4RQoca" style="color:#4a6ee0;text-decoration:none;">此链接</a> 加入群聊</p>
</div>
`;

export { Config };

export function apply(ctx: Context, config: ConfigType) {
    const logger = ctx.logger('rolecard');

    // 角色卡目录位于插件包根目录下的 assets/
    const assetsDir = resolve(__dirname, '..', 'assets');
    const rolecards = loadRolecards(assetsDir);

    if (rolecards.length === 0) {
        logger.warn('未找到任何角色卡，请检查 assets 目录');
        return;
    }

    const rolecardMap = new Map<string, Rolecard>(rolecards.map((r) => [r.manifest.id, r]));
    logger.info(`发现角色卡：${[...rolecardMap.keys()].join(', ')}`);

    // 按 channelId 索引群聊配置
    const channelMap = new Map<string, ChannelConfig>();
    for (const ch of config.channels) {
        if (ch.channelId) channelMap.set(ch.channelId, ch);
    }

    // 为每个群聊配置中启用的角色卡创建引擎实例
    for (const ch of config.channels) {
        if (!ch.channelId) continue;

        // 别里科夫角色卡
        if (ch.belikov) {
            const rolecard = rolecardMap.get('belikov');
            if (!rolecard) {
                logger.warn(`群聊 ${ch.channelId}：未找到角色卡 "belikov"，跳过`);
            } else {
                // 将群聊级专属配置注入到引擎可访问的位置
                const engineConfig = {
                    ...config,
                    __channelRoleConfig: ch.belikovConfig,
                } as ConfigType & {
                    __channelRoleConfig?: NonNullable<ChannelConfig['belikovConfig']>;
                };

                // 用子作用域隔离各引擎，仅接收白名单内群聊的消息
                let subCtx = ctx.channel(ch.channelId);
                if (ch.botId) subCtx = subCtx.self(ch.botId);
                new RolecardEngine(subCtx, rolecard, engineConfig);
            }
        }

        // 格里高尔角色卡
        if (ch.gregorSamsa) {
            const rolecard = rolecardMap.get('gregor-samsa');
            if (!rolecard) {
                logger.warn(`群聊 ${ch.channelId}：未找到角色卡 "gregor-samsa"，跳过`);
            } else {
                const engineConfig = {
                    ...config,
                    __channelRoleConfig: ch.gregorSamsaConfig,
                } as ConfigType & {
                    __channelRoleConfig?: NonNullable<ChannelConfig['gregorSamsaConfig']>;
                };

                let subCtx = ctx.channel(ch.channelId);
                if (ch.botId) subCtx = subCtx.self(ch.botId);
                new RolecardEngine(subCtx, rolecard, engineConfig);
            }
        }

        // 孔乙己角色卡
        if (ch.kongYiji) {
            const rolecard = rolecardMap.get('kong-yiji');
            if (!rolecard) {
                logger.warn(`群聊 ${ch.channelId}：未找到角色卡 "kong-yiji"，跳过`);
            } else {
                const engineConfig = {
                    ...config,
                    __channelRoleConfig: ch.kongYijiConfig,
                } as ConfigType & {
                    __channelRoleConfig?: NonNullable<ChannelConfig['kongYijiConfig']>;
                };

                let subCtx = ctx.channel(ch.channelId);
                if (ch.botId) subCtx = subCtx.self(ch.botId);
                new RolecardEngine(subCtx, rolecard, engineConfig);
            }
        }

        // 阿Q角色卡
        if (ch.ahQ) {
            const rolecard = rolecardMap.get('ah-q');
            if (!rolecard) {
                logger.warn(`群聊 ${ch.channelId}：未找到角色卡 "ah-q"，跳过`);
            } else {
                const engineConfig = {
                    ...config,
                    __channelRoleConfig: ch.ahQConfig,
                } as ConfigType & {
                    __channelRoleConfig?: NonNullable<ChannelConfig['ahQConfig']>;
                };

                let subCtx = ctx.channel(ch.channelId);
                if (ch.botId) subCtx = subCtx.self(ch.botId);
                new RolecardEngine(subCtx, rolecard, engineConfig);
            }
        }

        // 哈姆雷特角色卡
        if (ch.hamlet) {
            const rolecard = rolecardMap.get('hamlet');
            if (!rolecard) {
                logger.warn(`群聊 ${ch.channelId}：未找到角色卡 "hamlet"，跳过`);
            } else {
                const engineConfig = {
                    ...config,
                    __channelRoleConfig: ch.hamletConfig,
                } as ConfigType & {
                    __channelRoleConfig?: NonNullable<ChannelConfig['hamletConfig']>;
                };

                let subCtx = ctx.channel(ch.channelId);
                if (ch.botId) subCtx = subCtx.self(ch.botId);
                new RolecardEngine(subCtx, rolecard, engineConfig);
            }
        }

        // 堂吉诃德角色卡
        if (ch.donQuixote) {
            const rolecard = rolecardMap.get('don-quixote');
            if (!rolecard) {
                logger.warn(`群聊 ${ch.channelId}：未找到角色卡 "don-quixote"，跳过`);
            } else {
                const engineConfig = {
                    ...config,
                    __channelRoleConfig: ch.donQuixoteConfig,
                } as ConfigType & {
                    __channelRoleConfig?: NonNullable<ChannelConfig['donQuixoteConfig']>;
                };

                let subCtx = ctx.channel(ch.channelId);
                if (ch.botId) subCtx = subCtx.self(ch.botId);
                new RolecardEngine(subCtx, rolecard, engineConfig);
            }
        }
    }
}
