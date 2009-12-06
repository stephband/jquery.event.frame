// jquery.events.frame.js
// 1.1
// Stephen Band
// 
// Project home
// webdev.stephband.info/events/frame

(function(jQuery){

var undefined,
    timers = {};

// Timer constructor
// fn callback - function to call on each frame with 'this' set to the timer object
// fd frameDuration - milliseconds

function Timer( fn, fd ) {
    var self = this,
        clock;
    
    function update(){
        self.frameCount++;
        fn.call(self);
    }
    
    this.frameDuration = fd || 25 ;
    this.frameCount = 0 ;
    this.start = function(){
        update();
        clock = setInterval(update, this.frameDuration);
    };
    this.stop = function(){
        clearInterval( clock );
        clock = null;
    };
}

// callHandler() is called a timer object
// 'this' is the timer object

function callHandler(){
    
    var fn = jQuery.event.special.frame.handler,
        event = jQuery.Event("frame"),
        array = this.array,
        l = array.length;
    
    // Give event object properties
    event.frameCount = this.frameCount;
    
    // Call handler on each elem in array
    while (l--) {
        fn.call(array[l], event);
    }
}

// spork() is called for each bound namespace, and
// decides whether or not to launch a new timer

function spork( elem, name, fd ) {
    // If timer is already running, add this to the list of elems it calls
    if ( timers[name] ) {
        timers[name].array.push(elem);
    }
    // Otherwise create a new timer with this in the list, and set it going
    else {
        timers[name] = new Timer( callHandler, fd );
        
        // Attach elem array to timer object
        timers[name].array = [elem];
        
        // Queue timer to start as soon as this thread has finished -
        // event handler is not yet ready to be called because setup is not complete
        var t = setTimeout(function(){
            timers[name].start();
            clearTimeout(t);
            t = null;
        }, 0);
    }
}

function unspork( elem, name ) {
    var array = timers[name].array,
        l = array.length;
    
    // Remove element from list
    while (l--) {
        if (array[l] === elem) {
            array.splice(l, 1);
            break;
        }
    }
    
    // Stop and remove timer when no elems left
    if (array.length === 0) {
        timers[name].stop();
        timers[name] = undefined;
    }
}

jQuery.event.special.frame = {
    setup: function(data, namespaces) {
        var l = namespaces.length;
        
        // No namespaces, so spork master timer
        if (!l) {
            spork( this, 0, data && data.frameDuration );
            return;
        }
        
        // Namespaces, so spork new timer for each namespace
        while (l--) {
            spork( this, namespaces[l], data && data.frameDuration );
        }
    },
    teardown: function(namespaces) {
        var l = namespaces.length;
        
        // No namespaces, so unspork from all timers
        if (!l) {
            for (var name in timers ) {
                unspork( this, name );
            }
            return;
        }
        
        // Namespaces, so unspork timer for each name
        while (l--) {
            unspork( this, namespaces[l] );
        }
    },
    handler: function(event){
        // let jQuery handle the calling of event handlers
        jQuery.event.handle.apply(this, arguments);
    }
};

})(jQuery);