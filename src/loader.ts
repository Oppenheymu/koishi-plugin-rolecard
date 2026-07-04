/**
 * 角色卡加载器。
 *
 * 负责从磁盘扫描并解析角色卡目录。每个角色卡是一个子目录，包含：
 *
 * - `rolecard.json`        清单（必填）
 * - `words.json`           台词库（必填，文件名可由清单指定）
 * - `trigger-words.json`   触发词配置（必填，文件名可由清单指定）
 * - `image.png`            插图（可选，文件名可由清单指定）
 *
 * 加载器只做「读取与校验」，不做任何消息处理逻辑，
 * 因此核心引擎可以专注于运行时行为，二者完全解耦。
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Rolecard, RolecardManifest, TriggerData, WordsData } from './types';

/** 清单中路径字段的默认值。 */
const DEFAULT_WORDS_FILE = 'words.json';
const DEFAULT_TRIGGER_FILE = 'trigger-words.json';
const DEFAULT_IMAGE_FILE = 'image.png';

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
    const imageFile = manifest.imageFile ?? DEFAULT_IMAGE_FILE;

    const words = readJson<WordsData>(resolve(dir, wordsFile));
    const triggers = readJson<TriggerData>(resolve(dir, triggerFile));
    if (!words || !triggers || !Array.isArray(triggers.groups)) return null;

    const imagePath = resolve(dir, imageFile);
    return {
        manifest,
        words,
        triggers,
        imagePath: existsSync(imagePath) ? imagePath : null,
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
