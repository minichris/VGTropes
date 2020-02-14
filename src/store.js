import { createStore } from 'redux';
import getExampleData from './rete/exampledata.js';
import undoable, { excludeAction } from 'redux-undo';
import { ActionCreators as UndoActionCreators } from 'redux-undo'
import {getPageType} from './browser';
import getFilterTemplateFromSearch from './rete/getFilterTemplateFromSearch.js';

export function updateFromSearch(searchTerm){
	let pageType = getPageType(searchTerm);

	return{
		type: 'SEARCH',
		filters: getFilterTemplateFromSearch(pageType, searchTerm),
		page: searchTerm,
		browserVisibility: !searchTerm.includes("GenericSearch:")
	}
}

export function changeFilters(filters) {
	return {
		type: 'CHANGE_SET',
		filters
	}
}

export function changeDisplayedBrowserPage(page) {
	return {
		type: 'CHANGE_PAGE',
		page
	}
}

export function setBrowserVisibility(browserVisibility){
	return {
		type: 'BROWSER_SET_VISIBILITY',
		browserVisibility
	}
}

const initialState = {
	filters: getExampleData(),
	page: "Special:GDPVis",
	browserVisibility: true
}

function gdpReducer(state = initialState, action) {
	switch(action.type){
		case 'CHANGE_SET':
			return Object.assign({}, state, {
				filters: action.filters
			});
		case 'CHANGE_PAGE':
			return Object.assign({}, state, {
				page: action.page
			});
		case 'BROWSER_SET_VISIBILITY':
			return Object.assign({}, state, {
				browserVisibility: action.browserVisibility
			});
		case 'SEARCH':
			return Object.assign({}, state, {
				filters: action.filters,
				page: action.page,
				browserVisibility: action.browserVisibility
			});
		default:
			return state;
	}
}

const undoableGdpReducer = undoable(
	gdpReducer, 
	{filter: excludeAction([
		'BROWSER_SET_VISIBILITY'
	])
});

const store = createStore(undoableGdpReducer);
console.log(store.getState());
const unsubscribe = store.subscribe(() => console.log(store.getState()));
store.dispatch(UndoActionCreators.undo());
store.dispatch(UndoActionCreators.redo());
store.dispatch(changeDisplayedBrowserPage("World of Warcraft"));
//unsubscribe();
export default store;