/** Pure DOM projection; all controls are XWUI basic. */
import { h } from '../../core/dom.js';
export function projectXWFIsoTilesView({ tiles, topology }, handlers, ui) {
 return h('div', { class: `xwf-iso-tiles ${topology ? 'xwf-iso-tiles--topology' : ''}`, role: 'img', 'aria-label': tiles.map((tile) => tile.label).join(', '), dir: 'ltr' },
   h('div', { class: 'xwf-iso-tiles__plane' }, topology && h('div', { class: 'floor' }),
     topology && h('svg', { viewBox: '0 0 520 340', 'aria-hidden': 'true' }, ['M110 170 L250 80','M110 170 L250 260','M290 80 L410 170','M290 260 L410 170'].map((d, index) => h('path', { d, fill: 'none', stroke: `var(--xw-${tiles[index]?.tone ?? 'cyan'})`, 'stroke-width': 3, class: 'flow' }))),
     tiles.map((tile) => h('div', { class: `xwf-iso-tiles__tile ${tile.attention ? 'xwf-iso-tiles__tile--attention' : ''}`, style: { left: `${tile.x}px`, top: `${tile.y}px`, '--xwf-tone': `var(--xw-${tile.tone})`, '--xwf-depth': `${tile.z}px` } }, tile.label))));
}
