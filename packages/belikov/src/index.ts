import { Schema, h } from 'koishi';
import type { Context } from 'koishi';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const name = 'Belikov';

export const usage = `
<div style="border-radius: 10px; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="margin-top: 0; color: #4a6ee0;">📖 别里科夫 · 套中人</h2>
  <p>源自契诃夫《套中人》。机器人会依据群聊关键词（提议 / 情绪 / 规章 / 甩锅）或按概率，随机说出别里科夫那些谨小慎微、忧心忡忡的台词。</p>
  <ul>
    <li>触发词、冷却、概率、插图均可配置</li>
    <li>台词库见 <code>assets/words.json</code>，触发词见 <code>assets/trigger-words.json</code></li>
  </ul>
</div>

<div style="border-radius: 10px; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="margin-top: 0; color: #4a6ee0;">💬 交流与反馈</h2>
  <p>🌟 喜欢这个插件？欢迎加入 QQ 群 <a href="https://qm.qq.com/q/WngX4RQoca" style="color:#4a6ee0;text-decoration:none;"><strong>1071284605</strong></a>【晓基地插件工坊】进行交流</p>
  <p>🐛 遇到问题？欢迎在群内反馈，或点击 <a href="https://qm.qq.com/q/WngX4RQoca" style="color:#4a6ee0;text-decoration:none;">此链接</a> 加入群聊</p>
</div>
`;

interface Quote {
    id: string;
    text: string;
    tags: string[];
}

interface WordsData {
    character: string;
    source: string;
    quotes: Quote[];
}

interface TriggerGroup {
    tag: string;
    name: string;
    matchMode: 'include';
    priority: number;
    keywords: string[];
}

interface TriggerData {
    groups: TriggerGroup[];
    random: { enabled: boolean; probability: number; pool: string };
    cooldown: number;
}

const assetsDir = resolve(__dirname, '..', 'assets');

function loadJson<T>(file: string): T | null {
    const p = resolve(assetsDir, file);
    if (!existsSync(p)) return null;
    try {
        return JSON.parse(readFileSync(p, 'utf8')) as T;
    } catch {
        return null;
    }
}

const wordsData = loadJson<WordsData>('words.json');
const triggerData = loadJson<TriggerData>('trigger-words.json');

export interface Config {
    cooldown: number;
    cooldownWhitelist: string[];
    enableProposal: boolean;
    enableEmotional: boolean;
    enableRules: boolean;
    enableDistancing: boolean;
    enableRandom: boolean;
    randomProbability: number;
    enableImage: boolean;
    imageWithMessage: boolean;
    imageProbability: number;
}

