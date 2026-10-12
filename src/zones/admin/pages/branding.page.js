import { ADMIN_ROUTES } from '../../../core/routes.js';
import { h } from '../../../core/dom.js';
import { pageSession, routeAction } from '../../../components/xwf-ui.js';
import { XWFBrandPreview } from '../../../components/XWFBrandPreview/XWFBrandPreview.js';
import { XWFContrastCheck } from '../../../components/XWFContrastCheck/XWFContrastCheck.js';
import { contrastRatio } from '../../../components/XWFContrastCheck/XWFContrastCheck.logic.js';

export default {
  id: 'admin-branding',
  path: ADMIN_ROUTES.branding,
  layout: 'admin',
  title: 'Branding',
  async mount(el, ctx) {
    const session = pageSession(el, ctx);
    const { ui, scope } = session;
    const data = await ctx.api.adminApi.getBranding();
    if (!session.active) return session.handle;
    const c = data.content;
    ctx.setTitle(c.title);
    let draft = structuredClone(data.kit);
    let saved = structuredClone(data.kit);
    let busy = false;
    let revision = 0;
    const dirty = () =>
      !saved.savedAt ||
      Object.keys(draft).some(
        (key) => key !== 'savedAt' && draft[key] !== saved[key],
      );
    const preview = ui.mount(XWFBrandPreview, {
      kit: draft,
      content: c.preview,
      labels: data.labels,
      dirty: dirty(),
    });
    const contrast = ui.mount(XWFContrastCheck, {
      kit: draft,
      content: { ...c.contrast, whiteColor: data.rules.whiteText },
    });
    scope.listen(preview, 'xwf-action', () => ctx.notify.info(c.preview.note));
    const status = ui.tag(data.labels.notSaved, 'default', {
      className: 'xw-tone-plan',
    });
    const save = ui.button(c.save, { onClick: saveKit });
    const refreshPreview = () => {
      if (!session.active) return;
      preview.xw.updateData({ kit: { ...draft }, dirty: dirty() });
      contrast.xw.updateData({ kit: { ...draft } });
      status.xw.updateData({
        label: dirty() ? data.labels.notSaved : data.labels.saved,
      });
      save.xw.updateConfig({ disabled: !dirty(), loading: busy });
      Object.entries(uploadRemoveControls).forEach(([key, control]) =>
        control.xw.updateConfig({ disabled: !draft[key] }),
      );
    };
    const colorControls = {};
    const uploadRemoveControls = {};
    const update = (key, value) => {
      draft[key] = value;
      revision += 1;
      if (key === 'primary' && /^#[0-9a-f]{6}$/i.test(value)) {
        const dark = contrastRatio(data.rules.darkText, value);
        const white = contrastRatio(data.rules.whiteText, value);
        draft.buttonText =
          white > dark ? data.rules.whiteText : data.rules.darkText;
        colorControls.buttonText?.xw.setValue(draft.buttonText);
      }
      refreshPreview();
    };
    async function saveKit() {
      if (busy || !dirty()) return;
      busy = true;
      const sentRevision = revision;
      refreshPreview();
      try {
        const result = await ctx.api.adminApi.saveBrandKit({ ...draft });
        if (session.active) {
          saved = result;
          if (revision === sentRevision) draft = structuredClone(result);
          ctx.notify.success(c.saved);
        }
      } catch (error) {
        if (session.active) ctx.notify.error(error.message);
      } finally {
        busy = false;
        refreshPreview();
      }
    }
    function readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    const uploadPreviews = {};
    async function upload(key, files) {
      const file = files[0];
      if (!file) return;
      if (
        !data.rules.mime.includes(file.type) ||
        file.size > data.rules.maxBytes
      ) {
        ctx.notify.error(c.uploadError);
        return;
      }
      const url = URL.createObjectURL(file);
      const host = uploadPreviews[key];
      host.replaceChildren(
        h('img', { src: url, alt: key === 'logo' ? c.logo : c.favicon }),
      );
      try {
        const value = await readFile(file);
        if (session.active) {
          update(key, value);
          host.replaceChildren(
            h('img', { src: value, alt: key === 'logo' ? c.logo : c.favicon }),
          );
        }
      } catch {
        if (session.active) ctx.notify.error(c.uploadError);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    const uploads = ['logo', 'favicon'].map((key) => {
      const previewHost = h('div');
      uploadPreviews[key] = previewHost;
      if (draft[key])
        previewHost.append(h('img', { src: draft[key], alt: c[key] }));
      const clearImage = () => {
        update(key, '');
        previewHost.replaceChildren();
      };
      const picker = ui.upload(
        c[`${key}Action`],
        (files) => upload(key, files),
        {
          accept: data.rules.mime.join(','),
          maxSize: data.rules.maxBytes,
          listType: 'text',
        },
      );
      picker.xw.onRemove(clearImage);
      const remove = ui.button(c[`${key}Remove`], {
        variant: 'ghost',
        size: 'sm',
        disabled: !draft[key],
        onClick: () => {
          picker.xw.getFiles().forEach((file) => picker.xw.removeFile(file.id));
          clearImage();
        },
      });
      uploadRemoveControls[key] = remove;
      return h(
        'div',
        { class: `xwf-brand-upload xwf-brand-upload--${key} stack gap8` },
        h('span', { class: 'lbl' }, c[key]),
        picker,
        previewHost,
        remove,
      );
    });
    async function useSample(index) {
      try {
        const sample = await ctx.api.adminApi.getBrandingSample(index - 1);
        if (!session.active) return;
        for (const key of ['logo', 'favicon'])
          await upload(key, [
            new File([sample[key].content], sample[key].id + '.svg', {
              type: 'image/svg+xml',
            }),
          ]);
      } catch (error) {
        if (session.active) ctx.notify.error(error.message);
      }
    }
    const nameFields = c.fields
      .filter((field) => field.key !== 'domain')
      .map((field) =>
        ui.text(
          { ...field, value: draft[field.key] },
          (value) => update(field.key, value),
          { required: true },
        ),
      );
    const domain = c.fields.find((field) => field.key === 'domain');
    const colorFields = ['primary', 'background', 'text', 'buttonText'].map(
      (key) => {
        const control = ui.color(draft[key], (value) => update(key, value), {
          fieldLabel: c[key],
          presets: c.presets,
          format: 'hex',
          clearable: false,
        });
        colorControls[key] = control;
        const input = control.querySelector('input');
        const picker = control.querySelector('button');
        input?.setAttribute('aria-label', c[key]);
        picker?.setAttribute('aria-label', `${c[key]} picker`);
        return h(
          'div',
          { class: 'xwf-brand-color-field' },
          h('label', { class: 'lbl', for: input?.id }, c[key]),
          control,
        );
      },
    );
    const form = h(
      'form',
      {
        class: 'xwf-brand-form',
        'aria-label': c.title,
        onSubmit: (event) => {
          event.preventDefault();
          saveKit();
        },
      },
      ui.card(
        h(
          'div',
          { class: 'stack gap16' },
          nameFields,
          h('div', { class: 'wrapf gap12' }, uploads),
          h(
            'div',
            { class: 'xwf-brand-samples', 'aria-label': c.samplesLabel },
            c.sampleLabels.map((label, index) =>
              ui.button(label, {
                variant: 'secondary',
                size: 'sm',
                onClick: () => useSample(index + 1),
              }),
            ),
          ),
          h('div', { class: 'wrapf gap16' }, colorFields),
          ui.select(
            { label: c.typeface, options: c.fonts, value: draft.font },
            (value) => update('font', value),
          ),
          ui.switch(
            { label: c.removeMarks, checked: draft.removeMarks },
            (value) => update('removeMarks', value),
          ),
          h('p', { class: 'xs sec' }, c.removeHint),
          ui.text({ ...domain, value: draft.domain }, (value) =>
            update('domain', value),
          ),
          h(
            'div',
            { class: 'rowf gap12 wrapf' },
            save,
            status,
            ui.tag(c.requires),
          ),
        ),
        { padding: 'medium' },
      ),
    );
    el.replaceChildren(
      h(
        'div',
        { class: 'stack gap4' },
        h('h1', { class: 'h2 xwf-page-title' }, c.title),
        h('p', { class: 'sec' }, c.description),
      ),
      ui.alert({ message: c.notice }, { variant: 'warning' }),
      h(
        'div',
        { class: 'rowf gap12' },
        h('p', { class: 'xs sec grow' }, data.labels.demoNote),
        routeAction(ui, { label: c.plans, path: c.plansPath }, { size: 'sm' }),
      ),
      h(
        'div',
        { class: 'wrapf gap24' },
        form,
        h(
          'div',
          { class: 'xwf-brand-results stack gap16' },
          ui.card(preview, { padding: 'small' }),
          ui.card(contrast, { padding: 'medium' }),
        ),
      ),
    );
    refreshPreview();
    return session.handle;
  },
};
