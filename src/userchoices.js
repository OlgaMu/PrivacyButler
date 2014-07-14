/*
  * This file is part of Privacy Butler <privacybutler.com>
  * Copyright (C) 2014- Olga Musayev & others
  *
  *Privacy Butler is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License version 3 as
  * published by the Free Software Foundation.
  *
  * Privacy Butler is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with Privacy Butler.  If not, see <http://www.gnu.org/licenses/>.
 */

var Utils = require("utils").Utils;
require.scopes["userchoices"] = (function() {

var exports = {};

var userChoices = exports.userChoices = {
  userchoices: {},
  updateChoice: function(){
	console.log("updating user choices");
    chrome.storage.local.get('userchoices', function(items){
      if(!items.userchoices){
        chrome.storage.local.set({userchoices: self.userchoices});
        return;
      }
      this.userchoices = items.userchoices;
    });
  },
  getChoice: function(url){
	console.log("getting user choice");
    if(this.userchoices[url]){
      return this.userchoices[url];
    } else {
      return {};
    }
  },
  setChoice: function(url, newChoice){
	console.log("saving user choice");
    if(!this.userchoices[url]){
      this.userchoices[url] = {};
    }
	this.userchoices[url] = newChoice;
    chrome.storage.local.set({userchoices: this.userchoices});
  },
  removeChoice: function(url){
	console.log("removing user choice");
    if(!this.userchoices[url]){
      return;
    } else {
      delete this.userchoices[url]
    }
    chrome.storage.local.set({userchoices: this.userchoices});
  },

  sendChoiceToServer: function(uuid, siteurl, choice) {
	console.log("trying to send choice to server");
	var reqData= []
	reqData.push("site="+siteurl);
	reqData.push("user="+uuid);
	reqData.push("choice="+choice);
	var params = reqData.join("&");

	var xhr = new XMLHttpRequest();
	xhr.open("POST", "", true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			if (xhr.status == 200){
				console.log("Successfully submitted params: " + params);
			} else {
				console.log("Error submitting params: " + params);
			}
		}
	}
	xhr.send(params);
  },
  receivePredictionsFromServer: function(uuid) {
	var url = "app-engine.com?uid=" +uuid;
	Utils.xhrRequest(url,function(err,response){
		if(err){
			console.error('Could not fetch prediction', url, err.status, err.message);
			return;
		}
		
		data = JSON.parse(response);
		predictions = data[pio_iids];
		
		for (var i = 0; i < predictions.length; i++)
			this.userchoices[predictions] = 3;
			
		chrome.storage.local.set({userchoices: this.userchoices});
	})
  }
}
return exports; 
})(); 
