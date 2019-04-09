jQuery.sap.require("jquery.sap.storage");
sap.ui.define([
], function(){
	"use strict";
	
	return jQuery.sap.storage(jQuery.sap.storage.Type.session);
});