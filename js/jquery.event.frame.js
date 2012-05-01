// jquery.events.frame.js
// 1.1
// Stephen Band
// 
// Project home:
// webdev.stephband.info/events/frame/
//
// Source:
// http://github.com/stephband/jquery.event.frame

(function(jQuery, undefined){

var timers = {};


// Timer constructor
// fn - callback to call on each frame, with context set to the timer object
// fd - frame duration in milliseconds

function Timer( fn, fd ) {
    var self = this,
        clock;
    
    function update(){
        self.frameCount++;
        fn.call(self);
    }
    
    this.frameDuration = fd || 25 ;
    this.frameCount = -1 ;
    this.start = function(){
        update();
        clock = setInterval(update, this.frameDuration);
    };
    this.stop = function(){
        clearInterval( clock );
        clock = null;
    };
}


// callHandler() is the callback given to the timer object
// context is the timer object

function callHandler(){
    var fn = jQuery.event.special.frame.handler,
        event = jQuery.Event("frame." + this.name),
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
        console.log('"' + name + '" already running. Adding ' + elem + ' to list.');
        
        // Is elem already in the list?
        var l = timers[name].array.length;
        while (l--) {
            if (timers[name].array[l] === elem) { return; }
        }
        
        // So put it in, then.
        timers[name].array.push(elem);
    }
    // Otherwise create a new timer with this in the list, and set it going
    else {
        console.log('"' + name + '" created with ' + elem + ' in list.');
        
        timers[name] = new Timer( callHandler, fd );
        
        // Attach elem array to timer object
        timers[name].array = [elem];
        timers[name].name = name;
        
        // Queue timer to start as soon as this thread has finished -
        // event handler is not yet ready to be called because setup is not complete
        var t = setTimeout(function(){
            timers[name].start();
            clearTimeout(t);
            t = null;
        }, 0);
    }
    
    console.log(timers);
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
        console.log('Removing timer "' + name + '"');
        timers[name].stop();
        delete timers[name];
    }
    
    console.log(timers);
}

jQuery.event.special.frame = {
    // Fires the first time an event is bound per element
    setup: function(data, namespaces) {},
    // Fires every time event is bound
    add: function(handler, data, namespaces){
        console.log('ADD');
        
        var l = namespaces.length;
        
        // No namespaces, so spork master timer
        if (!l) {
            spork( this, 0, data && data.frameDuration );
            return;
        }
        
        // Namespaces exist, so spork new timer for each namespace
        while (l--) {
            spork( this, namespaces[l], data && data.frameDuration );
        }
    },
    // Fires every time event is unbound
    remove: function(namespaces){
        console.log('REMOVE');
        
        var l = namespaces.length;
        
        // No namespaces, so unspork from all timers
        if (!l) {
            for (var name in timers ) {
                unspork( this, name );
            }
            return;
        }
        
        // Namespaces exist, so unspork timer for each name
        while (l--) {
            unspork( this, namespaces[l] );
        }
    },
    // Fires last time event is unbound per element
    teardown: function(namespaces) {},
    handler: function(event){
        // let jQuery handle the calling of event handlers
        jQuery.event.handle.apply(this, arguments);
    }
};

})(jQuery);