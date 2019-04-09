sap.ui.define([
		"sap/ui/base/Object",
		"sap/m/MessageBox"
	], function (UI5Object, MessageBox) {
		"use strict";

		return UI5Object.extend("br.com.idxtecCotacaoMoeda.services.ErrorHandler", {

			constructor : function (oComponent) {
				this._oComponent = oComponent;
				this._oModel = oComponent.getModel();
				this._bMessageOpen = false;
				this._sErrorText = "Desculpe, ocorreu um erro técnico! Por favor, tente novamente mais tarde.";

				this._oModel.attachMetadataFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					if (this._oModel.hasPendingChanges() || this._oModel.hasPendingRequests()) {
						this._oModel.resetChanges();
					}	
					this._showServiceError(oParams.response.responseText);
				}, this);

				this._oModel.attachRequestFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					if (this._oModel.hasPendingChanges() || this._oModel.hasPendingRequests()) {
						this._oModel.resetChanges();
					}	
					if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)) {
						this._showServiceError(oParams.response);
					}
					
				}, this);
			},

			_showServiceError : function (sDetails) {
				if (this._bMessageOpen) {
					return;
				}
				this._bMessageOpen = true;
				MessageBox.error(
					this._sErrorText,
					{
						id : "serviceErrorMessageBox",
						details : sDetails,
						styleClass : this._oComponent.getContentDensityClass(),
						actions : [MessageBox.Action.CLOSE],
						onClose : function () {
							this._bMessageOpen = false;
						}.bind(this)
					}
				);
			}
		});
	}
);