export const Config: Schema<Config> = Schema.object({
    cooldown: Schema.number()
        .default(60)
        .min(0)
        .description('冷却时间（秒），同一频道内两次触发的最小间隔，防止刷屏'),
    cooldownWhitelist: Schema.array(Schema.string())
        .default([])
        .description('冷却白名单：填入用户 ID，这些用户的消息不受冷却限制'),
    enableProposal: Schema.boolean()
        .default(true)
        .description('启用「提议与搞事」类触发词（要不、计划、面基……）'),
    enableEmotional: Schema.boolean()
        .default(true)
        .description('启用「情绪波动与违规边缘」类触发词（笑死、卧槽、节奏……）'),
    enableRules: Schema.boolean()
        .default(true)
        .description('启用「规章制度与日常通知」类触发词（通知、公告、群规……）'),
    enableDistancing: Schema.boolean()
        .default(true)
        .description('启用「撇清关系与甩锅」类触发词（都怪、甩锅、谁的锅……）'),
    enableRandom: Schema.boolean()
        .default(true)
        .description('启用全部消息概率随机触发（神预言效果）'),
    randomProbability: Schema.number()
        .default(3)
        .min(0)
        .max(100)
        .description('随机触发概率（0-100，3 表示 3%）'),
    enableImage: Schema.boolean()
        .default(true)
        .description('启用别里科夫插图（assets/image.png）'),
    imageWithMessage: Schema.boolean()
        .default(true)
        .description('将图片与文字一起发送（关闭则图片作为单独消息发送）'),
    imageProbability: Schema.number()
        .default(100)
        .min(0)
        .max(100)
        .description('附带图片的概率（0-100，100 表示每次触发都发图）'),
});

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function apply(ctx: Context, config: Config) {
    const logger = ctx.logger('belikov');
    logger.info('Belikov plugin loaded');

    if (!wordsData || !triggerData) {
        logger.error('无法加载 words.json 或 trigger-words.json，插件将不会响应消息');
        return;
    }

    // tag -> quotes
    const quotesByTag = new Map<string, Quote[]>();
    for (const q of wordsData.quotes) {
        for (const tag of q.tags) {
            let list = quotesByTag.get(tag);
            if (!list) {
                list = [];
                quotesByTag.set(tag, list);
            }
            list.push(q);
        }
    }
    const allQuotes = wordsData.quotes;

    // groups sorted by priority (smaller = higher priority)
    const groups = [...triggerData.groups].sort((a, b) => a.priority - b.priority);

    const tagEnabled: Record<string, (c: Config) => boolean> = {
        proposal: (c) => c.enableProposal,
        emotional: (c) => c.enableEmotional,
        rules: (c) => c.enableRules,
        distancing: (c) => c.enableDistancing,
    };

    // load image buffer once
    const imagePath = resolve(assetsDir, 'image.png');
    let imageBuffer: Buffer | null = null;
    if (existsSync(imagePath)) {
        try {
            imageBuffer = readFileSync(imagePath);
        } catch {
            imageBuffer = null;
        }
    } else {
        logger.warn('未找到 assets/image.png，将不发送图片');
    }

    // per-channel cooldown: channelId -> last trigger timestamp
    const lastTrigger = new Map<string, number>();

    ctx.on('message', async (session) => {
        // only respond in group chats
        if (!session.guildId) return;
        // ignore self / empty user
        if (!session.userId || session.userId === session.selfId) return;

        // plain text: strip koishi element tags (e.g. <at id="..."/>)
        const raw = session.content ?? '';
        const content = raw.replace(/<[^>]+>/g, '');
        if (!content) return;

        const channelId = session.channelId ?? session.guildId;
        const now = Date.now();

        // cooldown (whitelist bypasses)
        const inWhitelist = config.cooldownWhitelist.includes(session.userId);
        if (!inWhitelist) {
            const last = lastTrigger.get(channelId) ?? 0;
            if (now - last < config.cooldown * 1000) return;
        }

        // 1. keyword matching by priority
        let matchedTag: string | null = null;
        for (const g of groups) {
            const enabled = tagEnabled[g.tag]?.(config) ?? false;
            if (!enabled) continue;
            if (g.matchMode === 'include' && g.keywords.some((k) => content.includes(k))) {
                matchedTag = g.tag;
                break;
            }
        }

        // 2. random trigger when no keyword matched
        let quote: Quote | null = null;
        if (matchedTag) {
            quote = pick(quotesByTag.get(matchedTag) ?? allQuotes);
        } else if (config.enableRandom && Math.random() * 100 < config.randomProbability) {
            quote = pick(allQuotes);
        }

        if (!quote) return;

        // mark trigger time
        lastTrigger.set(channelId, now);

        // build & send
        try {
            const wantImage =
                config.enableImage &&
                !!imageBuffer &&
                Math.random() * 100 < config.imageProbability;
            if (wantImage && imageBuffer) {
                if (config.imageWithMessage) {
                    await session.send([h.text(quote.text), h.image(imageBuffer, 'image/png')]);
                } else {
                    await session.send(quote.text);
                    await session.send(h.image(imageBuffer, 'image/png'));
                }
            } else {
                await session.send(quote.text);
            }
        } catch (e) {
            logger.warn('发送消息失败', e);
        }
    });
}
