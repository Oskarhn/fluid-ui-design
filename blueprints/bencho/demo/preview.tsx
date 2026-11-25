import { useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

import { CardSwap } from '../blocks/card-swap/CardSwap';
import { StackedBars } from '../blocks/stacked-bars/StackedBars';
import { WakeSlider } from '../blocks/wake-slider/WakeSlider';
import { ContextMeter } from '../blocks/context-meter/ContextMeter';
import { AsciiWake } from '../blocks/ascii-wake/AsciiWake';
import { ToastStack } from '../blocks/toast-stack/ToastStack';
import { FoldingBill } from '../blocks/folding-bill/FoldingBill';
import { Counter } from '../blocks/rolling-counter/Counter';
import { Compare } from '../blocks/image-compare/Compare';
import { Particles } from '../blocks/particles/Particles';
import { Accordion } from '../blocks/image-accordion/Accordion';
import { Scrub } from '../blocks/time-scrubber/Scrub';

import '../tokens.css';
import '../blocks/card-swap/CardSwap.css';
import '../blocks/stacked-bars/StackedBars.css';
import '../blocks/wake-slider/WakeSlider.css';
import '../blocks/context-meter/ContextMeter.css';
import '../blocks/ascii-wake/AsciiWake.css';
import '../blocks/toast-stack/ToastStack.css';
import '../blocks/folding-bill/FoldingBill.css';
import '../blocks/rolling-counter/Counter.css';
import '../blocks/image-compare/Compare.css';
import '../blocks/particles/Particles.css';
import '../blocks/image-accordion/Accordion.css';
import '../blocks/time-scrubber/Scrub.css';
import './preview.css';

import contours from '../../../media/loops/tidal-contours.jpg';
import amber from '../../../media/loops/amber-reflection.jpg';
import lattice from '../../../media/loops/oblique-lattice.jpg';

function CardSample() {
  return <CardSwap images={{ mount: contours, bloom: amber, peak: lattice, wings: contours }} />;
}
function CompareSample() {
  return <Compare before={contours} after={contours} monochromeBefore />;
}

const demos: { id: string; title: string; use: string; Component: ComponentType }[] = [
  { id: 'card-swap', title: 'Card swap', use: 'Press or drag the front card. Each card moves to a new slot in the same stack.', Component: CardSample },
  { id: 'stacked-bars', title: 'Stacked bars', use: 'Move along the bars and change the time range. Compare the bar heights and the moving tooltip.', Component: StackedBars },
  { id: 'wake-slider', title: 'Wake slider', use: 'Move the slider across the ticks. The value follows your hand and the nearby ticks trail behind.', Component: WakeSlider },
  { id: 'context-meter', title: 'Context meter', use: 'Explore the segments. Elements keep their identity when a category is emphasized.', Component: ContextMeter },
  { id: 'ascii-wake', title: 'ASCII wake', use: 'Move through the character field or press to send a ripple through it.', Component: AsciiWake },
  { id: 'toast-stack', title: 'Toast stack', use: 'Hover or focus the stack and dismiss a message. Look at how the remaining messages change depth.', Component: ToastStack },
  { id: 'folding-bill', title: 'Folding bill', use: 'Drag the surface and let it go. The material bends locally around your grab point.', Component: FoldingBill },
  { id: 'rolling-counter', title: 'Rolling counter', use: 'Change the value and watch the digits that carry forward.', Component: Counter },
  { id: 'image-compare', title: 'Image compare', use: 'Drag the seam to reveal two treatments of the same frame. The seam and crop share the same curve.', Component: CompareSample },
  { id: 'particles', title: 'Particles', use: 'Move or press inside the field. The individual particles return to a fixed home position.', Component: Particles },
  { id: 'image-accordion', title: 'Image accordion', use: 'Focus or point at a panel. One panel opens while the adjacent panels give it space.', Component: Accordion },
  { id: 'time-scrubber', title: 'Time scrubber', use: 'Drag the marked ruler to inspect a time. The selection marker stays in the same place.', Component: Scrub },
];

function Materials() {
  const [open, setOpen] = useState(false);
  return <div className="material-demo">
    <div className="material-parts" data-open={open} aria-hidden="true">
      <div className="part part-top" /><div className="part part-middle" /><div className="part part-base" />
    </div>
    <button type="button" aria-pressed={open} onClick={() => setOpen(current => !current)}>Separate material layers</button>
    <output>{open ? 'Finish, insulation and backing separated' : 'Three layers assembled'}</output>
  </div>;
}
demos.push({ id: 'material-layers', title: 'Material layers', use: 'An original adaptation. The same slot model that moves cards can expose layers in an assembled object.', Component: Materials });

function App() {
  const [id, setId] = useState(demos.find(demo => '#' + demo.id === location.hash)?.id ?? demos[0].id);
  const demo = demos.find(item => item.id === id) ?? demos[0];
  const Active = demo.Component;
  return <main className="fluid-motion preview">
    <header>
      <a href="#demo" className="skip">Skip to example</a>
      <h1>Motion studies</h1>
      <p>Try the gesture, then use the same mechanism on your own content. Twelve MIT blocks from Bencho and an original layer study.</p>
    </header>
    <div className="lab">
      <nav aria-label="Motion studies">
        {demos.map(item => <button key={item.id} type="button" aria-pressed={item.id === id} onClick={() => {
          history.replaceState(null, '', '#' + item.id);
          setId(item.id);
        }}>{item.title}</button>)}
      </nav>
      <section id="demo" aria-labelledby="demo-title">
        <h2 id="demo-title">{demo.title}</h2>
        <p>{demo.use}</p>
        <div className="motion-stage" data-active={id}><Active key={id} /></div>
      </section>
    </div>
    <footer><a href="https://github.com/cabralorenzo/bencho">Bencho source and MIT license</a></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);
