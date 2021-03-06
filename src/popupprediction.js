/*
	**This file is part of Privacy Butler <privacybutler.com>
	**Copyright (C) 2014* Olga Musayev & others
	*
	**Privacy Butler is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License version 3 as
  * published by the Free Software Foundation.
  *
  * Privacy Butler is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
  */
  
  
var backgroundPage = chrome.extension.getBackgroundPage();
var require = backgroundPage.require;
var imports = ["require", "isWhitelisted", "extractHostFromURL", "refreshIconAndContextMenu", "getAction", "getAllOriginsForTab", "console", "whitelistUrl", "removeFilter", "setupCookieBlocking", "teardownCookieBlocking", "moveCookiesToRealCookieStore", "moveCookiesToFakeCookieStore"];
for (var i = 0; i < imports.length; i++){
  window[imports[i]] = backgroundPage[imports[i]];
}


with(require("filterClasses"))
{
  this.Filter = Filter;
  this.RegExpFilter = RegExpFilter;
  this.BlockingFilter = BlockingFilter;
  this.WhitelistFilter = WhitelistFilter;
}
with(require("subscriptionClasses"))
{
  this.Subscription = Subscription;
  this.DownloadableSubscription = DownloadableSubscription;
  this.SpecialSubscription = SpecialSubscription;
}
var FilterStorage = require("filterStorage").FilterStorage;
var matcherStore = require("matcher").matcherStore;
var Utils = require("utils").Utils;
var userChoices = require("userchoices").userChoices;

var tab = null;

function init()
{
  console.log("Initializing popup.js");
  // Attach event listeners
  $("#answ_yes").click(doPride);
  $("#answ_maybe").click(giveDetails);
  $("#answ_no").click(doShame);
 
  $(document).ready(function () {
	$("#Prediction").show();
	$("#afterYESresponse").hide();
	$("#afterNOresponse").hide();
	$('#blockedResourcesContainer').hide();
	$("#answers").show();
	 
	$('#blockedResourcesContainer').on('change', 'input:radio', updateOrigin);
    $('#blockedResourcesContainer').on('mouseenter', '.tooltip', displayTooltip);
    $('#blockedResourcesContainer').on('mouseleave', '.tooltip', hideTooltip);
    $('#blockedResourcesContainer').on('click', '.userset .honeybadgerPowered', revertDomainControl);
  });
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabArray) {
		tab= tabArray[0];
  });
}
 
//}
$(init);

function doPride() {
  $("#Prediction").hide();
  $("#afterYESresponse").show();
  $("#afterNOresponse").hide();
  $("#answers").hide();
  $('#blockedResourcesContainer').hide();
  refreshIconAndContextMenu(tab);
 }

function giveDetails() {
  $("#Prediction").hide();
  $("#answers").hide();
  $("#blockedResourcesContainer").show();
  $('#blockedResourcesContainer').on('change', 'input:radio', updateOrigin);
  $('#blockedResourcesContainer').on('mouseenter', '.tooltip', displayTooltip);
  $('#blockedResourcesContainer').on('mouseleave', '.tooltip', hideTooltip);
  $('#blockedResourcesContainer').on('click', '.userset .honeybadgerPowered', revertDomainControl);
  refreshIconAndContextMenu(tab);
 }

function doShame() {
  $("#Prediction").hide();
  $("#afterYESresponse").hide();
  $("#afterNOresponse").show();
  $("#answers").hide();
  userChoices.removeChoice(tab.url);
  disableSecrecy(tab.id);
  refreshIconAndContextMenu(tab);
}

//disable secrecyBadger if set
function disableSecrecy(tabId) {
  $('.clicker').each(function() {
    var origin = $(this).attr("data-origin");
    var filter = "||" + origin + "^$third-party";
    var store = 'userRed';
	removeFilter(store, filter);
	var defaultAction = getAction(tabId,origin);
	$elm.removeClass('userset');
    var selectorId = "#"+ defaultAction +"-" + origin.replace(/\./g,'-');
    var selector =   $(selectorId);
    console.log('selector', selector);
    selector.click();
	$(this).removeClass('userset');
  })
}

function revertDomainControl(e){
  $elm = $(e.target).parent();
  console.log('revert to privacy badger control for', $elm);
  var origin = $elm.data('origin');
  var original_action = $elm.data('original-action');
  var stores = {'block': 'userRed', 
                'cookieblock': 'userYellow', 
                'noaction': 'userGreen'};
  var filter = "||" + origin + "^$third-party";
  var store = stores[original_action];
  removeFilter(store,filter);
  var tabId = parseInt($('#associatedTab').attr('data-tab-id'), 10);
  var defaultAction = getAction(tabId,origin);
  var selectorId = "#"+ defaultAction +"-" + origin.replace(/\./g,'-');
  var selector =   $(selectorId);
  console.log('selector', selector);
  selector.click();
  $elm.removeClass('userset');
  return false;
}

function toggleEnabled() {
  console.log("Refreshing icon and context menu");
  refreshIconAndContextMenu(tab);
}

