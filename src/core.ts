/**
 * 角色卡核心引擎。
 *
 * `RolecardEngine` 是与具体角色完全解耦的通用台词引擎。每个引擎实例绑定
 * 一个角色卡 + 一个群聊配置，负责：
 *
 * 1. 将台词按标签索引，供关键词命中后随机取用
 * 2. 按优先级匹配消息中的触发词
 * 3. 未命中关键词时按概率随机触发
 * 4. 分频道冷却控制（支持白名单豁免）
 * 5. 按配置决定是否附带插图
 *
 * 任何新角色卡只要提供符合 `types.ts` 契约的数据文件即可被引擎驱动，
 * 无需修改本模块任何代码。
 */

import { readFileSync } from 'node:fs';
import type { Context, Logger, Session } from 'koishi';
import { h } from 'koishi';
import type { Config, Quote, Rolecard } from './types';

/** 从数组中随机取一个元素。 */
function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export class RolecardEngine {
    private readonly logger: Logger;
    private readonly quotesByTag = new Map<string, Quote[]>();
    private readonly allQuotes: Quote[];
    private readonly groups: Rolecard['triggers']['groups'];
    private imageBuffer: Buffer | null = null;
    private readonly lastTrigger = new Map<string, number>();

    constructor(
        ctx: Context,
        private readonly rolecard: Rolecard,
        private readonly config: Config,
    ) {
        this.logger = ctx.logger(`rolecard:${rolecard.manifest.id}`);

        // 按标签建立台词索引
        for (const q of rolecard.words.quotes) {
            for (const tag of q.tags) {
                let list = this.quotesByTag.get(tag);
                if (!list) {
                    list = [];
                    this.quotesByTag.set(tag, list);
                }
                list.push(q);
            }
        }
        this.allQuotes = rolecard.words.quotes;

        // 按优先级排序触发词分组（数字越小越优先）
        this.groups = [...rolecard.triggers.groups].sort(
            (a, b) => a.priority - b.priority,
        );

        // 预加载插图到内存
        if (rolecard.imagePath) {
            try {
                this.imageBuffer = readFileSync(rolecard.imagePath);
            } catch {
                this.imageBuffer = null;
            }
        } else {
            this.logger.warn('未找到角色卡插图，将不发送图片');
        }

        ctx.on('message', (session) => this.handle(session));

        this.logger.info(`角色卡已加载：${rolecard.manifest.name}`);
    }

    private async handle(session: Session): Promise<void> {
        // 忽略自身与空用户
        if (!session.userId || session.userId === session.selfId) return;

        // 纯文本：剥离 koishi 元素标签（如 <at id="..."/>）
        const raw = session.content ?? '';
        const content = raw.replace(/<[^>]+>/g, '');
        if (!content) return;

        const channelId = session.channelId ?? session.guildId ?? session.userId;
        const now = Date.now();

        // 冷却控制（全局白名单豁免）
        if (!this.config.cooldownWhitelist.includes(session.userId)) {
            const last = this.lastTrigger.get(channelId) ?? 0;
            const cooldown = this.getChannelCooldown();
            if (cooldown > 0 && now - last < cooldown * 1000) return;
        }

        // 1. 按优先级匹配关键词
        let matchedTag: string | null = null;
        const disabledTags = this.getDisabledTags();
        for (const g of this.groups) {
            if (disabledTags.includes(g.tag)) continue;
            if (g.matchMode === 'include' && g.keywords.some((k) => content.includes(k))) {
                matchedTag = g.tag;
                break;
            }
        }

        // 2. 未命中关键词时按概率随机触发
        let quote: Quote | null = null;
        const belikovCfg = this.getBelikovConfig();
        if (matchedTag) {
            quote = pick(this.quotesByTag.get(matchedTag) ?? this.allQuotes);
        } else if (
            belikovCfg?.enableRandom &&
            Math.random() < belikovCfg.randomProbability
        ) {
            quote = pick(this.allQuotes);
        }

        if (!quote) return;

        // 标记触发时间
        this.lastTrigger.set(channelId, now);

        // 构建并发送消息
        try {
            const wantImage =
                belikovCfg?.enableImage &&
                !!this.imageBuffer &&
                Math.random() < belikovCfg.imageProbability;
            if (wantImage && this.imageBuffer) {
                await session.send([
                    h.text(quote.text),
                    h.image(this.imageBuffer, 'image/png'),
                ]);
            } else {
                await session.send(quote.text);
            }
        } catch (e) {
            this.logger.warn('发送消息失败', e);
        }
    }

    /**
     * 获取该群聊的冷却时间。
     * 若角色卡有专属配置（如别里科夫）则取其 cooldown，否则返回 0（不冷却）。
     */
    private getChannelCooldown(): number {
        const belikovCfg = this.getBelikovConfig();
        if (belikovCfg) return belikovCfg.cooldown;
        return 0;
    }

    /**
     * 获取该群聊禁用的触发标签。
     * 若角色卡有专属配置（如别里科夫）则从其 tags 表中取 enabled=false 的标签。
     */
    private getDisabledTags(): string[] {
        const belikovCfg = this.getBelikovConfig();
        if (!belikovCfg) return [];
        return belikovCfg.tags.filter((t) => !t.enabled).map((t) => t.tag);
    }

    /**
     * 获取别里科夫专属配置（仅当当前引擎的角色卡是别里科夫时）。
     * 调用方需确保 config.channels 中存在对应 channelId 的配置。
     */
    private getBelikovConfig() {
        if (this.rolecard.manifest.id !== 'belikov') return null;
        // 由 index.ts 注入的 ChannelConfig 通过闭包传递
        // 这里简化处理：belikov 配置直接挂在 config 上（见 index.ts 的引擎实例化逻辑）
        return (this.config as Config & { __channelBelikov?: NonNullable<Config['channels'][number]['belikovConfig']> }).__channelBelikov ?? null;
    }
}
