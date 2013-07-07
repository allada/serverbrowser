/**
* Tree object used to display file system tree
* @param config Example: {
*   owner: {owner dom node to place newly created tree},
*   onClick: {custom click event handler when each node is clicked},
*   onNodesLoaded: {custom function to be executed when child nodes are loaded}
* }
*/
function FileTree(config){
	var rootNode, me = this;
	/**
	* Reference to the dom tree
	*/
	this.tree = document.createElement('div');
	/**
	* Owner dom node to bind new tree to
	*/
	this.owner = config.owner;
	/**
	* Custom click handler. Passes node clicked as first paramenter.
	*/
	this.handleClick = config.onClick;
	/**
	* Custom function to be executed when children are loaded into node.
	* First parameter is the node the children where loaded into.
	* Second parameter is if it was with an error.
	*/
	this.handleNodesLoaded = config.onNodesLoaded;


	this.tree.className = 'tree-object';
	/**
	* Click event function. Identified which node was clicked so it does not need to bind to each node,
	* instead it waits for it to bubble up then looks back down the dom for which node was clicked.
	* @param event
	*/
	function onClickFn(event){
		event = event || window.event;
		var el = event.srcElement || event.target,
			node;
		while(el.parentNode){
			if(el.className.split(' ').indexOf('tree-node') != -1){
				if(node = TreeNode.nodeIndex[el.id]){
					node.toggle();
				}else{
					// this should never happen, maybe bug???
				}
				break;
			}
			el = el.parentNode;
		}
	}
	if(this.tree.addEventListener){
		this.tree.addEventListener('click', onClickFn);
	}else{
		this.tree.attachEvent('onclick', onClickFn);
	}
	/**
	* Adds node to tree/dom
	* @param domNode Dom element to place into dom.
	* @param beforeDom Loads dom node before this object, null if root object
	*/
	this.addNode = function (domNode, beforeNode){
		return this.tree.insertBefore(domNode, beforeNode);
	};
	/**
	* Removes node from tree/dom
	* @param domNode Dom node object to remove.
	*/
	this.removeNode = function (domNode){
		return this.tree.removeChild(domNode);
	}
	// Loads root dom
	rootNode = new TreeNode({
		tree: this,
		loc: '/',
		isFile: false,
		parentNode: null
	});
	this.rootNode = rootNode;
	rootNode.domNode = this.addNode(rootNode.createDomEl(), null);
	this.tree = this.owner.appendChild(this.tree);
}