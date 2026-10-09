/**
* +--------------------------------------------------------------------+
* | This MySource Matrix CMS file is Copyright (c) Squiz Pty Ltd       |
* | ABN 77 084 670 600                                                 |
* +--------------------------------------------------------------------+
* | IMPORTANT: Your use of this Software is subject to the terms of    |
* | the Licence provided in the file licence.txt. If you cannot find   |
* | this file please contact Squiz (www.squiz.com.au) so we may provide|
* | you a copy.                                                        |
* +--------------------------------------------------------------------+
*
* $Id: general.js,v 1.23 2013/07/25 23:23:50 lwright Exp $
*
*/

 ///////////////////////////////////////////////////////
// converts certain chars to their html entity value
// converts :  '&' -> '&amp;'
//             '"' -> '&quot;'
//             '<' -> '&lt;'
//             '>' -> '&gt;'
function htmlspecialchars(str) {

	s = new String(str);

	s = s.replace(/\&/g, '&amp;');
	s = s.replace(/\"/g, '&quot;');
	s = s.replace(/</g,  '&lt;');
	s = s.replace(/>/g,  '&gt;');

	return s;

}// htmlspecialchars()

 ///////////////////////////////////////////////////////
// reverses htmlspecialchars() above
function rev_htmlspecialchars(str) {
	s = new String(str);

	s = s.replace(/\&amp;/g,  '&');
	s = s.replace(/\&quot;/g, '"');
	s = s.replace(/\&lt;/g,   '<');
	s = s.replace(/&gt;/g,    '>');

	return s;

}// rev_htmlspecialchars()

 ///////////////////////////////////////////////////////
// trims all white space from the start and end of
// the string
String.prototype.trim = function() {
	var str = this.toString();
	str = str.replace(/^\s+/, '');
	str = str.replace(/\s+$/, '');
	return str;
}// end trim()

 ///////////////////////////////////////////////////////
// sorts the array then removes any duplicates
// from it
function array_unique(arr) {

	var new_arr = new Array();
	arr.sort();
	var tmp = '';

	for(var i = 0; i < arr.length; i++) {
		if (arr[i] != tmp) {
			new_arr.push(arr[i]);
			tmp = arr[i];
		}// end if
	}// end for

	return new_arr;

}// end array_unique()

 ///////////////////////////////////////////////////////
// takes an array and a value and removes the first
// element in the array with that value
function array_remove_element(arr, val, remove_all) {

	if (remove_all == null) {
		remove_all = false;
	}

	var i = null;
	do {
		var i = array_search(arr, val);
		if (i != null) arr.splice(i, 1);
	} while (remove_all && i != null);

}// end array_remove_element()

 ///////////////////////////////////////////////////////
// takes an array and a value returns the first index
// in the array with the passed value
function array_search(arr, val) {

	for (var i = 0; i < arr.length; i++) {
		if (arr[i] == val) return i;
	}
	return null;

}// end array_search()

 ///////////////////////////////////////////////////////
// takes an array and returns a copy of it
function array_copy(arr) {

	var new_arr = new Array();
	for (var i = 0; i < arr.length; i++) {
		new_arr[i] = arr[i];
	}
	return new_arr;

}// end array_copy()


  /////////////////////////////////////////////////////////////////
 // IMAGE ROLLOVER FUNCTIONS
// holds all the img srcs for the images not currently visible
var preloaded_images = new Array();

// takes an image path and preloads it into the browser
function preload_image(src) {

	var i = preloaded_images.length;

	preloaded_images[i] = new Image();
	preloaded_images[i].src = src;

}// end preload_images()

function img_roll(id, src) {
	if (document.images) {
		document[id].src = src;
	}
}// end img_roll()


/*
* Check all checkboxes that match a certain name. This is usually added to the
* onClick event of a "Check All" style checkbox
*
* @param HTMLFormElement	f			the form that the checkbox is in
* @param string				match_name	regular expression matching the controlled checkboxes
* @param boolean			on			the checked state of the check all checkbox
*
* @return null
*/
function check_all(f, match_name, on) {
	re = new RegExp(match_name);
	for(i=0; i < f.elements.length; i++){
		if (re.test(f.elements[i].name)) {
			f.elements[i].checked = on;
		}
	}

}//end check_all()


/*
* Check all checkboxes within the specified parent block that match a certain name. This is usually added to the
* onClick event of a "Check All" style checkbox
*
* @param HTMLElement		e			the block that has the checkboxes
* @param string				match_name	regular expression matching the controlled checkboxes
* @param boolean			on			the checked state of the check all checkbox
*
* @return null
*/
function check_all_by_parent(e, match_name, on) {

	re = new RegExp(match_name);
	var items = e.getElementsByTagName('input');
	for(i=0; i < items.length; i++){
		if (items[i].type == 'checkbox' && re.test(items[i].name)) {
			items[i].checked = on;
		}
	}

}//end check_all_by_parent()


/*
* Add this function to the onClick event of all checkboxes controlled by a
* "check all" checkbox
*
* @param HTMLFormElement	f			the form that the checkbox is in
* @param string				match_name	regular expression matching the controlled checkboxes
* @param string				dec_point	elementID of the "check all" checkbox
*
* @return null
*/
function update_checked(f, match_name, check_all_id) {
	var all_checked = true;
	re = new RegExp(match_name);
	for (i=0; i < f.elements.length; i++){
		if (re.test(f.elements[i].name)) {
			if (f.elements[i].checked == false) {
				all_checked = false;
			}
		}
	}
	document.getElementById(check_all_id).checked = all_checked;

}//end update_checked()

/*
* format a number into a string to the specified number of decimal places
* and put in the thousands separator, just like the PHP number_format() fn
*
* @param float	num				the number to format
* @param int	places			the number of decimal places to round to
* @param string	dec_point		the character to use as the decimal point, defaults to '.'
* @param string	thousands_sep	the character to use as the thousands separator, defaults to ''
*
* @return String
*/
function number_format(num, places, dec_point, thousands_sep) {
	// just to make sure we have a number
	num = parseFloat(num);
	if (isNaN(num)) num = 0;
	places = parseInt(places);
	if (isNaN(places) || places < 0) places = 0;

	// if dec_point wasn't set use default
	if (dec_point == undefined || dec_point == null) dec_point = '.';
	// if thousands_sep wasn't set use default
	if (thousands_sep == undefined || thousands_sep == null) thousands_sep = '';


	if (places == 0) {
		return _number_format_thousand_separators(Math.round(num), thousands_sep);
	} else {
		// if we are a zero then
		if (num == 0) {
			var str = '0' + dec_point;
			for(var i = 0; i < places; i++) {
				str += '0';
			}// end for
			return str;
		} else {
			var big_num = Math.round(num * Math.pow(10, places));
			str = big_num.toString();
			var dec_place = (str.length - places);
			var dec_str    = _number_format_thousand_separators(str.substr(0, dec_place), thousands_sep);
			var places_str = str.substr(dec_place);
			return dec_str + dec_point + places_str;

		}// end if
	}// end if

}// end number_format()

function _number_format_thousand_separators(str, sep) {

	str = str.toString();

	if (sep == '') return str;

	if (str.length <= 3) return str;

	var new_str = '';
	var i = str.length % 3;
	var prefix_comma = false;
	if (i > 0) {
		new_str += str.substr(0, i);
		prefix_comma = true;
	}
	while (i < str.length) {
		if (prefix_comma) new_str += sep;
		new_str += str.substr(i, 3);
		i += 3;
		prefix_comma = true;
	}// end while

	return new_str;

}// end _number_format_thousand_separators()


// prints an icon using transparency in IE
// ensures that PNGs have transparent background in IE and Mozilla
// NOTE: This fuction has been deprecated
function sq_print_icon(path, width, height, alt) {
	// Matrix 5 update: This shouldn't be an issue anymore as the new icons have been exported to support IE8, will print icons the same way regardless of browser.
	//var is_ie10 = (navigator.userAgent.toLowerCase().indexOf("msie 10") != -1);

	// issue seems to have been fixed in IE 10
	// Matrix 5 update: This shouldn't be an issue anymore as the new icons have been exported to support IE8.
	/*if ((typeof window.ActiveXObject != "undefined") && !is_ie10) {
		// IE < 10, cant handle transparent PNGs
		document.write ('<span style="height:'+height+'px;width:'+width+'px; filter:progid:DXImageTransform.Microsoft.AlphaImageLoader (src=\''+path+'\', sizingMethod=\'scale\')" title="' + alt + '"></span>');
	} else {
		document.write('<img src="'+path+'" width="'+width+'" height="'+height+'" border="0" alt="'+alt+'" />');
	}
	*/
	document.write('<img src="'+path+'" width="'+width+'" height="'+height+'" border="0" alt="'+alt+'" />');

}//end sq_print_icon()


// redirect the user to another page with a friendly message
// and a manual click they can click if something goes wrong
function sq_redirect(url) {

	document.write("<html>");
	document.write("	<head>");
	document.write("		<link rel=\"stylesheet\" type=\"text/css\" href=\"https://fonts.googleapis.com/css?family=Open+Sans:400,600,700&display=swap\" />");
	document.write("		<style type=\"text/css\">");
	document.write("			body {");
	document.write("				font-size:			0.813rem");
	document.write("				line-height:		1.2em");
	document.write("				font-family:		\"Open Sans\", Arial, Verdana, Helvetica, sans-serif");
	document.write("				color:				#000000;");
	document.write("				background-color:	#FFFFFF;");
	document.write("			}");
	document.write("		</style>");
	document.write("	</head>");
	document.write("	<body>");
	document.write("		Please wait while you are redirected. If you are not redirected, please click <a href=\"" + url + "\" title=\"Click here to manually redirect\">here</a>");
	document.write("	</body>");
	document.write("</html>");
	window.location = url;

}//end sq_redirect()


/**
* Simple sprintf implementation
*
* allows for string value replacements and string re-use in the form of
* %s for a single or non order important replacement
* %2(some digit)s for order important replacements i.e. %1s %2s %1s
* uses php type statements (includes the $)
* currently does not allow no string replacements i.e. %d
*
* @return string
*/
function sprintf() {
	var txt = arguments[0];
	var c = 1; //offset source string
	var pattern = /%\d*\$*s/;

	while(c < arguments.length) {
		//below line extracts the current ordered match so we know what argument
		//we are using, the $ needs to be escaped again in order to work.
		replace = new RegExp(((txt.match(pattern)).toString()).replace(/\$/, '\\\$'), "g");

		txt = txt.replace(replace, arguments[(replace.toString()).match(/\d/)]);
		c++;
	}
	return (txt);

}//end sprintf()


/**
* Simple vsprintf implementation
*
* allows for string value replacements and string re-use in the form of
* %s for a single or non order important replacement
* %2(some digit)s for order important replacements i.e. %1s %2s %1s
* uses php type statements (includes the $)
* currently does not allow no string replacements i.e. %d
*
* @return string
*/
function vsprintf() {
	var txt = arguments[0];

	// handle positioned "%1$s"
	var pattern = /%\d+\$s/;

	while(txt.match(pattern)) {
		//below line extracts the current ordered match so we know what argument
		//we are using, the $ needs to be escaped again in order to work.
		replace = new RegExp(((txt.match(pattern)).toString()).replace(/\$/, '\\\$'), "g");

		arg_index =	(replace.toString()).match(/\d/) - 1;
		txt = txt.replace(replace, arguments[1][arg_index]);
	}

	// now handle non-positioned "%s" - need to keep a running counter on this
	// because first "%s" should be replaced by first argument, second "%s" by
	// second argument, etc.
	var pattern = /%s/;
	var current_s = 0;

	while(txt.match(pattern)) {
		txt = txt.replace(pattern, arguments[1][current_s]);
		current_s++;
	}

	return (txt);

}//end vsprintf()


/**
* Handles the interactions of a toggle element by adding and removing classes to each toggle element.
* Adds a class to the clicked toggle element and removes any selected classes of other active toggle elements.
*
* @param the_toggler		The element that was clicked on within the toggler wrapper
*
* @return boolean
*/
function sq_handle_toggle(the_toggler) {
	//Update class names on the toggles
	toggleElements = the_toggler.parentNode.getElementsByTagName('a');
	for (var i in toggleElements) {
		if (toggleElements[i].className == 'selected') {
			toggleElements[i].className = '';
		}
	}
	the_toggler.className = 'selected';
	return false;
}//end sprintf()


/**
* Make an AJAX request to the server
*
* @param url				URL to make the request to
* @param callback			Callback function to execute when response is ready
* @param method				Request method, 'GET' or 'POST'
* @param data				POST data string to send
* @param async				Whether to make asynchronous or synchronous request
* @param timeout			Timeout value in milliseconds
* @param timeout_callback	Callback function to execute on the timeout
*
* @return void
*/
function ajax_request(url, callback, method, data, async, timeout, timeout_callback)
{
	if (url == null) {
		return;
	}

	// Default values
	if (method == null) {
		method = 'GET';
	}
	if (async == null) {
		async = true;
	}

	var xhr = new XMLHttpRequest();
	xhr.open(method, url, async);
	if (method == 'POST' && data) {
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	}

	var timeoutSet = null;

	// Asynchronous request
	if (async && typeof(callback) == 'function') {
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				var response = xhr.responseText;
				callback(response);
			}
			// Clear the timeout if set
			if (timeoutSet) {
				clearTimeout(timeoutSet);
			}
		}
	}

	xhr.send(data);

	if (timeout != null) {
		timeoutSet = setTimeout(function() {
				xhr.abort();
				if (typeof(timeout_callback) == 'function') {
					timeout_callback();
				}
			},
			timeout
		);
	}

	// Synchronous request
	if (!async && callback != null && typeof(callback) == 'function') {
		var response = xhr.responseText;
		callback(response);
	}

}//end ajax_request()


