const motion = matchMedia('(prefers-reduced-motion: reduce)');
let utilities;

function staticMarkup(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script,meta,base,link,iframe,frame,object,embed,portal,audio,video')
    .forEach(node => node.remove());
  for (const node of template.content.querySelectorAll('*')) {
    for (const attr of [...node.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || ['action','formaction','ping','srcset','target','download','autofocus'].includes(name)) {
        node.removeAttribute(attr.name);
      } else if (['src','href','xlink:href','poster'].includes(name)) {
        const image = /^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(attr.value);
        if (!attr.value.startsWith('#') && !image) node.removeAttribute(attr.name);
      }
    }
  }
  return template.innerHTML;
}

export async function frameContent(code, format, dark) {
  if (format === 'Tailwind') {
    utilities ??= fetch('./uiverse/tailwind.css').then(response => {
      if (!response.ok) throw Error('Local Tailwind styles unavailable');
      return response.text();
    }).catch(error => { utilities = undefined; throw error; });
  }
  const css = format === 'Tailwind' ? (await utilities).replace(/<\/style/gi, '<\\/style') : '';
  const background = dark ? '#172338' : '#e9eff8';
  const color = dark ? '#ecf2fc' : '#142036';
  const rest = motion.matches ? '<style>html body *{animation-duration:0s!important;transition-duration:0s!important}</style>' : '';
  return '<!doctype html><html lang="en"><meta charset="utf-8">' +
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; form-action \'none\'; base-uri \'none\'">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><style>' + css +
    'body{min-height:100svh;margin:0;display:grid;place-items:center;background:' + background +
    ';color:' + color + ';font-family:system-ui,sans-serif;padding:24px;box-sizing:border-box}' +
    '</style><body>' + staticMarkup(code) + rest + '</body></html>';
}

export function trackReducedMotion(listener) {
  motion.addEventListener('change', listener);
}
