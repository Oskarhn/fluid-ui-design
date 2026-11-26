const filters = [...document.querySelectorAll('[data-filter]')];
const cells = [...document.querySelectorAll('.study')];
const searchButton = document.querySelector('#open-search');
const searchDialog = document.querySelector('#search-dialog');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const preview = document.querySelector('#preview-dialog');
const cover = document.querySelector('#preview-image');
const video = document.querySelector('#preview-video');
const openVideo = document.querySelector('#open-video');
const play = document.querySelector('#play');
const playStatus = document.querySelector('#play-status');
const clearSearch = document.querySelector('#clear-search');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');
const toolbar = document.querySelector('.toolbar');
let playback = 0;

function currentFilters() {
  const params = new URLSearchParams(location.hash.slice(1));
  const group = params.get('group');
  return {
    group: filters.some(button => button.dataset.filter === group) ? group : 'all',
    query: (params.get('q') ?? '').slice(0, 80).trim()
  };
}

function render() {
  const { group, query } = currentFilters();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const cell of cells) {
    const copy = cell.textContent.toLowerCase();
    const matches = (group === 'all' || cell.dataset.group === group) && terms.every(term => copy.includes(term));
    cell.hidden = !matches;
    visible += Number(matches);
  }
  for (const filter of filters) filter.setAttribute('aria-pressed', String(filter.dataset.filter === group));
  count.textContent = visible + (visible === 1 ? ' loop' : ' loops') + (query ? ' for “' + query + '”' : '');
  clearSearch.hidden = !query;
  empty.hidden = visible !== 0;
}

function apply(group, query) {
  const params = new URLSearchParams();
  if (group !== 'all') params.set('group', group);
  if (query) params.set('q', query);
  const next = params.toString();
  if (location.hash.slice(1) !== next) location.hash = next;
}

if (typeof searchDialog.showModal === 'function') {
  toolbar.removeAttribute('inert');
  render();
  window.addEventListener('hashchange', render);
  for (const filter of filters) {
    filter.addEventListener('click', () => apply(filter.dataset.filter, currentFilters().query));
  }
  clearSearch.addEventListener('click', () => {
    searchButton.focus();
    apply(currentFilters().group, '');
  });

  function openSearch() {
    if (preview.open || searchDialog.open) return;
    searchInput.value = currentFilters().query;
    searchDialog.showModal();
  }

  searchButton.addEventListener('click', openSearch);
  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      if (preview.open || searchDialog.open) return;
      event.preventDefault();
      searchButton.focus();
      openSearch();
    }
  });
  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    apply(currentFilters().group, searchInput.value.trim());
    searchDialog.close();
  });

  function releaseVideo() {
    playback++;
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden = true;
    cover.hidden = false;
    play.disabled = false;
    playStatus.hidden = true;
  }

  for (const cell of cells) {
    const link = cell.querySelector('a');
    const image = link.querySelector('img');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      releaseVideo();
      document.querySelector('#preview-title').textContent = link.querySelector('h2').textContent;
      document.querySelector('#preview-description').textContent = link.querySelector('p').textContent;
      cover.src = image.src;
      video.poster = image.src;
      openVideo.href = link.href;
      preview.showModal();
    });
  }

  play.addEventListener('click', async () => {
    const attempt = ++playback;
    play.disabled = true;
    video.src = openVideo.href;
    video.hidden = false;
    cover.hidden = true;
    try {
      await video.play();
      if (preview.open && playback === attempt) video.focus();
    } catch {
      if (preview.open && playback === attempt) {
        playStatus.textContent = 'The preview could not play. You can open the video file instead.';
        playStatus.hidden = false;
        cover.hidden = false;
        video.hidden = true;
        play.disabled = false;
      }
    }
  });

  preview.addEventListener('close', () => {
    if (!preview.open) releaseVideo();
  });
} else {
  toolbar.hidden = true;
  document.querySelector('.results').hidden = true;
}
