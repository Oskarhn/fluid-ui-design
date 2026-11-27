import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { catalog, components } from './catalog.mjs';
import { serveLibrary } from './test-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const attr = (node, name) => node.getAttribute(name);
const output = root => root.locator('output').first().textContent();
const button = (root, name) => root.getByRole('button', { name, exact: true });
const selected = (root, name) => attr(button(root, name), 'aria-pressed');
const pause = async (page, selector, expected) => {
  await page.waitForFunction(({ selector, expected }) => document.querySelector(selector)?.textContent === expected,
    { selector, expected });
};

const checks = {
  async photoQuestions(page, root) {
    const answers=root.locator('details');
    await answers.nth(0).locator('summary').click();
    assert.equal(await answers.nth(0).getAttribute('open'),'');
    await answers.nth(1).locator('summary').click();
    await page.waitForFunction(()=>[...document.querySelectorAll('#preview details')].filter(el=>el.open).length===1);
    assert.equal(await answers.nth(1).getAttribute('open'),'');
  },
  async mailWorkspace(page, root) {
    await button(root,'Loops').click();
    assert.equal(await output(root),'Loops selected');
    await button(root,'Collapse sidebar').click();
    assert.equal(await button(root,'Expand sidebar').getAttribute('aria-expanded'),'false');
    await button(root,'Expand sidebar').click();
    await button(root,'Emails').click();
    assert.equal(await output(root),'Emails selected');
  },
  async volumeElastic(page, root, entry, width) {
    const slider=root.getByRole('slider',{name:'Volume'});
    await slider.press('End');
    assert.equal(await slider.inputValue(),'100');
    if(width>390){
      const b=await slider.boundingBox();
      await page.mouse.move(b.x+b.width*.6,b.y+b.height*.5);
      await page.mouse.down();
      await page.mouse.move(b.x+b.width*.35,b.y+b.height*.67,{steps:6});
      assert.ok(Number(await slider.inputValue())>20&&Number(await slider.inputValue())<50);
      await page.mouse.up();
    }
  },
  async couponDissolve(page, root) {
    await root.getByRole('button',{name:'MOCHEO 70%',exact:true}).click();
    await pause(page,'#preview output','£40.20');
    await button(root,'Reset').click();
    assert.equal(await output(root),'£134.00');
  },
  async circularDownload(page, root) {
    await button(root,'Start').click();
    await button(root,'Cancel download').click();
    assert.equal(await root.locator('[data-rate]').textContent(),'Cancelled');
    await button(root,'Restart').click();
    await page.waitForFunction(()=>document.querySelector('#preview output')?.textContent==='✓',null,{timeout:9000});
    assert.equal(await root.locator('[data-bytes]').textContent(),'8.7 GB');
    assert.equal(await root.locator('[data-remain]').textContent(),'0:00');
  },
  async caffeineCurve(page, root) {
    await button(root,'13:10').click();
    assert.equal(await output(root),'105 mg · 13:10');
  },
  async creditConsole(page, root) {
    await root.getByRole('radio',{name:'500 credits',exact:true}).check();
    await button(root,'Preview credits').click();
    assert.equal(await output(root),'Preview balance 770 credits');
    await pause(page,'#preview .credit-row strong','770');
  },
  async contextTreemap(page, root) {
    await root.getByRole('button',{name:'Tool instructions'}).click();
    assert.ok((await output(root)).includes('System / Tool instructions'));
    await button(root,'Reset view').click();
    assert.equal(await output(root),'Select a context block');
  },
  async agentTimeline(page, root) {
    await root.getByText('Compare validators',{exact:true}).click();
    assert.equal(await root.locator('details').first().getAttribute('open'),'');
    await button(root,'Run sample').click();
    await pause(page,'#preview output','Sample complete');
  },
  async connectionFlow(page, root) {
    await button(root,'Send a pulse').click();
    await pause(page,'#preview output','Pulse arrived at Preview');
    assert.equal(await root.getByRole('button',{name:/^Preview/}).getAttribute('aria-pressed'),'true');
  },
  async glassLens(page, root) {
    await root.locator('canvas').press('ArrowLeft');
    await button(root,'Refraction').click();
    assert.equal(await output(root),'Flat board');
    await button(root,'Refraction').click();
    assert.equal(await output(root),'Refraction active');
  },
  async movingIconCopy(page, root) {
    await button(root,'Symbol C').click();
    await pause(page,'#preview output','Symbol copied');
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'◎');
  },
  async standingSkyline(page, root) {
    await button(root,'Skyline').click();
    assert.equal(await output(root),'Activity skyline');
    await button(root,'The book').click();
    assert.equal(await output(root),'Calendar grid');
  },
  async tripCards(page, root) {
    const flight=root.getByRole('button',{name:/Flight/});
    await flight.click();
    assert.equal(await flight.getAttribute('aria-expanded'),'true');
    assert.match(await root.locator('.trip-sheet').textContent(),/Direct/);
    await page.keyboard.press('Escape');
    assert.equal(await flight.getAttribute('aria-expanded'),'false');
  },
  async routeCommute(page, root) {
    await root.getByRole('button',{name:/Walk/}).click();
    assert.equal(await output(root),'49');
    assert.equal(await root.locator('[data-arrival]').textContent(),'9:29 AM');
  },
  async studioCopier(page, root) {
    await button(root,'Place workshop ticket').click();
    assert.equal(await output(root),'READY');
    await button(root,'Make copy').click();
    await pause(page,'#preview output','COPY READY');
    assert.ok(await root.locator('.printer-page').isVisible());
    await button(root,'Reset').click();
    assert.ok(await button(root,'Make copy').isDisabled());
  },
  async logoBuild(page, root) {
    await button(root,'Play intro').click();
    await pause(page,'#preview output','Studio ready');
    assert.ok(await root.locator('.brand-arrival').isVisible());
  },
  async colorPass(page, root) {
    await button(root,'Start color pass').click();
    await pause(page,'#preview output','Color restored');
    assert.equal(await root.locator('[data-color]').count(),3);
  },
  async collapseIcon(page, root, entry, width) {
    const track = root.getByRole('slider', { name: 'Drag sidebar horizontally' });
    await track.click();
    assert.equal(await attr(track, 'aria-valuenow'), '0');
    const box = await track.boundingBox();
    const y = box.y + Math.min(30, box.height / 2);
    const position = fraction => box.x + box.width * fraction;
    const intermediate = async () => {
      const value = Number(await attr(track, 'aria-valuenow'));
      assert.ok(value > 15 && value < 60);
    };
    if (width === 390) {
      const session = await page.context().newCDPSession(page);
      const dispatch = (type, fraction) => session.send('Input.dispatchTouchEvent', {
        type, touchPoints: fraction === undefined ? [] : [{x:position(fraction),y}]
      });
      try {
        await dispatch('touchStart',.16);
        await dispatch('touchMove',.39);
        await intermediate();
        await dispatch('touchMove',.87);
        await dispatch('touchEnd');
      } finally { await session.detach(); }
    } else {
      await page.mouse.move(position(.16), y);
      await page.mouse.down();
      await page.mouse.move(position(.39), y, { steps: 7 });
      await intermediate();
      await page.mouse.move(position(.87), y, { steps: 8 });
      await page.mouse.up();
    }
    await page.waitForFunction(() => document.querySelector('.swipe-track').getAttribute('aria-valuenow') === '100');
    await track.press('Escape');
    await page.waitForFunction(() => document.querySelector('.swipe-track').getAttribute('aria-valuenow') === '0');
  },
  async quickActions(page, root) {
    await button(root, 'Quick actions').click();
    assert.equal(await attr(button(root, 'Quick actions'), 'aria-expanded'), 'true');
    await root.getByRole('button', { name: 'New invoice' }).click();
    assert.equal(await root.locator('[role=status]').textContent(), 'New invoice');
  },
  async conversionFunnel(page, root) {
    assert.equal(await output(root), '46.8%');
    await root.getByRole('tab', { name:'Telehealth' }).click();
    assert.equal(await output(root), '44.2%');
    assert.equal(await root.locator('.funnel-readings strong').last().textContent(), '993');
  },
  async burnMeter(page, root) {
    await button(root, 'Walk').click();
    assert.equal(await selected(root, 'Walk'), 'true');
    await button(root, 'Pause').click();
    assert.equal(await attr(root.locator('canvas'), 'data-paused'), '');
    await button(root, 'Resume').click();
    assert.equal(await attr(root.locator('canvas'), 'data-paused'), null);
  },
  async fileDrawer(page, root) {
    await button(root, 'Open archive').click();
    await page.waitForFunction(() => Number(document.querySelector('.archive-stage').style.getPropertyValue('--archive-travel')) > .96);
    for (const name of ['Index','Nord Festival','Mono Press','Field Notes','Archive']) {
      const tab = button(root, name);
      assert.ok(await tab.evaluate(el=>{const b=el.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===el;}), 'Unreachable '+name);
    }
    await button(root, 'Mono Press').click();
    assert.equal(await root.locator('[role=status]').textContent(), 'Mono Press lifted');
    await page.keyboard.press('Escape');
    assert.ok(!await button(root, 'Return to drawer').isVisible());
    await button(root, 'Close archive').click();
    assert.equal(await attr(button(root, 'Open archive'), 'aria-expanded'), 'false');
  },
  async taskChecks(page, root) {
    await root.getByRole('checkbox').first().check();
    assert.equal(await output(root), '1 of 4 complete');
    await button(root, 'Clear checkmarks').click();
    assert.equal(await output(root), '0 of 4 complete');
  },
  async floatingNav(page, root) {
    const toggle = root.locator('.nav-toggle');
    await toggle.click();
    assert.equal(await attr(toggle, 'aria-expanded'), 'true');
    await button(root, 'Dark').click();
    await button(root, 'Projects').click();
    assert.equal(await output(root), 'Projects');
    assert.equal(await attr(toggle, 'aria-expanded'), 'false');
    assert.equal(await selected(root, 'Light'), 'true');
  },
  async toolFolders(page, root) {
    await button(root, 'Media').click();
    assert.equal(await attr(button(root, 'Media'), 'aria-expanded'), 'true');
    await button(root, 'Crop').click();
    assert.equal(await output(root), 'Crop selected');
    await page.keyboard.press('Escape');
    assert.equal(await attr(button(root, 'Media'), 'aria-expanded'), 'false');
  },
  async stackingLoader(page, root) {
    await button(root, 'Prepare files').click();
    assert.equal(await attr(root.locator('.stacking-scene'), 'aria-busy'), 'true');
    await button(root, 'Cancel').click();
    assert.equal(await output(root), 'Preparation cancelled');
    await button(root, 'Prepare files').click();
    await pause(page, '#preview output', 'Files prepared');
  },
  async featureCards(page, root) {
    await button(root, 'Productive days').press('ArrowRight');
    assert.equal(await selected(root, 'Spending patterns'), 'true');
    await button(root, 'Busiest hours').click();
    assert.equal(await selected(root, 'Busiest hours'), 'true');
  },
  async copyConfirmation(page, root) {
    await root.locator('button').click();
    await pause(page, '#preview [role=status]', 'Reference ID copied');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'con_ij4wyajc4wl9r1x6');
  },
  async notificationStack(page, root) {
    await button(root, 'Dismiss Your proofs arrived').click();
    await pause(page, '#preview [role=status]', 'Workshop moved indoors');
    await button(root, 'Reset stack').click();
    assert.equal(await root.locator('[role=status]').textContent(), 'Your proofs arrived');
  },
  async editorPalette(page, root) {
    await button(root, 'Edit').click();
    await button(root, 'Crop').click();
    assert.equal(await attr(root.locator('.editor-canvas'), 'data-crop'), 'true');
    await button(root, 'Undo').click();
    assert.equal(await attr(root.locator('.editor-canvas'), 'data-crop'), 'false');
  },
  async layeredSteps(page, root) {
    await button(root, 'Continue').click();
    assert.equal(await root.locator('h3').textContent(), 'Set your preferences');
    await button(root, 'Back').click();
    assert.equal(await root.locator('h3').textContent(), 'Connect a workspace');
  },
  async validationCode(page, root) {
    const input = root.getByRole('textbox');
    await input.fill('000000');
    await button(root, 'Validate').click();
    assert.equal(await attr(input, 'aria-invalid'), 'true');
    await input.fill('374-918');
    assert.equal(await input.inputValue(), '374918');
    await button(root, 'Validate').click();
    assert.equal(await root.locator('[role=status]').textContent(), 'Code verified');
    await button(root, 'Reset').click();
    await page.waitForFunction(() => document.querySelector('#preview input').value === '');
  },
  async stageExplorer(page, root, entry, width) {
    if (entry.options.intro) await button(root, 'Skip intro').click();
    const tabs = root.getByRole('tab');
    await tabs.first().press('ArrowRight');
    assert.equal(await attr(tabs.nth(1), 'aria-selected'), 'true');
    assert.equal(await root.getByRole('tabpanel').locator('h3').textContent(), entry.options.stages[1][0]);
    const selectedOptions = entry.options.stageChoices?.[1];
    if (selectedOptions?.length) {
      const [label, enabled] = selectedOptions[0];
      const control = root.getByRole('checkbox', { name: label });
      assert.equal(await control.isChecked(), enabled);
      await control.click();
      assert.equal(await control.isChecked(), !enabled);
    }
    if (entry.options.scroll && width > 390) {
      const scroller = root.getByRole('tabpanel').locator('.stage-scroller');
      await scroller.hover();
      await page.mouse.wheel(0, 110);
      await page.waitForFunction(() => [...document.querySelectorAll('#preview .stage-scroller')].some(el => el.scrollTop > 0));
    }
  },
  async mediaIndex(page, root, entry) {
    const choices = root.locator('.media-choices button');
    await choices.nth(1).click();
    assert.equal(await root.locator('.media-caption').textContent(), entry.options.items[1]);
    await button(root, 'Play preview').click();
    await page.waitForFunction(() => {
      const video = document.querySelector('#preview video');
      return video && !video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    });
    await button(root, 'Pause preview').click();
    assert.ok(await root.locator('video').evaluate(video => video.paused));
  },
  async billingSwitch(page, root) {
    await root.getByRole('radio', { name: 'One-time setup' }).check();
    assert.match(await root.locator('.bill-detail').textContent(), /handoff/);
    await root.getByRole('radio', { name: 'Monthly service' }).check();
    assert.match(await root.locator('.bill-detail').textContent(), /Ongoing support/);
  },
  async ingredientCard(page, root) {
    await button(root, 'Ingredients').click();
    assert.equal(await attr(button(root, 'Ingredients'), 'aria-expanded'), 'true');
    assert.match(await root.locator('.ingredient-grid').textContent(), /Grilled patty/);
    await button(root, 'Ingredients').click();
    assert.equal(await attr(button(root, 'Ingredients'), 'aria-expanded'), 'false');
  },
  async fontSpecimen(page, root) {
    await root.getByRole('combobox').selectOption('Sans');
    assert.match(await root.locator('.specimen-preview').evaluate(el => getComputedStyle(el).fontFamily), /system-ui/);
    await root.getByRole('slider').press('ArrowRight');
    assert.equal(await output(root), '460');
    await button(root, 'Reading contrast').click();
    assert.equal(await selected(root, 'Reading contrast'), 'true');
  },
  async profileDeck(page, root, entry) {
    const next = entry.options.names[1];
    await root.locator('.profile-actions button').nth(1).click();
    assert.equal(await output(root), next + ' selected');
    assert.equal(await attr(root.locator('.profile-slot').nth(1), 'data-place'), '0');
  },
  async catalogSearch(page, root, entry) {
    await root.getByRole('searchbox').fill('test-catalog-no-match');
    assert.equal(await root.locator('.results-status').textContent(), 'No matches');
    await button(root, 'Clear').click();
    await root.locator('.filter-buttons button').nth(1).click();
    assert.equal(await root.locator('.search-results li').count(),
      entry.options.items.filter(item => item[1] === entry.options.items[0][1]).length);
    await root.locator('.search-results button').first().click();
    assert.ok(await root.getByRole('dialog').isVisible());
    await button(root, 'Close preview').click();
    assert.ok(!await root.getByRole('dialog').isVisible());
  },
  async motionSurface(page, root) {
    const screen = root.locator('.motion-screen');
    await button(root, 'Center reveal').click();
    assert.equal(await screen.evaluate(el => el.style.getPropertyValue('--spot-x')), '50%');
    await button(root, 'Pause motion').click();
    assert.equal(await selected(root, 'Resume motion'), 'true');
  },
  async lightSwitch(page, root, entry, width) {
    const trigger = button(root, 'Toggle lights');
    if (width > 390) {
      await trigger.hover();
      assert.equal(await attr(trigger, 'data-spinning'), '');
    }
    await trigger.click();
    assert.equal(await output(root), 'Lights dimmed');
    if (width > 390) {
      const duration = await root.locator('.lights-plane').evaluate(el => el.getAnimations()[0]?.effect.getTiming().duration);
      assert.equal(duration, 12000);
    }
    await trigger.click();
    assert.equal(await output(root), 'Daylight restored');
  },
  async journeyModes(page, root) {
    await button(root, 'Walk').click();
    assert.equal(await output(root), 'Walk · 42 min');
    assert.equal(await selected(root, 'Walk'), 'true');
  },
  async desktopCopier(page, root, entry, width) {
    const card = button(root, 'Place workshop ticket');
    if (width > 390) {
      const start = await card.boundingBox();
      const finish = await root.locator('.copier-bed').boundingBox();
      await page.mouse.move(start.x+start.width/2,start.y+start.height/2);
      await page.mouse.down();
      await page.mouse.move(finish.x+finish.width/2,finish.y+finish.height/2,{steps:12});
      await page.mouse.up();
    } else await card.tap();
    assert.equal(await output(root), 'Ready');
    await button(root, 'Make copy').click();
    await pause(page, '#preview output', 'Copy ready');
    assert.ok(await root.locator('.copier-output').isVisible());
    await button(root, 'Reset').click();
    assert.ok(await button(root, 'Make copy').isDisabled());
  },
  async downloadProgress(page, root) {
    await button(root, 'Start').click();
    await button(root, 'Cancel').click();
    assert.equal(await output(root), 'Cancelled');
    await button(root, 'Start').click();
    await pause(page, '#preview output', 'Finished');
    assert.equal(await root.locator('progress').evaluate(el => el.value), 100);
  },
  async metricPlot(page, root, entry) {
    await root.getByRole('slider').press('End');
    assert.equal(await output(root), entry.options.values.at(-1) + ' ' + entry.options.unit);
  },
  async connectedList(page, root, entry) {
    await root.locator('.connection-buttons button').nth(1).click();
    assert.deepEqual(await root.locator('.connection-list li').allTextContents(), Object.values(entry.options.nodes)[1]);
  },
  async flipCalendar(page, root) {
    await button(root, 'Next day').click();
    assert.equal(await output(root), '28');
    await button(root, 'Previous day').click();
    assert.equal(await output(root), '27');
  },
  async deviceShowcase(page, root) {
    await button(root, 'Inside').click();
    assert.equal(await output(root), 'Inside selected');
    await button(root, 'Final look').click();
    assert.equal(await attr(root.locator('.device-model'), 'data-view'), '3');
  },
  async canvasLogin(page, root) {
    await button(root, 'Preview entry animation').click();
    assert.equal(await output(root), 'Enter a demo name');
    await root.getByRole('textbox').fill('Sam');
    await button(root, 'Preview entry animation').click();
    assert.equal(await output(root), 'Preview ready for Sam');
  },
  async videoHero(page, root) {
    await button(root, 'Play background').click();
    await page.waitForFunction(() => {
      const video = document.querySelector('#preview video');
      return video && !video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    });
    await button(root, 'Pause background').click();
    assert.ok(await root.locator('video').evaluate(video => video.paused));
  },
  async unmaskTrail(page, root, entry, width) {
    const alpha = () => page.waitForFunction(() => {
      const canvas = document.querySelector('#preview canvas');
      return canvas?.getContext('2d').getImageData(canvas.width >> 1, canvas.height >> 1, 1, 1).data[3] < 16;
    });
    if (width > 390) {
      await root.locator('.trail-surface').hover();
      await alpha();
    }
    await button(root, 'Reveal sample').click();
    assert.equal(await selected(root, 'Reveal sample'), 'true');
    await alpha();
    await button(root, 'Clear trail').click();
    assert.equal(await selected(root, 'Reveal sample'), 'false');
  },
  async glassTransfer(page, root, entry, width) {
    const frame = root.locator('.facet-view');
    if (width > 390) {
      await page.waitForFunction(() => document.querySelector('.facet-stage')?.dataset.renderer === 'webgl', null, { timeout:12000 });
      await frame.hover({ position: { x: 35, y: 30 } });
      await root.locator('.facet-stage').hover();
      await page.waitForFunction(() => Number(document.querySelector('.facet-stage')?.dataset.focus) >= 0);
    }
    async function clickOnLabel(name) {
      const label = button(root,name);
      await label.waitFor();
      if(width===390){await label.click(); return;}
      let bounds=await label.boundingBox();
      await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
      await page.waitForTimeout(195);
      bounds=await label.boundingBox();
      const target=await label.evaluate(element=>{
        const rect=element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2));
      });
      assert.ok(target,'Hit region did not cover '+name);
      await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    }
    async function returnToHero(){
      await button(root,'Back').click();
      await page.waitForFunction(()=>document.querySelector('.facet-stage')?.dataset.phase==='hero');
    }
    await clickOnLabel('Read paper');
    await root.getByRole('heading', { name: 'Real-time glass, in five terms.' }).waitFor();
    assert.equal(await frame.evaluate(el => el.inert), true);
    await returnToHero();
    assert.ok(await frame.isVisible());
    assert.match(await page.evaluate(() => document.activeElement.textContent), /Read paper/);
    await clickOnLabel('Open studio');
    await root.getByRole('heading',{name:'Material studio',exact:true}).waitFor();
    await returnToHero();
    await clickOnLabel('Sign in');
    await root.getByRole('textbox',{name:'Display name'}).fill('Test viewer');
    await button(root,'Enter studio').click();
    await root.getByRole('heading',{name:'Studio workspace'}).waitFor();
    await returnToHero();
  }
};

