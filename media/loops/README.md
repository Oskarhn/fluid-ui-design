# Original background loops

Three six-second loops, authored as Canvas 2D geometry and exported as 960 × 540 H.264 video at 24 fps. They have no audio. The [interactive source](../../blueprints/procedural-backgrounds.html) includes a reduced-motion state and works without a CDN. The source, exports and posters are original assets distributed with this repository under its [MIT License](../../LICENSE).

| Background | Video | First-frame poster | Placement |
| --- | --- | --- | --- |
| Tidal contours | [MP4](tidal-contours.mp4) | [JPG](tidal-contours.jpg) | Dark green line work for field equipment and technical pages |
| Amber reflection | [MP4](amber-reflection.mp4) | [JPG](amber-reflection.jpg) | Warm side lighting for product detail and material texture |
| Oblique lattice | [MP4](oblique-lattice.mp4) | [JPG](oblique-lattice.jpg) | Moving violet-gray grid for technical or editorial work |

Use a poster first and keep text on the darker side. Check contrast on the visible crop before adding text. For mobile background media, adjust the object position so the lightest part stays clear of the heading and main action. Show a still for reduced motion and offer a pause control for persistent playback.

```html
<video aria-hidden="true" muted loop playsinline preload="none"
  poster="tidal-contours.jpg" src="tidal-contours.mp4"></video>
```
