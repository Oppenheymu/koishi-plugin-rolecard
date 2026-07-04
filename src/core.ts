/**
 * 角色卡核心引擎。
 *
 * `RolecardEngine` 是与具体角色完全解耦的通用台词引擎。它接收一个已加载的
 * `Rolecard`（纯数据）和 `Config`（运行时参数），负责：
 *
 * 1. 将台词按标签索引，供关键词命中后随机取用
 * 2. 按优先级匹配消息中的触发词
 * 3. 未命中关键词时按概率随机触发
 * 4. 分频道冷却控制（支持白名单豁免）
 * 5. 按配置决定是否附带插图、插图发送方式
 * 6. 按配置限定响应范围（群聊 / 私聊 / 两者）
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
        rolecard: Rolecard,
        private readonly config: Config
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
        this.groups = [...rolecard.triggers.groups].sort((a, b) => a.priority - b.priority);

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
        // 响应范围控制
        const isGroup = !!session.guildId;
        if (isGroup && this.config.respondIn === 'private') return;
        if (!isGroup && this.config.respondIn === 'group') return;

        // 忽略自身与空用户
        if (!session.userId || session.userId === session.selfId) return;

        // 纯文本：剥离 koishi 元素标签（如 <at id="..."/>）
        const raw = session.content ?? '';
        const content = raw.replace(/<[^>]+>/g, '');
        if (!content) return;

        const channelId = session.channelId ?? session.guildId ?? session.userId;
        const now = Date.now();

        // 冷却控制（白名单豁免）
        if (!this.config.cooldownWhitelist.includes(session.userId)) {
            const last = this.lastTrigger.get(channelId) ?? 0;
            if (now - last < this.config.cooldown * 1000) return;
        }

        // 1. 按优先级匹配关键词
        let matchedTag: string | null = null;
        for (const g of this.groups) {
            if (this.config.disabledTags.includes(g.tag)) continue;
            if (g.matchMode === 'include' && g.keywords.some((k) => content.includes(k))) {
                matchedTag = g.tag;
                break;
            }
        }

        // 2. 未命中关键词时按概率随机触发
        let quote: Quote | null = null;
        if (matchedTag) {
            quote = pick(this.quotesByTag.get(matchedTag) ?? this.allQuotes);
        } else if (
            this.config.enableRandom &&
            Math.random() * 100 < this.config.randomProbability
        ) {
            quote = pick(this.allQuotes);
        }

        if (!quote) return;

        // 标记触发时间
        this.lastTrigger.set(channelId, now);

        // 构建并发送消息
        try {
            const wantImage =
                this.config.enableImage &&
                !!this.imageBuffer &&
                Math.random() * 100 < this.config.imageProbability;
            if (wantImage && this.imageBuffer) {
                if (this.config.imageWithMessage) {
                    await session.send([
                        h.text(quote.text),
                        h.image(this.imageBuffer, 'image/png'),
                    ]);
                } else {
                    await session.send(quote.text);
                    await session.send(h.image(this.imageBuffer, 'image/png'));
                }
            } else {
                await session.send(quote.text);
            }
        } catch (e) {
            this.logger.warn('发送消息失败', e);
        }
    }
}
