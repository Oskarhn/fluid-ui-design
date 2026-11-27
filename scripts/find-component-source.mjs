import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { source: { type: 'string' }, id: { type: 'string' }, limit: { type: 'string', default: '8' }, code: { type: 'boolean' } }
});
const kits = ['uiverse', 'forgeui', 'uilora'];
const sources = values.source ? [values.source] : kits;
if (sources.some(source => !kits.includes(source)) || (values.code && !values.id)) {
  throw Error('Choose uiverse, forgeui or uilora for --source. Use --id for --code.');
}
const root = new URL('../blueprints/component-sources/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const rows = (await Promise.all(sources.map(async source =>
  (await read('catalogs/' + source + '.json')).entries.map(entry => ({ ...entry, source }))
))).flat();

const needle = positionals.join(' ').trim().toLowerCase();
const terms = needle.split(/\s+/).filter(Boolean);
const limit = Number(values.limit);
if (!Number.isInteger(limit) || limit < 1 || limit > 40) throw Error('Choose a result limit between 1 and 40.');

const matches = values.id ? rows.filter(entry => entry.id === values.id)
  : rows.map(entry => {
    const title = entry.title.toLowerCase();
    const text = [title, entry.category, entry.author, entry.format, ...entry.tags].join(' ').toLowerCase();
    return { entry, searchRank: terms.every(term => text.includes(term))
      ? Number(Boolean(entry.bundle)) + 3 * terms.filter(term => title.includes(term)).length : -1 };
  }).filter(item => item.searchRank >= 0)
    .sort((a, b) => b.searchRank - a.searchRank)
    .slice(0, limit).map(item => item.entry);

if (!values.code || !matches.length) {
  console.log(JSON.stringify(matches, null, 2));
} else {
  const [entry] = matches;
  let files;
  if (entry.bundle && /^(?:uiverse\/\d{2,3}|private-source\/(?:uilora|forgeui)\/[\w.-]+)\.json$/.test(entry.bundle)) {
    try {
      const data = await read(entry.bundle);
      files = entry.source === 'uiverse' ? [{ path: entry.filename, content: data[entry.key] }] : data.files;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  console.log(JSON.stringify({ ...entry, files }, null, 2));
}
