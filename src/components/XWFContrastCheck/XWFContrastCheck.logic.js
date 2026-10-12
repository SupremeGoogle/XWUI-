import { XWUIComponentLogic } from '@exonware/xwui/basic';
import { DEFINITION } from './XWFContrastCheck.model.js';
export const createXWFContrastCheckLogic = (data = {}, config = {}) =>
  new XWUIComponentLogic(DEFINITION, data, config);
import { CONTRAST_RULES as r } from './XWFContrastCheck.model.js';
/** WCAG relative luminance of a validated six-digit sRGB hex color. */
export function relativeLuminance(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((channel) => parseInt(channel, 16) / r.channelDivisor)
    .map((channel) =>
      channel <= r.threshold
        ? channel / r.linearDivisor
        : ((channel + r.transferOffset) / r.transferDivisor) ** r.gamma,
    );
  return channels.reduce(
    (sum, channel, index) => sum + channel * r.weights[index],
    0,
  );
}
export function contrastRatio(first, second) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return a === null || b === null
    ? null
    : (Math.max(a, b) + r.offset) / (Math.min(a, b) + r.offset);
}
export function deriveContrastRows(kit, content) {
  return [
    [content.dark, kit.buttonText, kit.primary],
    [content.primary, kit.primary, kit.background],
    [content.white, content.whiteColor, kit.primary],
    [content.body, kit.text, kit.background],
  ].map(([label, a, b]) => {
    const ratio = contrastRatio(a, b);
    const passes = ratio !== null && ratio >= r.aa;
    return {
      label,
      ratio: ratio === null ? '—' : `${ratio.toFixed(1)} : 1`,
      passes,
      result: passes ? content.passes : content.fails,
    };
  });
}
