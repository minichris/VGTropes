import React from "react";
import $ from 'jquery';

import Rete from "rete";
import ConnectionPlugin from 'rete-connection-plugin';
import AlightRenderPlugin from 'rete-alight-render-plugin';
import ContextMenuPlugin from 'rete-context-menu-plugin';
import AreaPlugin from 'rete-area-plugin';
import ReactRenderPlugin from 'rete-react-render-plugin';
import LifecyclePlugin from 'rete-lifecycle-plugin';

import CustomNode from './nodetemplate.js';

import components from './nodes';
import './style.css';

export function toggleFiltersPanel(){
	$("#FilterPanel").toggleClass('out');
	if($("#FilterPanel").hasClass('out')){
		$("#ShowFiltersButton").addClass("btn-danger");
		$("#ShowFiltersButton").removeClass("btn-light");
		$("#ShowFiltersButton").attr("title", "Close the filters panel");
		$("#ShowFiltersButton").text("X");
		logger.info("Filter panel opened (possibly automatic) @ " + Math.round((new Date()).getTime() / 1000));
	}
	else{
		$("#ShowFiltersButton").addClass("btn-light");
		$("#ShowFiltersButton").removeClass("btn-danger");
		$("#ShowFiltersButton").attr("title", "Open the filters panel");
		$("#ShowFiltersButton").text("Change Filters");
		logger.info("Filter panel closed (possibly automatic) @ " + Math.round((new Date()).getTime() / 1000));
	}
}

export function closeFiltersPanel(){
	$("#FilterPanel").removeClass('out');
	$("#ShowFiltersButton").addClass("btn-light");
	$("#ShowFiltersButton").removeClass("btn-danger");
	$("#ShowFiltersButton").text("Change Filters");
}

export default class ReteFilterModule extends React.Component {
	constructor(props){
		super(props);
	}
	
	initialize(data){
		this.engine.process(data);
		this.editor.fromJSON(data).then(() => {
			this.editor.view.resize();
			this.editor.trigger('process');
		});
	}
	
	getEditorAsJSON(){
		return this.editor.toJSON();
	}

	filtersButtonClick(){
		if($("#FilterPanel").hasClass('out')){
			logger.info("User manually closed filter panel @ " + Math.round((new Date()).getTime() / 1000));
		}
		else{
			logger.info("User manually opened filter panel @ " + Math.round((new Date()).getTime() / 1000));
		}
		toggleFiltersPanel();
	}
	
	componentDidMount(){
		this.engine = new Rete.Engine('tasksample@0.1.0');

		components.list.map(c => {
			this.engine.register(c);
		});
		
		this.editor = new Rete.NodeEditor('tasksample@0.1.0', document.querySelector('#rete'));
		this.editor.use(AlightRenderPlugin);
		this.editor.use(ConnectionPlugin);
		this.editor.use(ContextMenuPlugin, {
			nodeItems: node => {
				if (node.userimmutable) {
					return {
						'Delete': false,
						'Clone': false,
						'Cannot be deleted or cloned'(){}
					};
				}
				else{
					return {};
				}
			}
		});
		this.editor.use(LifecyclePlugin);
		this.editor.use(AreaPlugin, {
			snap: false,
			scaleExtent: { min: 0.25, max: 1 },
			translateExtent: { width: 6000, height: 3500 }
		});
		this.editor.use(ReactRenderPlugin, {
			component: CustomNode
		});
		
		components.list.map(c => {
			this.editor.register(c);
		});

		this.editor.on('process connectioncreated', async () => {
			//ignoring noderemoved, nodecreate, connectionremoved
			await this.engine.abort();
			this.currentEditorJSON = this.editor.toJSON();
			if(this.currentEditorJSON != this.prevEditorJSON){
				await this.engine.process(this.editor.toJSON());
			}
		});
		
		this.editor.on('nodetranslate', function(){
			if(document.activeElement.parentElement.className == "controlInner"){
				return false;
			}
		});
		
		let ourEditor = this.editor;
		//custom function for nodes to prevent them from wanting to process every control change even when not completely plugged in
		Rete.Node.prototype.processControlChange = function(){
			if(this.inputs.size + this.outputs.size == this.getConnections().length){
				ourEditor.trigger("process");
			}
		}
		
		//adds delete button to delete node support
		let selfEditor = this.editor;
		$(document).keyup(function (e) {
			if(e.keyCode == 46 && $("#FilterPanel").hasClass("out")) {
				selfEditor.nodes.forEach(function(node){
					if(selfEditor.selected.list.includes(node) && !node.userimmutable){
						selfEditor.removeNode(node);
					}
				});
			}
		});
		
	}
	
	render(){
		return (
			<div id="VisualFilterModule">
				<button onClick={this.filtersButtonClick.bind(this)} title="Open the filters panel" id="ShowFiltersButton" className="btn btn-light" data-toggle="toggle" data-target="#FilterPanel">Change Filters</button>
				<div id="FilterPanel">
					<div id="FilterPanelHeader">Filters Panel</div>
					<div id="rete"></div>
					<div id="FilterPanelInfo">
					Left click and drag the background to pan. 
					Left click and drag the filters to move. 
					Right click the background to add new filter nodes.
					Right click the filters to delete or clone the filter nodes.
					Purple connections are pattern arrays and green connections are game arrays. Grey connections are wildcard arrays.
					Filters connections need to be of the same type to be connected, unless its a grey wildcard connection which will accept any type.
					The filters will only update if something is plugged into the output node.
					</div>
				</div>
			</div>
		);
	}
}