// ugly helpers: not to be used!
function _addOriginHTML(origin, printable, action) {
  //console.log("Popup: adding origin HTML for " + origin);
  var classes = ["clicker","tooltip"];
  var feedTheBadgerTitle = '';
  if (action.indexOf("user") == 0) {
    feedTheBadgerTitle = "click to return control of this tracker to Privacy Badger"; 
    classes.push("userset");
    action = action.substr(4);
  }
  if (action == "block" || action == "cookieblock")
    classes.push(action);
  var classText = 'class="' + classes.join(" ") + '"';
  
  return printable + '<div ' + classText + '" data-origin="' + origin + '" tooltip="' + _badgerStatusTitle(action) + '" data-original-action="' + action + '"><div class="origin" >' + _trim(origin,30) + '</div>' + _addToggleHtml(origin, action) + '<div class="honeybadgerPowered tooltip" tooltip="'+ feedTheBadgerTitle + '"></div><img class="tooltipArrow" src="/icons/badger-tb-arrow.png"><div class="tooltipContainer"></div></div>';
}

function _trim(str,max){
  if(str.length >= max){
    return str.slice(0,max-3)+'...';
  } else {
    return str;
  }
}

function _badgerStatusTitle(action){
  var prefix = "";

  var statusMap = { 
    block:        "This tracker is blocked, slide to unblock tracker or block cookies.",
    cookieblock:  "This tracker's cookies are blocked, slide to block or unblock tracker.",
    noaction:     "This domain is unblocked, slide to block entirely or block cookies."
  }

  return prefix + statusMap[action];
}

function _addToggleHtml(origin, action){
  var idOrigin = origin.replace(/\./g,'-');
  var output = "";
  output += '<div class="switch-container ' + action + '">';
  output += '<div class="switch-toggle switch-3 switch-candy">'
  output += '<input id="block-' + idOrigin + '" name="' + origin + '" value="0" type="radio" '+ _checked('block',action)+ '><label tooltip="click here to block this tracker entirely" class="actionToggle" for="block-' + idOrigin + '" data-origin="' + origin + '" data-action="block"></label>';
  output += '<input id="cookieblock-' + idOrigin + '" name="' + origin + '" value="1" type="radio" '+ _checked('cookieblock',action)+ '><label tooltip="click here to block this tracker from setting cookies" class="actionToggle" for="cookieblock-' + idOrigin + '" data-origin="' + origin + '" data-action="cookieblock"></label>';
  output += '<input id="noaction-' + idOrigin + '" name="' + origin + '" value="2" type="radio" '+ _checked('noaction',action)+ '><label tooltip="click here to allow this tracker" class="actionToggle" for="noaction-' + idOrigin + '" data-origin="' + origin + '" data-action="noaction"></label>';
  output += '<a><img src="/icons/badger-slider-handle.png"></a></div></div>';
  return output;
}
function _checked(name, action){
  if(name == action){
    return 'checked';
  } else {
    return '';
  }
};
function toggleBlockedStatus(elt,status) {
  console.log('toggle blocked status', elt, status);
  if(status){
    $(elt).removeClass("block cookieblock noaction").addClass(status);
    $(elt).addClass("userset");
    return;
  }

  var originalAction = elt.getAttribute('data-original-action');
  if ($(elt).hasClass("block"))
    $(elt).toggleClass("block");
  else if ($(elt).hasClass("cookieblock")) {
    $(elt).toggleClass("block");
    $(elt).toggleClass("cookieblock");
  }
  else 
    $(elt).toggleClass("cookieblock");
  if ($(elt).hasClass(originalAction) || (originalAction == 'noaction' && !($(elt).hasClass("block") || 
                                                                            $(elt).hasClass("cookieblock"))))
    $(elt).removeClass("userset");
  else
    $(elt).addClass("userset");
}

function refreshPopup(tabId) {
  console.log("Refreshing popup for tab id " + tabId);
  var origins = getAllOriginsForTab(tabId);
  if (!origins || origins.length == 0) {
    document.getElementById("blockedResources").innerHTML = "Could not detect any tracking cookies.";
    return;
  }
  // old text that could go in printable: 
  // "Suspicious 3rd party domains in this page.  Red: we've blocked it; 
  // yellow: only cookies blocked; green: no blocking yet";
  var printable = '<div id="associatedTab" data-tab-id="' + tabId + '"></div>';
  for (var i=0; i < origins.length; i++) {
    var origin = origins[i];
    // todo: gross hack, use templating framework
    printable = _addOriginHTML(origin, printable, getAction(tabId, origin));
  }
  document.getElementById("blockedResources").innerHTML = printable;
  console.log('switch-container' , $('.switch-container'));
  $('.switch-toggle').each(function(){
    var radios = $(this).children('input');
    var value = $(this).children('input:checked').val();
    var userHandle = $(this).children('a');
    var slider = $("<div></div>").slider({
      min: 0,
      max: 2,
      value: value,
      create: function(event, ui){
        $(this).children('.ui-slider-handle').css('margin-left', -16 * value + 'px');
      },
      slide: function(event, ui) {
        radios.filter("[value=" + ui.value + "]").click();
      },
      stop: function(event, ui){
        $(ui.handle).css('margin-left', -16 * ui.value + "px")
      },
    }).appendTo(this);
    radios.change(function(){
      slider.slider("value",radios.filter(':checked').val());
    });
  });
  console.log("Done refreshing popup");
}

