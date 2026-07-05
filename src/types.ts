/**
 * 角色卡插件共享类型定义。
 *
 * 这些类型同时被核心引擎（core.ts）、加载器（loader.ts）和插件入口（index.ts）使用，
 * 是「角色卡内容」与「运行时行为」之间唯一的契约。
 */

/** 单条台词。一条台词可属于多个标签，按标签过滤随机取用。 */
export interface Quote {
    id: string;
    text: string;
    tags: string[];
}

/** 台词库文件（words.json）的结构。 */
export interface WordsData {
    /** 角色名，如「别里科夫」。 */
    character: string;
    /** 角色来源，如「契诃夫《套中人》」。 */
    source: string;
    desc?: string;
    /** 标签说明，key 为标签名，value 为该标签的场景描述。 */
    tags?: Record<string, string>;
    quotes: Quote[];
}

/** 触发词分组。一个分组对应一个标签，包含关键词集合与优先级。 */
export interface TriggerGroup {
    /** 标签名，与 WordsData.quotes[].tags 中的值对应。 */
    tag: string;
    name: string;
    desc?: string;
    matchMode: 'include';
    /** 优先级，数字越小越优先匹配。 */
    priority: number;
    keywords: string[];
}

/** 触发词文件（trigger-words.json）的结构。 */
export interface TriggerData {
    desc?: string;
    groups: TriggerGroup[];
    /** 随机触发配置（仅作角色卡默认值参考，运行时以 Config 为准）。 */
    random?: {
        enabled: boolean;
        probability: number;
        pool: string;
        desc?: string;
    };
    /** 冷却秒数（仅作角色卡默认值参考，运行时以 Config 为准）。 */
    cooldown?: number;
}

/**
 * 角色卡清单（rolecard.json）。
 *
 * 每个角色卡目录下必须存在此文件，插件启动时由加载器读取。
 * 路径字段缺省时使用默认文件名。
 */
export interface RolecardManifest {
    /** 角色卡唯一标识，如 `belikov`。用于 Config.rolecard 选中。 */
    id: string;
    /** 角色显示名，如「别里科夫」。 */
    name: string;
    description: string;
    source?: string;
    /** 台词库文件名，默认 `words.json`。 */
    wordsFile?: string;
    /** 触发词文件名，默认 `trigger-words.json`。 */
    triggerFile?: string;
    /** 插图文件名，默认 `image.png`。 */
    imageFile?: string;
}

/** 已加载的完整角色卡，包含清单与解析后的数据。 */
export interface Rolecard {
    manifest: RolecardManifest;
    words: WordsData;
    triggers: TriggerData;
    /** 插图绝对路径，无插图时为 null。 */
    imagePath: string | null;
    /** 角色卡目录绝对路径。 */
    dir: string;
}

/** 别里科夫专属的触发标签启用项。 */
export interface BelikovTagConfig {
    /** 标签名，如 `proposal`、`emotional`。 */
    tag: string;
    /** 标签显示别称，如「提议与搞事」。 */
    name: string;
    /** 是否启用该标签触发。 */
    enabled: boolean;
}

/** 别里科夫角色卡专属配置（仅在群聊勾选别里科夫时生效）。 */
export interface BelikovChannelConfig {
    /** 冷却时间（秒），该群聊内两次触发的最小间隔。 */
    cooldown: number;
    /** 触发标签启用表，逐项控制每个标签是否在该群聊生效。 */
    tags: BelikovTagConfig[];
}

/** 单个群聊/频道的配置项。 */
export interface ChannelConfig {
    /** 群号或频道号。 */
    channelId: string;
    /** 启用的机器人 selfId，留空表示不限定。 */
    botId: string;
    /** 启用的角色卡 ID 列表，如 ['belikov']。 */
    rolecards: string[];
    /** 别里科夫专属配置（仅当 rolecards 含 'belikov' 时有效）。 */
    belikov?: BelikovChannelConfig;
}

/** 插件运行时配置。所有行为参数统一由此处控制，与角色卡内容解耦。 */
export interface Config {
    // ── 基础配置 ──
    /** 冷却白名单用户 ID，这些用户的消息不受任何冷却限制（用于 Debug）。 */
    cooldownWhitelist: string[];

    // ── 多群聊配置 ──
    /** 各群聊/频道的独立配置列表。 */
    channels: ChannelConfig[];

    // ── 全局触发概率配置 ──
    /** 是否启用全部消息概率随机触发。 */
    enableRandom: boolean;
    /** 随机触发概率（0-1）。仅在 enableRandom 为真时生效。 */
    randomProbability: number;
    /** 是否启用角色卡插图。 */
    enableImage: boolean;
    /** 附带图片的概率（0-1）。仅在 enableImage 为真时生效。 */
    imageProbability: number;
}
