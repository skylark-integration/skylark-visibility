/**
 * skylark-visibility - A version of visibility.js that ported to running on skylarkjs.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-visibility/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-visibility/fallback',[],function(){
    if ( document.visibilityState || document.webkitVisibilityState ) {
        return;
    }

    document.hidden = false;
    document.visibilityState = 'visible';

    var event = null
    var i = 0
    var fireEvent = function () {
        if( document.createEvent ) {
            if ( !event ) {
                event = document.createEvent('HTMLEvents');
                event.initEvent('visibilitychange', true, true);
            }
            document.dispatchEvent(event);
        } else {
            if ( typeof(Visibility) == 'object' ) {
                Visibility._change.call(Visibility, { });
            }
        }
    }

    var onFocus = function () {
        document.hidden = false;
        document.visibilityState = 'visible';
        fireEvent();
    };
    var onBlur  = function () {
        document.hidden = true;
        document.visibilityState = 'hidden';
        fireEvent();
    }

    if ( document.addEventListener ) {
        window.addEventListener('focus', onFocus, true);
        window.addEventListener('blur',  onBlur,  true);
    } else {
        document.attachEvent('onfocusin',  onFocus);
        document.attachEvent('onfocusout', onBlur);
    }
});

define('skylark-visibility/core',[
    "./fallback"
],function(){
    if (window.Visibility) {
        return window.Visibility;
    }
    var lastId = -1;

    // Visibility.js allow you to know, that your web page is in the background
    // tab and thus not visible to the user. This library is wrap under
    // Page Visibility API. It fix problems with different vendor prefixes and
    // add high-level useful functions.
    var self = {

        // Call callback only when page become to visible for user or
        // call it now if page is visible now or Page Visibility API
        // doesn’t supported.
        //
        // Return false if API isn’t supported, true if page is already visible
        // or listener ID (you can use it in `unbind` method) if page isn’t
        // visible now.
        //
        //   Visibility.onVisible(function () {
        //       startIntroAnimation();
        //   });
        onVisible: function (callback) {
            var support = self.isSupported();
            if ( !support || !self.hidden() ) {
                callback();
                return support;
            }

            var listener = self.change(function (e, state) {
                if ( !self.hidden() ) {
                    self.unbind(listener);
                    callback();
                }
            });
            return listener;
        },

        // Call callback when visibility will be changed. First argument for
        // callback will be original event object, second will be visibility
        // state name.
        //
        // Return listener ID to unbind listener by `unbind` method.
        //
        // If Page Visibility API doesn’t supported method will be return false
        // and callback never will be called.
        //
        //   Visibility.change(function(e, state) {
        //       Statistics.visibilityChange(state);
        //   });
        //
        // It is just proxy to `visibilitychange` event, but use vendor prefix.
        change: function (callback) {
            if ( !self.isSupported() ) {
                return false;
            }
            lastId += 1;
            var number = lastId;
            self._callbacks[number] = callback;
            self._listen();
            return number;
        },

        // Remove `change` listener by it ID.
        //
        //   var id = Visibility.change(function(e, state) {
        //       firstChangeCallback();
        //       Visibility.unbind(id);
        //   });
        unbind: function (id) {
            delete self._callbacks[id];
        },

        // Call `callback` in any state, expect “prerender”. If current state
        // is “prerender” it will wait until state will be changed.
        // If Page Visibility API doesn’t supported, it will call `callback`
        // immediately.
        //
        // Return false if API isn’t supported, true if page is already after
        // prerendering or listener ID (you can use it in `unbind` method)
        // if page is prerended now.
        //
        //   Visibility.afterPrerendering(function () {
        //       Statistics.countVisitor();
        //   });
        afterPrerendering: function (callback) {
            var support   = self.isSupported();
            var prerender = 'prerender';

            if ( !support || prerender != self.state() ) {
                callback();
                return support;
            }

            var listener = self.change(function (e, state) {
                if ( prerender != state ) {
                    self.unbind(listener);
                    callback();
                }
            });
            return listener;
        },

        // Return true if page now isn’t visible to user.
        //
        //   if ( !Visibility.hidden() ) {
        //       VideoPlayer.play();
        //   }
        //
        // It is just proxy to `document.hidden`, but use vendor prefix.
        hidden: function () {
            return !!(self._doc.hidden || self._doc.webkitHidden);
        },

        // Return visibility state: 'visible', 'hidden' or 'prerender'.
        //
        //   if ( 'prerender' == Visibility.state() ) {
        //       Statistics.pageIsPrerendering();
        //   }
        //
        // Don’t use `Visibility.state()` to detect, is page visible, because
        // visibility states can extend in next API versions.
        // Use more simpler and general `Visibility.hidden()` for this cases.
        //
        // It is just proxy to `document.visibilityState`, but use
        // vendor prefix.
        state: function () {
            return self._doc.visibilityState       ||
                   self._doc.webkitVisibilityState ||
                   'visible';
        },

        // Return true if browser support Page Visibility API.
        // refs: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
        //
        //   if ( Visibility.isSupported() ) {
        //       Statistics.startTrackingVisibility();
        //       Visibility.change(function(e, state)) {
        //           Statistics.trackVisibility(state);
        //       });
        //   }
        isSupported: function () {
            return self._doc.hidden !== undefined || self._doc.webkitHidden !== undefined;
        },

        // Link to document object to change it in tests.
        _doc: document || {},

        // Callbacks from `change` method, that wait visibility changes.
        _callbacks: { },

        // Listener for `visibilitychange` event.
        _change: function(event) {
            var state = self.state();

            for ( var i in self._callbacks ) {
                self._callbacks[i].call(self._doc, event, state);
            }
        },

        // Set listener for `visibilitychange` event.
        _listen: function () {
            if ( self._init ) {
                return;
            }

            var event = 'visibilitychange';
            if ( self._doc.webkitVisibilityState ) {
                event = 'webkit' + event;
            }

            var listener = function () {
                self._change.apply(self, arguments);
            };
            if ( self._doc.addEventListener ) {
                self._doc.addEventListener(event, listener);
            } else {
                self._doc.attachEvent(event, listener);
            }
            self._init = true;
        }

    };


    return window.Visibility = self;

});

define('skylark-visibility/visibility',[
    "./core"
],function(core){
    var lastTimer = -1;

    var install = function (Visibility) {

        // Run callback every `interval` milliseconds if page is visible and
        // every `hiddenInterval` milliseconds if page is hidden.
        //
        //   Visibility.every(60 * 1000, 5 * 60 * 1000, function () {
        //       checkNewMails();
        //   });
        //
        // You can skip `hiddenInterval` and callback will be called only if
        // page is visible.
        //
        //   Visibility.every(1000, function () {
        //       updateCountdown();
        //   });
        //
        // It is analog of `setInterval(callback, interval)` but use visibility
        // state.
        //
        // It return timer ID, that you can use in `Visibility.stop(id)` to stop
        // timer (`clearInterval` analog).
        // Warning: timer ID is different from interval ID from `setInterval`,
        // so don’t use it in `clearInterval`.
        //
        // On change state from hidden to visible timers will be execute.
        Visibility.every = function (interval, hiddenInterval, callback) {
            Visibility._time();

            if ( !callback ) {
                callback = hiddenInterval;
                hiddenInterval = null;
            }

            lastTimer += 1;
            var number = lastTimer;

            Visibility._timers[number] = {
                visible:  interval,
                hidden:   hiddenInterval,
                callback: callback
            };
            Visibility._run(number, false);

            if ( Visibility.isSupported() ) {
                Visibility._listen();
            }
            return number;
        };

        // Stop timer from `every` method by it ID (`every` method return it).
        //
        //   slideshow = Visibility.every(5 * 1000, function () {
        //       changeSlide();
        //   });
        //   $('.stopSlideshow').click(function () {
        //       Visibility.stop(slideshow);
        //   });
        Visibility.stop = function(id) {
            if ( !Visibility._timers[id] ) {
                return false;
            }
            Visibility._stop(id);
            delete Visibility._timers[id];
            return true;
        };

        // Callbacks and intervals added by `every` method.
        Visibility._timers = { };

        // Initialize variables on page loading.
        Visibility._time = function () {
            if ( Visibility._timed ) {
                return;
            }
            Visibility._timed     = true;
            Visibility._wasHidden = Visibility.hidden();

            Visibility.change(function () {
                Visibility._stopRun();
                Visibility._wasHidden = Visibility.hidden();
            });
        };

        // Try to run timer from every method by it’s ID. It will be use
        // `interval` or `hiddenInterval` depending on visibility state.
        // If page is hidden and `hiddenInterval` is null,
        // it will not run timer.
        //
        // Argument `runNow` say, that timers must be execute now too.
        Visibility._run = function (id, runNow) {
            var interval,
                timer = Visibility._timers[id];

            if ( Visibility.hidden() ) {
                if ( null === timer.hidden ) {
                    return;
                }
                interval = timer.hidden;
            } else {
                interval = timer.visible;
            }

            var runner = function () {
                timer.last = new Date();
                timer.callback.call(window);
            }

            if ( runNow ) {
                var now  = new Date();
                var last = now - timer.last ;

                if ( interval > last ) {
                    timer.delay = setTimeout(function () {
                        timer.id = setInterval(runner, interval);
                        runner();
                    }, interval - last);
                } else {
                    timer.id = setInterval(runner, interval);
                    runner();
                }

            } else {
              timer.id = setInterval(runner, interval);
            }
        };

        // Stop timer from `every` method by it’s ID.
        Visibility._stop = function (id) {
            var timer = Visibility._timers[id];
            clearInterval(timer.id);
            clearTimeout(timer.delay);
            delete timer.id;
            delete timer.delay;
        };

        // Listener for `visibilitychange` event.
        Visibility._stopRun = function (event) {
            var isHidden  = Visibility.hidden(),
                wasHidden = Visibility._wasHidden;

            if ( (isHidden && !wasHidden) || (!isHidden && wasHidden) ) {
                for ( var i in Visibility._timers ) {
                    Visibility._stop(i);
                    Visibility._run(i, !isHidden);
                }
            }
        };

        return Visibility;
    }


    return   install(core);
    
});

define('skylark-visibility/main',[
	"./visibility"
],function(visibility){
	return visibility;
});
define('skylark-visibility', ['skylark-visibility/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-visibility.js.map