function reloadPage() {
  // todo: fill in
  console.log("Reload page called");
}

function updateOrigin(event){
  var $elm = $('label[for="' + event.currentTarget.id + '"]');
  console.log('updating origin for', $elm);
  var $switchContainer = $elm.parents('.switch-container').first();
  var $clicker = $elm.parents('.clicker').first();
  var action = $elm.data('action');
  $switchContainer.removeClass('block cookieblock noaction').addClass(action);
  toggleBlockedStatus($clicker, action);
  $clicker.attr('tooltip', _badgerStatusTitle(action));
  $clicker.children('.tooltipContainer').html(_badgerStatusTitle(action));
}

var tooltipDelay = 300;

function displayTooltip(event){
  var $elm = $(event.currentTarget);
  var displayTipTimer = setTimeout(function(){
    if($elm.attr('tooltip').length == 0){ return; }
    var $container = $elm.closest('.clicker').children('.tooltipContainer');
    $container.text($elm.attr('tooltip'));
    $container.show();
    $container.siblings('.tooltipArrow').show();
  },tooltipDelay);
  $elm.on('mouseleave', function(){clearTimeout(displayTipTimer)}); 
}

function hideTooltip(event){
  var $elm = $(event.currentTarget);
  var hideTipTimer = setTimeout(function(){
    var $container = $elm.closest('.clicker').children('.tooltipContainer');
    if($container.is(':hidden')){return;}
    $container.text('');
    $container.hide();
    $container.siblings('.tooltipArrow').hide();
  },tooltipDelay);
  $elm.on('mouseenter',function(){clearTimeout(hideTipTimer)});
}

function saveAction(userAction, origin) {
  var allUserActions = {'block': 'userRed', 
                        'cookieblock': 'userYellow', 
                        'noaction': 'userGreen'};
  console.log("Saving user action " + userAction + " for " + origin);
  for (var action in allUserActions) {
    var filter = Filter.fromText("||" + origin + "^$third-party");
    if (action == userAction){
      console.log('adding filter', filter, 'to', action);
      FilterStorage.addFilter(filter, FilterStorage.knownSubscriptions[allUserActions[action]]);
    } else {
      console.log('removing filter', filter, 'from', action);
      FilterStorage.removeFilter(filter, FilterStorage.knownSubscriptions[allUserActions[action]]);
    }
  }
  console.log("Finished saving action " + userAction + " for " + origin);
  
  //remove cookies if a user has just cookieblocked
  if(userAction == 'cookieblock'){
    setupCookieBlocking(origin);
  }

  //re add any cookies if the user has unblocked
  if(userAction === 'noaction'){
    console.log("Tearing Down cookie blocking for", origin);
    teardownCookieBlocking(origin);
  }

  // todo: right now we don't determine whether a reload is needed
  return true;
}

function syncSettingsDict(settingsDict) {
  // track whether reload is needed: only if things are being unblocked
  var reloadNeeded = false;
  var tabId = parseInt($('#associatedTab').attr('data-tab-id'), 10);
  // we get the blocked data again in case anything changed, but the user's change when
  // closing a popup is authoritative and we should sync the real state to that
  for (var origin in settingsDict) {
    var userAction = settingsDict[origin];
    if (saveAction(userAction, origin))
      reloadNeeded = true; // js question: slower than "if (!reloadNeeded) reloadNeeded = true"?
                           // would be fun to check with jsperf.com
  }
  console.log("Finished syncing. Now refreshing popup.");
  // the popup needs to be refreshed to display current results
  refreshPopup(tabId);
  return reloadNeeded;
}
function getCurrentClass(elt) {
  if ($(elt).hasClass("block"))
    return "block";
  else if ($(elt).hasClass("cookieblock"))
    return "cookieblock";
  else
    return "noaction";
}

function buildSettingsDict() {
  var settingsDict = {};
  $('.clicker').each(function() {
    var origin = $(this).attr("data-origin");
    if ($(this).hasClass("userset") && getCurrentClass(this) != $(this).attr("data-original-action")) {
      // todo: DRY; same as code above, break out into helper
      if ($(this).hasClass("block"))
        settingsDict[origin] = "block";
      else if ($(this).hasClass("cookieblock"))
        settingsDict[origin] = "cookieblock";
      else
        settingsDict[origin] = "noaction";
    }
  });
  return settingsDict;
}

// syncs the user-selected cookie blocking options, etc
function syncUISelections() {
  var settingsDict = buildSettingsDict();
  console.log("Sync of userset options: " + JSON.stringify(settingsDict));
  if (syncSettingsDict(settingsDict))
    reloadPage();
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.tabs.getSelected(null, function(tab) {
    refreshPopup(tab.id);
  });
});
window.addEventListener('unload', function() {
  console.log("Starting to unload popup");
  syncUISelections();
  console.log("unloaded popup");
});