/**
 * Class BrowserUserPref
 * Save the user preferences in the browser's local storage
 *
 * NOTE: This is a singeleton class. Its instance should be obtained as:
 * 	var instance = BrowserUserPref.load(<userid>);
 * 	where <userid> is asset id of the currently logged in user
 *
 * @access public
 * @return object
 */
var BrowserUserPref = (function() {

	var instance;

	function initInstance(id) {
		var userid = encodeURI(id);
		return {
			/**
			 * Set the preference 'name' to the 'value'
			 *
			 * @param string  name    Preference name
			 * @param string  value   Preference value
			 * @param boolean session If TRUE, save the value in 'session' storage, otherwise in 'local' stroage
			 *
			 * @return void
			 * @access public
			 */
			set: function(name, value, session) {
				var storage = eval(session !== 'undefined' && session ? 'sessionStorage' : 'localStorage');
				// Existing user preferences
				var prefs = JSON.parse(storage.getItem(userid));
				if (!prefs) {
					prefs = {};
				}

				// Add the item to the prefs and save
				prefs[name] = value;
				storage.setItem(userid, JSON.stringify(prefs));
			},//end set()

			/**
			 * Get the preference 'name' value
			 *
			 * @param string  name    Preference name
			 * @param boolean session If TRUE, get the value from 'session' storage, otherwise from 'local' stroage
			 *
			 * @return string
			 * @access public
			 */
			get: function(name, session) {
				var storage = eval(session !== 'undefined' && session ? 'sessionStorage' : 'localStorage');
				// Existing user preferences
				var prefs = JSON.parse(storage.getItem(userid));
				if (!prefs) {
					prefs = {};
				}

				return prefs[name];
			}//end get()
		};
	}//end initInstance()

	return {
		/**
		 * Returns the singeleton class's instance
		 *
		 * @param string id	Currently logged in user asset id
		 *
		 * @return object
		 * @access public
		 */
		load: function(id) {
			if (typeof(Storage) !== 'undefined') {
				if (!instance) {
					instance = new initInstance(id);
					instance.constructor = null;
				}
				return instance;
			}
		}//end load()

	};
})(); //end BrowserUserPref class
