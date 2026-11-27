
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {serveLibrary} from '../reference-components/test-server.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const host=await serveLibrary();
const browser=await chromium.launch({channel:'chrome',headless:true});
const url=host.origin+'/blueprints/animejs/index.html';
const checks=[];
try {
  for (const [width,reduced] of [[1280,false],[390,false],[390,true]]) {
    const ctx=await browser.newContext({viewport:{width,height:850},hasTouch:width===390,
      reducedMotion:reduced?'reduce':'no-preference'});
    await ctx.route('**/*',route=>route.request().url().startsWith(host.origin+'/')?route.continue():route.abort());
    const page=await ctx.newPage();
    page.setDefaultTimeout(4500);
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(()=>document.querySelector('[data-ink]').hasAttribute('draw'));
    const output=(selector,text)=>page.waitForFunction(([sel,expected])=>document.querySelector(sel)?.textContent===expected,[selector,text]);

    const timeline=page.getByRole('slider',{name:'Timeline position'});
    const initial=await page.locator('[data-ink]').evaluate(path=>path.getAttribute('draw'));
    await timeline.press('Home');
    await timeline.press('ArrowRight');
    await output('[data-time]','1%');
    await timeline.press('End');
    await output('[data-time]','100%');
    await page.getByRole('button',{name:'Reverse',exact:true}).click();
    if(!reduced) {
      await page.waitForFunction(()=>Number(document.querySelector('[data-scrub]').value)<80);
      await page.getByRole('button',{name:'Pause',exact:true}).click();
      const position=await timeline.inputValue();
      await page.waitForTimeout(120);
      assert.equal(await timeline.inputValue(),position,'paused playhead moved');
      await page.getByRole('button',{name:'Play',exact:true}).click();
      await output('[data-time]','100%');
      await page.getByRole('button',{name:'Reverse',exact:true}).click();
    }
    await output('[data-time]','0%');
    if(!reduced){
      await output('[data-timeline-status]','At start');
      assert.equal(await page.locator('[data-ink]').getAttribute('draw'),initial);
    }
    checks.push('timeline:'+width+':'+reduced);

    const slider=page.getByRole('slider',{name:/Weight/});
    const knob=page.locator('[data-weight-knob]');
    const rail=page.locator('[data-rail]');
    await slider.press('End');
    await output('[data-weight-label]','4 / 4');
    await knob.scrollIntoViewIfNeeded();
    const end=await knob.boundingBox();
    const track=await rail.boundingBox();
    assert.ok(end.x+end.width<=track.x+track.width+1.5);
    if(width===1280) {
      await page.mouse.move(end.x+end.width/2,end.y+end.height/2);
      await page.mouse.down();
      await page.mouse.move(track.x+track.width*.53,end.y+end.height/2,{steps:18});
      await page.waitForTimeout(160);
      await page.mouse.up();
    } else {
      const touch=await ctx.newCDPSession(page);
      const x=end.x+end.width/2, y=end.y+end.height/2;
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let step=1;step<=12;step++){
        const next=x+(track.x+track.width*.53-x)*step/12;
        await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:next,y}]});
      }
      await page.waitForTimeout(160);
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await touch.detach();
    }
    await output('[data-weight-label]','2 / 4');
    await slider.press('Home');
    await output('[data-weight-label]','0 / 4');
    checks.push('drag:'+width+':'+reduced);

    const tile=page.locator('[data-tile=harbor]');
    await tile.scrollIntoViewIfNeeded();
    const before=await tile.boundingBox();
    const reorder=page.getByRole('button',{name:'Move lead to end'});
    await reorder.click();
    await output('[data-layout-status]','Lead piece: Ridge');
    await page.waitForFunction(()=>document.querySelector('[data-tile=harbor]').getBoundingClientRect().x>200
      &&!document.querySelector('[data-tile=harbor]').getAnimations().some(a=>a.playState==='running'));
    const after=await tile.boundingBox();
    assert.ok(after.x>before.x+40);
    assert.deepEqual(await page.locator('[data-tiles] li').allTextContents(),['Ridge','Summit','Harbor']);
    checks.push('layout:'+width+':'+reduced);

    const scroller=page.getByRole('region',{name:'Scrollable chapters'});
    await scroller.scrollIntoViewIfNeeded();
    await scroller.focus();
    await scroller.press('End');
    await page.waitForFunction(()=>{
      const node=document.querySelector('[data-scroller]');
      return node.scrollTop===node.scrollHeight-node.clientHeight;
    });
    await output('[data-scroll-progress]','100%');
    await scroller.press('Home');
    await page.waitForFunction(()=>document.querySelector('[data-scroller]').scrollTop===0);
    await output('[data-scroll-progress]','0%');
    const scrollTo=scroller.evaluate(node=>{node.scrollTop=(node.scrollHeight-node.clientHeight)*.5;});
    await scrollTo;
    await page.waitForFunction(()=>{const p=parseInt(document.querySelector('[data-scroll-progress]').textContent);return p>=45&&p<=55;});
    const marker=await page.locator('[data-scroll-indicator]').evaluate(node=>node.style.translate);
    assert.equal(Boolean(marker),!reduced);
    checks.push('scroll:'+width+':'+reduced);

    await page.getByRole('button',{name:'Animate words'}).click();
    if(!reduced) {
      await output('[data-type-status]','Animating');
      assert.ok(await page.locator('[data-phrase] span').count()>=3);
    }
    await output('[data-type-status]','Words visible');
    assert.equal(await page.locator('[data-phrase]').textContent(),'Type in motion');
    assert.equal(await page.locator('[data-phrase] span').count(),0);
    checks.push('text:'+width+':'+reduced);

    const follower=page.locator('[data-follower]');
    await follower.scrollIntoViewIfNeeded();
    const atRest=await follower.boundingBox();
    await page.getByRole('button',{name:'Nudge right'}).click();
    await page.waitForFunction(x=>document.querySelector('[data-follower]').getBoundingClientRect().x>x+20,atRest.x);
    await page.getByRole('button',{name:'Pulse ring'}).click();
    if(reduced) {
      await output('[data-pulse-status]','Ring shown');
      assert.equal(await page.locator('[data-ring]').evaluate(el=>el.getAnimations().length),0);
    } else {
      await output('[data-pulse-status]','Pulsing');
      assert.ok(await page.locator('[data-ring]').evaluate(el=>el.getAnimations().length)>0);
      await output('[data-pulse-status]','Pulse complete');
    }
    checks.push('spring-and-waapi:'+width+':'+reduced);

    if(!reduced) {
      await page.emulateMedia({reducedMotion:'reduce'});
      await output('[data-time]','100%');
      await page.getByRole('button',{name:'Reverse',exact:true}).click();
      await output('[data-time]','0%');
      await page.getByRole('button',{name:'Move lead to end'}).click();
      await output('[data-layout-status]','Lead piece: Summit');
      checks.push('preference-change:'+width);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
    assert.deepEqual(errors,[]);
    await ctx.close();
  }
  console.log(JSON.stringify({passed:checks.length,checks},null,2));
} finally {
  await browser.close();
  await host.close();
}
