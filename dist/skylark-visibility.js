/**
 * skylark-visibility - A version of visibility.js that ported to running on skylarkjs.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-visibility/
 * @license MIT
 */
!function(i,e){var t=e.define,require=e.require,n="function"==typeof t&&t.amd,r=!n&&"undefined"!=typeof exports;if(!n&&!t){var o={};t=e.define=function(i,e,t){"function"==typeof t?(o[i]={factory:t,deps:e.map(function(e){return function(i,e){if("."!==i[0])return i;var t=e.split("/"),n=i.split("/");t.pop();for(var r=0;r<n.length;r++)"."!=n[r]&&(".."==n[r]?t.pop():t.push(n[r]));return t.join("/")}(e,i)}),resolved:!1,exports:null},require(i)):o[i]={factory:null,resolved:!0,exports:t}},require=e.require=function(i){if(!o.hasOwnProperty(i))throw new Error("Module "+i+" has not been defined");var module=o[i];if(!module.resolved){var t=[];module.deps.forEach(function(i){t.push(require(i))}),module.exports=module.factory.apply(e,t)||null,module.resolved=!0}return module.exports}}if(!t)throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");if(function(i,require){i("skylark-visibility/fallback",[],function(){if(!document.visibilityState&&!document.webkitVisibilityState){document.hidden=!1,document.visibilityState="visible";var i=null,e=function(){document.createEvent?(i||(i=document.createEvent("HTMLEvents")).initEvent("visibilitychange",!0,!0),document.dispatchEvent(i)):"object"==typeof Visibility&&Visibility._change.call(Visibility,{})},t=function(){document.hidden=!1,document.visibilityState="visible",e()},n=function(){document.hidden=!0,document.visibilityState="hidden",e()};document.addEventListener?(window.addEventListener("focus",t,!0),window.addEventListener("blur",n,!0)):(document.attachEvent("onfocusin",t),document.attachEvent("onfocusout",n))}}),i("skylark-visibility/core",["./fallback"],function(){if(window.Visibility)return window.Visibility;var i=-1,e={onVisible:function(i){var t=e.isSupported();if(!t||!e.hidden())return i(),t;var n=e.change(function(t,r){e.hidden()||(e.unbind(n),i())});return n},change:function(t){if(!e.isSupported())return!1;var n=i+=1;return e._callbacks[n]=t,e._listen(),n},unbind:function(i){delete e._callbacks[i]},afterPrerendering:function(i){var t=e.isSupported();if(!t||"prerender"!=e.state())return i(),t;var n=e.change(function(t,r){"prerender"!=r&&(e.unbind(n),i())});return n},hidden:function(){return!(!e._doc.hidden&&!e._doc.webkitHidden)},state:function(){return e._doc.visibilityState||e._doc.webkitVisibilityState||"visible"},isSupported:function(){return void 0!==e._doc.hidden||void 0!==e._doc.webkitHidden},_doc:document||{},_callbacks:{},_change:function(i){var t=e.state();for(var n in e._callbacks)e._callbacks[n].call(e._doc,i,t)},_listen:function(){if(!e._init){var i="visibilitychange";e._doc.webkitVisibilityState&&(i="webkit"+i);var t=function(){e._change.apply(e,arguments)};e._doc.addEventListener?e._doc.addEventListener(i,t):e._doc.attachEvent(i,t),e._init=!0}}};return window.Visibility=e}),i("skylark-visibility/visibility",["./core"],function(i){var e,t=-1;return(e=i).every=function(i,n,r){e._time(),r||(r=n,n=null);var o=t+=1;return e._timers[o]={visible:i,hidden:n,callback:r},e._run(o,!1),e.isSupported()&&e._listen(),o},e.stop=function(i){return!!e._timers[i]&&(e._stop(i),delete e._timers[i],!0)},e._timers={},e._time=function(){e._timed||(e._timed=!0,e._wasHidden=e.hidden(),e.change(function(){e._stopRun(),e._wasHidden=e.hidden()}))},e._run=function(i,t){var n,r=e._timers[i];if(e.hidden()){if(null===r.hidden)return;n=r.hidden}else n=r.visible;var o=function(){r.last=new Date,r.callback.call(window)};if(t){var d=new Date-r.last;n>d?r.delay=setTimeout(function(){r.id=setInterval(o,n),o()},n-d):(r.id=setInterval(o,n),o())}else r.id=setInterval(o,n)},e._stop=function(i){var t=e._timers[i];clearInterval(t.id),clearTimeout(t.delay),delete t.id,delete t.delay},e._stopRun=function(i){var t=e.hidden(),n=e._wasHidden;if(t&&!n||!t&&n)for(var r in e._timers)e._stop(r),e._run(r,!t)},e}),i("skylark-visibility/main",["./visibility"],function(i){return i}),i("skylark-visibility",["skylark-visibility/main"],function(i){return i})}(t),!n){var d=require("skylark-langx-ns");r?module.exports=d:e.skylarkjs=d}}(0,this);
//# sourceMappingURL=sourcemaps/skylark-visibility.js.map
