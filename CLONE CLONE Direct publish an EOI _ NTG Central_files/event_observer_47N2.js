/**
 * A Class that implements the Observer pattern to monitor changes in other objects
 * unobtrusively
 * @example
 * var InputButton = function()
 * {
 *      this.value = '';
 *      this.changed = new Observable(this);
 * };
 * InputButton.prototype.change = function(value) {
 *     this.value = value;
 *     this.changed.notify({value: this.value});
 * });
 * var testInput = new InputButton();
 * testInput.changed.attach(function(value){
 *    alert('The value is now ' + value);
 * });
 * testInput.change('New Value!'); // Will alert "New Value!"
 * @param {object} obj       The object to observe
 * @constructor
 */
var Observable = function(obj)
{
	this.observed = obj;
	this.listeners = [];
};

Observable.prototype = {

	/**
	 * Attach a listener to the observed object
	 * @param {function} listener       The function to attach
	 */
	attach: function(listener)
	{
		this.listeners.push(listener);
	},// End attach

	/**
	 * Detach an object from the list of listeners
	 * @param {function} listener       The function to detach
	 */
	detach: function(listener)
	{
		this.each(function(index,obj){
			if (listener === obj) {
				this.listeners.splice(index,1);
			}// End if
		});
	},// End detach

	/**
	 * Notify all listeners of changes
	 * @param {mixed} [arguments]   All arguments passed through to the listener
	 */
	notify: function()
	{
		var args = arguments;
		this.each(function(index,listener){
			listener.apply(this.observed,args);
		});
	},// End notify

	/**
	 * Iterate each attached listener and apply a fn call
	 * @example
	 * this.each(function(index,listener){
	 * alert(index); // Eg 0
	 * alert(listener); // Function
	 * });
	 * @param {function} fn     Function to send each listener in this.listeners
	 */
	each: function(fn)
	{
		for (var i=0, l=this.listeners.length; i<l; i+=1) {
			fn.apply(this,[i,this.listeners[i]]);
		}// End for
	}// End each
};

/**
 * Provides a wrapper for adding observers to events occuring in other objects and
 * triggering notifications based on event name.
 *
 * @example
 * var Test = function()
 * {
 *      this.events = new ObservableEvents(this,
 *          ['saved','locks_acquired','attribute_changed']);
 * };
 * @param {object} observed     The object being observed
 * @param {array} [eventNames]    An array of event names to pre-register as observable
 * @constructor
 */
var ObservableEvents = function(observed)
{
	this.observed = observed;
	this.events = {};
	this.triggeredEvents = {};

	var eventNames = [];

	if (typeof(arguments[1]) !== "undefined")  {
		eventNames = arguments[1];
	}// End if

	for (var i=0, l=eventNames.length; i<l; i+=1) {
		this.register(eventNames[i]);
	}// End for
};

ObservableEvents.prototype = {
	/**
	 * Register a new event name. Event names that aren't registered will be ignored
	 * @param {string} eventName    The name of the event
	 */
	register: function(eventName)
	{
		this.events[eventName] = new Observable(this.observed);
	},// End register

	/**
	 * Attach a listener to an event for an observable object
	 * @param {string} eventName    The event name this listener will respond to
	 * @param {function} fn         Callback function triggered when the listener
	 *                              is notified. This function will receive any arguments
	 *                              passed by the event trigger.
	 */
	observe: function(eventName,fn)
	{
		if (!this.eventExists(eventName)) {
			this.register(eventName);
		}// End if
		this.events[eventName].attach(fn);
	},// End observe

	/**
	 * Trigger an event for the observable object
	 * @param {string} eventName        The name of the event
	 * @param {mixed}  [arguments]      Any number of additional arguments given
	 *                                  to this function will be passed into the listener
	 */
	trigger: function()
	{
		if (arguments.length === 0) {
			return false;
		}// End if

		var arguments = Array.prototype.slice.call(arguments);
		var eventName = Array.prototype.splice.apply(arguments,[0,1]);

		if (!this.eventExists(eventName)) {
			this.register(eventName);
		}// End if

		this.events[eventName].notify.apply(this.events[eventName],arguments);
	},// End trigger
	
	/**
	 * Trigger an event for the observable object, just once for the firt time
	 * @param {string} eventName        The name of the event
	 * @param {mixed}  [arguments]      Any number of additional arguments given
	 *                                  to this function will be passed into the listener
	 */
	triggerOnce: function()
	{
		if (arguments.length === 0) {
			return false;
		}// End if

		var arguments = Array.prototype.slice.call(arguments);
		var eventName = Array.prototype.splice.apply(arguments,[0,1]);

		if (this.triggeredEvents[eventName] !== undefined && this.triggeredEvents[eventName]) {
			return;
		}

		if (!this.eventExists(eventName)) {
			this.register(eventName);
		}// End if

		this.triggeredEvents[eventName] = true;

		this.events[eventName].notify.apply(this.events[eventName],arguments);
	},// End trigger

	/**
	 * Does an event name exist
	 * @param {string} eventName    The name of an event to check
	 * @returns {boolean}
	 */
	eventExists: function(eventName)
	{
		return this.events.hasOwnProperty(eventName);
	}// End eventExists
};
