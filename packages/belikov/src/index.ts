import { Schema } from 'koishi';
import type { Context } from 'koishi';

export const name = 'Belikov';

export const usage = `
<div style="border-radius: 10px; border: 1px solid #ddd; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  <h2 style="margin-top: 0; color: #4a6ee0;">📖 使用说明</h2>
  <p>✨ Belikov 身份卡插件</p>
</div>
`;

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
    ctx.logger('belikov').info('Belikov plugin loaded');
}
