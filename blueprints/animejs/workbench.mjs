import {
  animate, createAnimatable, createDraggable, createLayout, createScope,
  createTimeline, onScroll, splitText, spring, stagger, svg, utils, waapi
} from './vendor/anime.esm.min.js';

export function mountWorkbench(root) {
  const find = selector => root.querySelector(selector);
  const scope = createScope({
    root,
    mediaQueries: { reduced: '(prefers-reduced-motion: reduce)' }
  });
  scope.add(({ matches }) => {
    const { reduced } = matches;
    const lifetime = new AbortController();
    const { signal } = lifetime;
    const listen = (node, event, handler) => node.addEventListener(event, handler, { signal });

    const scrub = find('[data-scrub]');
    const play = find('[data-play]');
    const time = find('[data-time]');
    const sequenceStatus = find('[data-timeline-status]');
    const waypoints = root.querySelectorAll('[data-waypoint]');
    function showTime(progress) {
      const percent = Math.round(utils.clamp(progress, 0, 1) * 100);
      scrub.value = percent;
      time.textContent = percent + '%';
    }

    const sequence = createTimeline({
      autoplay: false,
      onUpdate(self) { showTime(self.reversed ? 1 - self.progress : self.progress); },
      onComplete(self) {
        play.textContent = 'Play';
        sequenceStatus.textContent = self.reversed ? 'At start' : 'Route complete';
      }
    })
      .label('draw route', 0)
      .add(svg.createDrawable(find('[data-ink]')), { draw: ['0 0', '0 1'], duration: 1350, ease: 'linear' }, 'draw route')
      .label('waypoints', 280)
      .add(waypoints, { opacity: [.25, 1], scale: [.65, 1], delay: stagger(225), duration: 330, ease: 'out(3)' }, 'waypoints');

    function seek(progress) {
      sequence.pause().seek(sequence.duration * (sequence.reversed ? 1 - progress : progress), true);
      showTime(progress);
      play.textContent = 'Play';
    }
    seek(reduced ? 1 : 0);
    sequenceStatus.textContent = reduced ? 'Route complete' : 'Ready';
    listen(scrub, 'input', () => {
      seek(Number(scrub.value) / 100);
      sequenceStatus.textContent = 'Paused';
    });
    listen(play, 'click', () => {
      if (reduced) {
        seek(1);
        sequenceStatus.textContent = 'Route complete';
      } else if (sequence.paused) {
        if (Number(scrub.value) === 100) seek(0);
        play.textContent = 'Pause';
        sequenceStatus.textContent = 'Playing';
        sequence.play();
      } else {
        sequence.pause();
        play.textContent = 'Play';
        sequenceStatus.textContent = 'Paused';
      }
    });
    listen(find('[data-reverse]'), 'click', () => {
      if (reduced) {
        seek(0);
        sequenceStatus.textContent = 'At start';
        return;
      }
      if (Number(scrub.value) === 0) seek(1);
      play.textContent = 'Pause';
      sequenceStatus.textContent = 'Reversing';
      sequence.reverse();
    });

    const rail = find('[data-rail]');
    const knob = find('[data-weight-knob]');
    const range = find('[data-weight]');
    const weight = find('[data-weight-label]');
    const step = () => Math.max(1, rail.clientWidth - knob.offsetWidth) / 4;
    function showWeight(pos) {
      range.value = utils.clamp(Math.round(pos / step()), 0, 4);
      weight.textContent = range.value + ' / 4';
    }
    const draggable = createDraggable(knob, {
      container: rail,
      y: false,
      x: { snap: step },
      releaseMass: 1,
      releaseStiffness: 210,
      releaseDamping: 26,
      velocityMultiplier: reduced ? 0 : .45,
      onUpdate(self) { showWeight(self.x); },
      onAfterResize(self) { self.setX(Number(range.value) * step(), true); }
    });
    draggable.setX(Number(range.value) * step());
    listen(range, 'input', () => {
      const pos = Number(range.value) * step();
      draggable.stop().setX(pos);
      showWeight(pos);
    });

    const tiles = find('[data-tiles]');
    const layoutStatus = find('[data-layout-status]');
    const layout = createLayout(tiles, { children: '[data-tile]' });
    listen(find('[data-reorder]'), 'click', () => {
      const reorder = () => tiles.append(tiles.firstElementChild);
      if (reduced) reorder();
      else layout.update(reorder, { duration: 520, ease: 'out(3)' });
      layoutStatus.textContent = 'Lead piece: ' + tiles.firstElementChild.textContent;
    });

    const scroller = find('[data-scroller]');
    const scrollIndicator = find('[data-scroll-indicator]');
    const scrollProgress = find('[data-scroll-progress]');
    const track = scrollIndicator.parentElement;
    const chapters = find('[data-chapters]');
    function realScrollProgress() {
      return utils.clamp(scroller.scrollTop / Math.max(1, scroller.scrollHeight - scroller.clientHeight), 0, 1);
    }
    function paintScroll(observer) {
      const position = realScrollProgress();
      scrollProgress.textContent = Math.round(position * 100) + '%';
      if (reduced) return;
      // The native reading remains definitive at both boundaries, including keyboard jumps.
      const fraction = position === 0 || position === 1 ? position : (observer?.progress ?? position);
      scrollIndicator.style.translate = '0 ' + (fraction * (track.clientHeight - scrollIndicator.offsetHeight)) + 'px';
    }
    onScroll({
      container: scroller,
      target: chapters,
      enter: 'top top',
      leave: 'bottom bottom',
      onUpdate: paintScroll
    });
    listen(scroller, 'scroll', () => {
      const position = realScrollProgress();
      if (position === 0 || position === 1) paintScroll();
      else scrollProgress.textContent = Math.round(position * 100) + '%';
    });
    paintScroll();

    const phrase = find('[data-phrase]');
    const typeStatus = find('[data-type-status]');
    let split;
    let textMotion;
    function resetType() {
      textMotion?.revert();
      split?.revert();
      textMotion = split = undefined;
    }
    listen(find('[data-type]'), 'click', () => {
      resetType();
      if (reduced) {
        typeStatus.textContent = 'Words visible';
        return;
      }
      // Create the splitter and tween inside the same scope as the mounted DOM.
      scope.execute(() => {
        split = splitText(phrase, { lines: false, words: true, chars: false, accessible: true });
        typeStatus.textContent = 'Animating';
        textMotion = animate(split.words, {
          y: [35, 0],
          opacity: [.15, 1],
          delay: stagger(95),
          duration: 480,
          ease: 'out(3)',
          onComplete() {
            typeStatus.textContent = 'Words visible';
            split?.revert();
            split = undefined;
          }
        });
      });
    });

    const dot = find('[data-follower]');
    const field = find('[data-field]');
    const ring = find('[data-ring]');
    const pulseStatus = find('[data-pulse-status]');
    const follower = reduced ? null : createAnimatable(dot, {
      x: 280, y: 280, ease: spring({ stiffness: 220, damping: 27 })
    });
    let pulse;
    let offset = 0;
    function move(x, y) {
      offset = x;
      if (follower) follower.x(x).y(y);
      else dot.style.translate = x + 'px ' + y + 'px';
    }
    listen(field, 'pointermove', event => {
      if (event.pointerType === 'touch') return;
      const box = field.getBoundingClientRect();
      const boundX = Math.max(0, box.width / 2 - 33);
      const boundY = Math.max(0, box.height / 2 - 32);
      move(
        utils.clamp(event.clientX - box.left - box.width / 2, -boundX, boundX),
        utils.clamp(event.clientY - box.top - box.height / 2, -boundY, boundY)
      );
    });
    listen(field, 'pointerleave', () => move(0, 0));
    for (const button of root.querySelectorAll('[data-nudge]')) {
      listen(button, 'click', () => {
        const limit = Math.max(0, field.clientWidth / 2 - 33);
        move(utils.clamp(offset + Number(button.dataset.nudge) * 32, -limit, limit), 0);
      });
    }
    listen(find('[data-pulse]'), 'click', () => {
      pulse?.revert();
      if (reduced) {
        ring.toggleAttribute('data-static');
        pulseStatus.textContent = ring.hasAttribute('data-static') ? 'Ring shown' : 'Ring hidden';
        return;
      }
      pulseStatus.textContent = 'Pulsing';
      scope.execute(() => {
        pulse = waapi.animate(ring, {
          opacity: [.85, 0],
          scale: [.65, 1.55],
          duration: 550,
          ease: 'out(3)',
          onComplete() { pulseStatus.textContent = 'Pulse complete'; }
        });
      });
    });

    return () => {
      lifetime.abort();
      dot.style.removeProperty('translate');
      scrollIndicator.style.removeProperty('translate');
      ring.removeAttribute('data-static');
    };
  });
  return () => scope.revert();
}

const workbench = document.querySelector('#workbench');
if (workbench) {
  const dispose = mountWorkbench(workbench);
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
}