async function verifyCraft(page, origin) {
  await page.goto(origin + '/blueprints/interaction-controls/index.html');
  const id = name => page.locator('#' + name);
  await id('switch-tab-0').press('ArrowRight');
  assert.equal(await attr(id('switch-tab-1'), 'aria-selected'), 'true');
  await id('password').fill('LocalTest2');
  assert.equal(await page.locator('#rules [data-met]').count(), 3);
  await id('increase').click();
  assert.equal(await id('duration').inputValue(), '105');
  await page.locator('[data-toggle-wave]').click();
  assert.ok(await page.locator('.wave').isVisible());
  await page.locator('[data-toggle-wave]').click();
  assert.ok(!await page.locator('.wave').isVisible());
  await id('record').click();
  await page.waitForFunction(() => parseFloat(document.querySelector('#elapsed').value) >= .15);
  await id('record').click();
  await id('process').click();
  await id('cancel-process').click();
  assert.match(await id('process-status').textContent(), /cancelled/);
  await id('pnpm-tab').click();
  await id('copy').click();
  await pause(page, '#copy-status', 'Command copied');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'pnpm add loading-dev');
  await page.getByRole('radio', { name: 'This week' }).check();
  assert.equal(await id('selected-range').textContent(), 'Showing this week');
  await id('otp').fill('1 2x34 56');
  assert.equal(await id('otp').inputValue(), '123456');
  await page.getByRole('tab', { name: 'Source', exact: true }).click();
  assert.ok(await id('wobble-panel-2').isVisible());
  await page.getByRole('button', { name: 'Move Scene down' }).click();
  assert.deepEqual(await page.locator('#reorder li span').allTextContents(), ['Sound', 'Scene', 'Export']);
}

