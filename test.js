function eventsCallback(events) { // Verify there were events. 
if (events && events.length > 0) { storedEvents = events[0].events; } 
else { storedEvents = []; }
drawScreen(); 
} 
/** * Ask the container for the next calendar event. */ 
function getNextEvents() { // Get the next event for the current user. Retrieve events for the next // two weeks to find it. 
var start = new Date(); 
var end = new Date(); 
end.setDate(end.getDate() + 14); 
var optionalParams = { 'requestedFields': ['status'] }; 
google.calendar.read.getEvents( eventsCallback, '@viewer', google.calendar.utils.fromDate(start, timeOffset), google.calendar.utils.fromDate(end, timeOffset), optionalParams); 
} /** * The cached preference object. */ 
var _prefs = null; /** * Get the translated message for the ID. * @param {string} id The id of the message. * @return {string} The resulting string. */ 
function getMsg(id) { 
  if (!_prefs) { _prefs = new gadgets.Prefs(); } 
  return _prefs.getMsg(id); 
} /** * @param {number] n The number in question. * @param {string} type The type [day, hour, minute]. * @return {string} The human readible description of the time period. */ 
function getText(n, type) { 
  if (n == 1) 
  { return getMsg(type + 'Singular'); 
  } 
  var out = getMsg(type + 'Plural');
  return out.replace("#", n); 
} /** * Given a Calendar API style time, return the human readible amount * of time until t. * @param {Object} t The calendar API style time. * @return {string} The amount of time until this occurs. * TODO - fix this method of simpler i18n + pluralization. */ function getTimeToNow(t) { var now = google.calendar.utils.getNow(timeOffset); var event_start = google.calendar.utils.toDate(t); var diff = (event_start.getTime() - now.getTime()) / (60 * 1000); diff = Math.round(diff); var minutes = diff % 60; diff = Math.floor(diff / 60); if (diff == 0) { return getText(minutes, 'Minute'); } var hours = diff % 24; diff = Math.floor(diff / 24); if (diff == 0) { return getText(hours, 'Hour') + ' ' + getText(minutes, 'Minute'); } var days = diff % 7; diff = Math.floor(diff / 7); if (days == 1) { return getText(24 + hours, 'Hour'); } if (diff == 0) { return getText(days, 'Day') + ' ' + getText(hours, 'Hour'); } var weeks = diff; return getText(weeks * 7 + days, 'Day') } /** * The ID of the event onscreen, if any. * @type {string?} */ var curEventId = null; /** * The offset from the current system time to the calendar displayed time. */ var timeOffset = 0; /** * An array of events. * @type {Array<Object>} */ var storedEvents = null; /** * The number of times that we've refreshed the events. * @type {number} */ var refreshEvents = 0; /** * Draw the gadget onscreen now, and every minute in the future. */ function redrawPeriodically() { drawScreen(); var local_now = new Date(); var s = local_now.getSeconds(); var ms_until_next_min = (60 - s) * 1000; // Refresh events every 10 minutes if (refreshEvents++ % 10 == 9) { getNextEvents(); } window.setTimeout(redrawPeriodically, ms_until_next_min); } /** * Underline a particular element. * @param {Element} el The element to underline. */ function underline_on(el) { el.style.textDecoration = 'underline'; } /** * Make a particular element NOT underlined. * @param {Element} el The element to de-underline. */ function underline_off(el) { el.style.textDecoration = ''; } /** * Draw the next event on the screen. */ 
function drawScreen()
{ 
  var main = document.getElementById('main'); 
var now = (google.calendar.utils.getNow(timeOffset)).getTime(); 
var html = ''; 
var count = (storedEvents && storedEvents.length) || 0; 
for (var i = 0; i < count; ++i) 
{ 
  var e = storedEvents[i]; 
  if (e.allDay || e.status == 'declined' || google.calendar.utils.toDate(e.startTime).getTime() < now)
  { continue; }
var chipColor; 
var locationColor; 
if (e.palette) 
{ chipColor = e.palette.dark; locationColor = e.palette.lightest; } 
else { chipColor = "#999"; // Generic non-color locationColor = "#ddd"; // Generic ligher non-color } // borderline is a 1px high line above and below the chip to simulate // a notched corner
var borderLine = '<div class="chipborder" style="background-color:' + chipColor + ';">&nbsp;</div>'; html += getTimeToNow(e.startTime) + '<br>'; html += borderLine; html += '<div id="chip" style="background-color:' + chipColor + ';" onclick="clickChip()" onmouseover="underline_on(this)"' + ' onmouseout="underline_off(this)" title="' + getMsg('Open') + '">'; // Handle the empty title case // TODO - Use elipsis until getMsg('No_Subject') is translated. 
var title = e.title || '...'; 
html += '<div class="title">' + gadgets.util.escapeString(title) + '</div>'; if (e.location) { html += '<div class="location" style="color:' + locationColor + '">' + gadgets.util.escapeString(e.location) + '</div>'; } html += '</div>'; html += borderLine; // Add a spacer 
html += '<div style="height: 2px;line-height: 0"></div>'; curEventId = e.id; break; } 
if (!html) { // no events found
html = getMsg('None'); } 
main.innerHTML = html; gadgets.window.adjustHeight(); 
  
} /** * The user has clicked on the body. Show the current event onscreen. */ function clickChip() { if (curEventId) { google.calendar.showEvent(curEventId); } } </script> <div id=main>__MSG_Loading__</div> <script> /** * Retrieve the initial set of events and and set things up to do the same * periodically. */ 

function setupEventRetrieval() { // Ask the container for the next few events. getNextEvents(); // Request that we be called back when the date changes // and then re-fetch the next events. google.calendar.subscribeToDataChange(getNextEvents); // Kick off the drawing process.
redrawPeriodically(); 
  
} /** * The container has replied with the preferences * @param {Object} prefs The set of preferences. */
function getPrefsCallback(prefs) { // Store interesting user preferences. timeOffset = prefs.current_time_offset; // Continue initialization. setupEventRetrieval(); } // Start the initialization process. google.calendar.getPreferences(getPrefsCallback); 
