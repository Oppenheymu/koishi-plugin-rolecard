/**
 * 角色卡加载器。
 *
 * 负责从磁盘扫描并解析角色卡目录。每个角色卡是一个子目录，包含：
 *
 * - `rolecard.json`        清单（必填）
 * - `words.json`           台词库（必填，文件名可由清单指定）
 * - `trigger-words.json`   触发词配置（必填，文件名可由清单指定）
 * - `*.png` / `*.jpg` 等   插图（可选，自动扫描目录下所有图片）
 *
 * 加载器只做「读取与校验」，不做任何消息处理逻辑，
 * 因此核心引擎可以专注于运行时行为，二者完全解耦。
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import type { Rolecard, RolecardImage, RolecardManifest, TriggerData, WordsData } from './types';

/** 清单中路径字段的默认值。 */
const DEFAULT_WORDS_FILE = 'words.json';
const DEFAULT_TRIGGER_FILE = 'trigger-words.json';

/** 支持的图片扩展名到 MIME 类型映射。 */
const IMAGE_MIME_MAP: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
};

/** 扫描目录下所有支持的图片文件，返回带 MIME 类型的列表。 */
function scanImages(dir: string): RolecardImage[] {
    const images: RolecardImage[] = [];
    for (const entry of readdirSync(dir)) {
        const ext = extname(entry).toLowerCase();
        const mime = IMAGE_MIME_MAP[ext];
        if (!mime) continue;
        images.push({ path: resolve(dir, entry), mime });
    }
    return images;
}

function readJson<T>(path: string): T | null {
    if (!existsSync(path)) return null;
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as T;
    } catch {
        return null;
    }
}

/**
 * 加载单个角色卡目录。
 *
 * @returns 解析成功返回完整 `Rolecard`；清单缺失/数据无效返回 `null`。
 */
export function loadRolecard(dir: string): Rolecard | null {
    const manifest = readJson<RolecardManifest>(resolve(dir, 'rolecard.json'));
    if (!manifest?.id || !manifest?.name) return null;

    const wordsFile = manifest.wordsFile ?? DEFAULT_WORDS_FILE;
    const triggerFile = manifest.triggerFile ?? DEFAULT_TRIGGER_FILE;

    const words = readJson<WordsData>(resolve(dir, wordsFile));
    const triggers = readJson<TriggerData>(resolve(dir, triggerFile));
    if (!words || !triggers || !Array.isArray(triggers.groups)) return null;

    // 扫描目录下所有支持的图片文件，实现多图随机发送
    const images = scanImages(dir);
    return {
        manifest,
        words,
        triggers,
        images,
        dir,
    };
}

/**
 * 扫描目录下的所有角色卡子目录并加载。
 *
 * 非目录项与无效的角色卡会被静默跳过。
 */
export function loadRolecards(baseDir: string): Rolecard[] {
    if (!existsSync(baseDir)) return [];
    const result: Rolecard[] = [];
    for (const entry of readdirSync(baseDir)) {
        const dir = resolve(baseDir, entry);
        if (!statSync(dir).isDirectory()) continue;
        const card = loadRolecard(dir);
        if (card) result.push(card);
    }
    return result;
}