const selection = new Set(process.argv.slice(2));
const cases = selection.size ? catalog.filter(entry => selection.has(entry.id)) : catalog;
assert.ok(cases.length);
assert.equal(new Set(catalog.map(entry => entry.id)).size, catalog.length, 'Duplicate catalog IDs');
for (const entry of catalog) assert.ok(components[entry.component] && checks[entry.component], entry.id);

const host = await serveLibrary();
const browser = await chromium.launch({ channel: 'chrome', headless: true, args:['--enable-unsafe-swiftshader'] });
try {
  const failed = [];
  const completed = [];
  for (const width of [1280, 390]) {
    const mobile = width === 390;
    const ctx = await browser.newContext({ viewport: { width, height: 870 }, isMobile: mobile, hasTouch: mobile,
      reducedMotion: mobile ? 'reduce' : 'no-preference', permissions: ['clipboard-read', 'clipboard-write'] });
    await ctx.route('**/*', route => route.request().url().startsWith(host.origin + '/') ? route.continue() : route.abort());
    const page = await ctx.newPage();
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('THREE.WebGLProgram')) errors.push(message.text());
    });
    await page.goto(host.url);
    for (const entry of cases) {
      try {
        const root = page.locator('#preview[data-reference="' + entry.id + '"]');
        await page.goto(host.url + '#' + entry.id);
        await root.waitFor({ timeout: 4000 });
        await root.scrollIntoViewIfNeeded();
        await checks[entry.component](page, root, entry, width);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 1, 'Horizontal overflow: ' + overflow + ' px');
        completed.push({id:entry.id,width});
      } catch (error) {
        failed.push({ id: entry.id, width, reason: error.message.split('\n')[0] });
        await page.goto(host.url);
      }
    }
    if (!selection.size) {
      await verifyCraft(page, host.origin);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    }
    for (const reason of errors) failed.push({ width, reason });
    await ctx.close();
  }
  console.log(JSON.stringify({ entries: cases.length, componentFamilies: new Set(cases.map(e => e.component)).size,
    viewportChecks: completed.length, existingCraftControls: selection.size ? 0 : 11, failed }, null, 2));
  assert.deepEqual(failed, []);
} finally {
  await browser.close();
  await host.close();
}
