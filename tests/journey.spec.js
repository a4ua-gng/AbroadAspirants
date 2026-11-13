import {test,expect} from '@playwright/test';
test('country search, landing, shortlist and persisted application stage',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('searchbox',{name:'Search cities or countries'}).fill('Germany');
 await page.getByRole('searchbox',{name:'Search cities or countries'}).press('Enter');
 await expect(page).toHaveURL(/\/city\/berlin$/);
 await expect(page.locator('#arrival-title')).toHaveText('Berlin');
 await page.locator('.city-save').first().click();
 await expect(page.locator('.city-save').first()).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#planner-count')).toHaveText('1 saved opportunity');
 await page.locator('.planner-row select').selectOption('preparing');
 await page.reload();
 await expect(page.locator('.planner-row select')).toHaveValue('preparing');
 await page.locator('.scene-gallery').scrollIntoViewIfNeeded();
 await expect.poll(()=>page.locator('.scene-gallery img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBeTruthy();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 expect(errors).toEqual([]);
});
test('offline model keeps quick answers available',async({page})=>{
 await page.route('**/api/chat',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'AI is unavailable. Use Quick guide.'})}));
 await page.goto('/city/tokyo');
 await page.locator('[data-chat-mode="ai"]').click();
 await page.locator('#question').fill('What scholarships are available?');
 await page.locator('#send-question').click();
 await expect(page.locator('#desk-status')).toHaveText('AI unavailable · Quick guide is ready');
 await page.locator('[data-chat-mode="guide"]').click();
 await page.locator('#question').fill('How do I ask for a recommendation letter?');
 await page.locator('#send-question').click();
 await expect(page.locator('.bubble.guide').last()).toContainText('LOR');
});
test('desk sends city context and renders an official link from a text response',async({page})=>{
 let payload;
 await page.route('**/api/chat',route=>{
  payload=route.request().postDataJSON();
  return route.fulfill({status:200,contentType:'text/plain',body:'Read [MEXT](https://www.in.emb-japan.go.jp/Education/Undergraduate_Student.html) for the current call.'});
 });
 await page.goto('/city/tokyo');
 await page.locator('[data-chat-mode="ai"]').click();
 await page.locator('#question').fill('Explain eligibility for Tokyo.');
 await page.locator('#send-question').click();
 await expect(page.locator('#messages a')).toHaveAttribute('href','https://www.in.emb-japan.go.jp/Education/Undergraduate_Student.html');
 expect(payload.city).toBe('tokyo');
});
test('WebGL fallback, keyboard search and next city work',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};});
 await page.goto('/');
 await expect(page.locator('#globe-scene')).toHaveClass(/has-globe/);
 await page.locator('#city-search').fill('Singapore');
 await page.locator('#city-search').press('Enter');
 await expect(page.locator('#arrival-title')).toHaveText('Singapore');
 await page.locator('#next-city').click();
 await expect(page.locator('#arrival-title')).toHaveText('Tokyo');
 await page.locator('.floating-join').click();
 await expect(page.locator('#join-dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('#join-dialog')).not.toBeVisible();
});
