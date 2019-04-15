sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"br/com/idxtecCotacaoMoeda/helpers/MoedaHelpDialog",
	"br/com/idxtecCotacaoMoeda/services/Session"
], function(Controller, MessageBox, JSONModel, Filter, FilterOperator, MoedaHelpDialog, Session) {
	"use strict";

	return Controller.extend("br.com.idxtecCotacaoMoeda.controller.CotacaoMoeda", {
		onInit: function(){
			var oJSONModel = new JSONModel();
			
			this._operacao = null;
			this._sPath = null;

			this.getOwnerComponent().setModel(oJSONModel, "model");
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
			this.getModel().attachMetadataLoaded(function(){
				var oFilter = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
				var oView = this.getView();
				var oTable = oView.byId("tableCotacao");
				var oColumn = oView.byId("columnMoeda");
				
				oTable.sort(oColumn);
				oView.byId("tableCotacao").getBinding("rows").filter(oFilter, "Application");
			});
		},
		
		filtraCotacao: function(oEvent){
			var sQuery = oEvent.getParameter("query");
			var oFilter1 = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
			var oFilter2 = new Filter("MoedaDetails/Nome", FilterOperator.Contains, sQuery);
			
			var aFilters = [
				oFilter1,
				oFilter2
			];

			this.getView().byId("tableCotacao").getBinding("rows").filter(aFilters, "Application");
		},
		
		moedaReceived: function(){
			this.getView().byId("moeda").setSelectedKey(this.getModel("model").getProperty("/Moeda"));
		},
		
		handleSearchMoeda: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			MoedaHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		onRefresh: function(e){
			var oModel = this.getOwnerComponent().getModel();
			oModel.refresh(true);
			this.getView().byId("tableLote").clearSelection();
		},
		
		onIncluir: function(){
			var oDialog = this._criarDialog();
			var oTable = this.byId("tableCotacao");
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oViewModel = this.getModel("view");
			
			oViewModel.setData({
				titulo: "Inserir Cotação"
			});
			
			this._operacao = "incluir";
			
			this.getView().byId("moeda").setValue("");
			
			var oNovoCotacao = {
				"Id": 0,
				"Data": new Date(),
				"Cotacao": 0.00,
				"Moeda": "",
				"Empresa" : Session.get("EMPRESA_ID"),
				"Usuario": Session.get("USUARIO_ID"),
				"EmpresaDetails": { __metadata: { uri: "/Empresas(" + Session.get("EMPRESA_ID") + ")"}},
				"UsuarioDetails": { __metadata: { uri: "/Usuarios(" + Session.get("USUARIO_ID") + ")"}}
			};
			
			oJSONModel.setData(oNovoCotacao);
			
			oTable.clearSelection();
			oDialog.open();
		},
		
		onEditar: function(){
			var oDialog = this._criarDialog();
			var oTable = this.byId("tableCotacao");
			var nIndex = oTable.getSelectedIndex();
			var oModel = this.getOwnerComponent().getModel();
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oViewModel = this.getModel("view");
			
			oViewModel.setData({
				titulo: "Editar Cotação"
			});
			
			this._operacao = "editar";
			
			this.getView().byId("moeda").setValue("");
			
			if(nIndex === -1){
				MessageBox.warning("Selecione uma cotação da tabela!");
				return;
			}
			
			var oContext = oTable.getContextByIndex(nIndex);
			this._sPath = oContext.sPath;
			
			oModel.read(oContext.sPath, {
				success: function(oData){
					oJSONModel.setData(oData);
				}
			});
			
			oTable.clearSelection();
			oDialog.open();
		},
		
		onRemover: function(){
			var that = this;
			var oTable = this.byId("tableCotacao");
			var nIndex = oTable.getSelectedIndex();
			
			if(nIndex === -1){
				MessageBox.warning("Selecione uma cotação da tabela!");
				return;
			}
			
			MessageBox.confirm("Deseja remover essa cotação?", {
				onClose: function(sResposta){
					if(sResposta === "OK"){
						MessageBox.success("Cotação removida com sucesso!");
						that._remover(oTable, nIndex);
					} 
				}      
			});
		},
		
		_remover: function(oTable, nIndex){
			var oModel = this.getOwnerComponent().getModel();
			var oContext = oTable.getContextByIndex(nIndex);
			
			oModel.remove(oContext.sPath,{
				success: function(){
					oModel.refresh(true);
					oTable.clearSelection();
				}
			});
		},
		
		onSaveDialog: function(){
			if (this._checarCampos(this.getView())) {
				MessageBox.warning("Preencha todos os campos obrigatórios!");
				return;
			}
			if(this._operacao === "incluir"){
				this._createCotacao();
				this.getView().byId("CotacaoMoedaDialog").close();
			} else if(this._operacao === "editar"){
				this._updateCotacao();
				this.getView().byId("CotacaoMoedaDialog").close();
			} 
		},
		
		onCloseDialog: function(){
			var oModel = this.getOwnerComponent().getModel();
			
			if(oModel.hasPendingChanges()){
				oModel.resetChanges();
			}
			
			this.byId("CotacaoMoedaDialog").close();
		},
		
		_getDados: function(){
			var oJSONModel = this.getOwnerComponent().getModel("model");
			
			var oDados = oJSONModel.getData();

			oDados.MoedaDetails = {
				__metadata: {
					uri: "/Moedas('" + oDados.Moeda + "')"
				}
			};
			
			return oDados;
		},
		
		_createCotacao: function(){
			var oModel = this.getOwnerComponent().getModel();
			
			oModel.create("/CotacaoMoedas", this._getDados(), {
				success: function() {
					MessageBox.success("Cotação inserida com sucesso!");
					oModel.refresh(true);
				}
			});
		},
		
		_updateCotacao: function(){
			var oModel = this.getOwnerComponent().getModel();
			
			oModel.update(this._sPath, this._getDados(), {
				success: function(){
					MessageBox.success("Cotação alterada com sucesso!");
					oModel.refresh(true);
				}
			});
		},
		
		_criarDialog: function(){
			var oView = this.getView();
			var oDialog = this.byId("CotacaoMoedaDialog"); 
			
			if(!oDialog){
				oDialog = sap.ui.xmlfragment(oView.getId(), "br.com.idxtecCotacaoMoeda.view.CotacaoMoedaDialog", this);
				oView.addDependent(oDialog);
			}
			
			return oDialog;
		},
		
		_checarCampos: function(oView){
			if(oView.byId("data").getDateValue() === "" || oView.byId("cotacao").getValue() === ""){
				return true;
			} else{
				return false; 
			}
		},
		
		getModel: function(sModel){
			return this.getOwnerComponent().getModel(sModel);
		}
	});
});