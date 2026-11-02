// Test harness only: excluded from the published static export.
localStorage.setItem('furtivo.save.v1','corrupt-test-save');
await import('../src/app.js');
const game=document.querySelector('furtivo-game');
const checks=[];
function assert(ok,name){if(!ok)throw new Error(name);checks.push(name);}
try{
 assert(game.querySelector('#turn').textContent==='00/100','corrupt save recovers');
 game.querySelector('[data-action=down]').click();
 assert(game.querySelector('#turn').textContent==='01/100','real movement works');
 window.dispatchEvent(new Event('blur'));
 assert(game.querySelector('#dialog').open,'blur opens pause');
 game.querySelector('[data-action=down]').click();
 assert(game.querySelector('#turn').textContent==='01/100','paused input does not move');
 game.querySelector('#dialog-action').click();
 await new Promise(resolve=>setTimeout(resolve,0));
 assert(!game.querySelector('#dialog').open,'explicit resume closes pause');
 game.querySelector('[data-action=down]').click();
 assert(game.querySelector('#turn').textContent==='02/100','resume allows movement');
 game.remove();
 window.dispatchEvent(new Event('blur'));
 document.body.append(game);
 game.querySelector('[data-action=down]').click();
 assert(game.querySelector('#turn').textContent==='01/100','reconnection has one input listener and fresh state');
 document.querySelector('#test-result').textContent=`PASS ${checks.length}: ${checks.join(' / ')}`;
}catch(error){document.querySelector('#test-result').textContent=`FAIL: ${error.message}`;}
