# Licensed interaction packs

These are local copies of upstream releases or source. Keep the license and attribution with a copy. Select one component for the job, then verify the version, platform, and dependencies of the receiving project.

| Pack | What is included | How to use it |
| --- | --- | --- |
| [Loading](https://loading.dev/) | [Loading 0.3.8](loading-dev/) includes the published npm archive and the readable source for all 36 spinner variants at [308b2a0](https://github.com/jakubkrehel/loading/tree/308b2a03859053ff8365f474a1da58ca64bba482). [MIT](loading-dev/LICENSE.md) | Install the local `loading-dev-0.3.8.tgz`, or read `src/index.ts` and copy a selected variant with its support files. Label indeterminate work and stop decorative motion when it no longer communicates status. |
| [PanelUI for web](https://panelui.dev/docs/web) | Complete official `panelui-web-0.19.0.tgz` at npm gitHead `ac78fcb7d82255aa6c1d39133aee7f9ae7a1beab`. [MIT](panelui/LICENSE) | Install the archive in compatible React and Tailwind CSS 4 projects. Follow the chosen component's upstream guide and wire its theme tokens. |
| [PanelUI for Expo](https://panelui.dev/) | Complete official `panelui-native-1.5.0.tgz` at npm gitHead `72d735114411b84fd18484311077aabe7cbc3521`. [MIT](panelui/LICENSE) | Install the archive in a compatible Expo app. Use the native APIs, Reanimated, and the matching theme setup for the chosen component. Test on the target device. |
| [Unfold](https://github.com/Dksie09/unfold) | Complete source and upstream motion examples at [7b6cea4](https://github.com/Dksie09/unfold/tree/7b6cea4375a1419826ee3e15fdd924669969c00f). [MIT](unfold/LICENSE) | Start with the fold math, state progression, and input handlers. Adapt its rooms and writing controls to the brief. |
| [Liquid Taffy](https://github.com/arknow91/liquid-taffy) | Complete source at [4bcf400](https://github.com/arknow91/liquid-taffy/tree/4bcf4005f857c371bf53d60b2cee14abcecedf6a). [MIT](liquid-taffy/LICENSE) | Study the shared goo filter, spring, and grab gesture. Use the receiving project's own marks and menu content. See the upstream notice about the example's PlayStation references. |

Build each upstream project from its own package manifest. Treat compiled npm archives as reference packages with executable JavaScript and declarations. Install only the package the receiving project uses. Read [the web implementation guide](../../references/web-platform.md) before choosing a browser API or additional runtime, and [motion composition](../../references/motion-composition.md) for adapting a gesture or transition.

The browser check mounted all 36 Loading variants and exercised a PanelUI web button. Unfold and Liquid Taffy built and opened their respective book and shape menu in Chrome. The PanelUI native archive is included for use with Expo on the receiving project.
