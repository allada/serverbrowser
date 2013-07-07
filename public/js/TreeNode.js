/**
* Node class used to identify and track each node in the tree.
* @param config Example: {
*   tree: {Tree object node should be tied too},
*   name: {name to display on node},
*   loc: {dir location of node},
*   linkLoc: {if it's symbloic link it displays this text after it and sets class},
*   isFile: {bool if it's file or directory},
*   parentNode: {parent of node or null if root},
* }
*/
function TreeNode(config){
	/**
	* Tree associated with node
	*/
	this.tree = config.tree;
	/**
	* Generated ID for node so you can reference it from the dom to class and vice-versa
	*/
	this.id = 'tree-node-'+(TreeNode.idCounter++);
	/**
	* Once the dom node is generated it's stored here
	*/
	this.domNode = null;
	/**
	* Name to display in dom
	*/
	this.name = config.name;
	/**
	* Real location of node
	*/
	this.loc = config.loc;
	/**
	* If symbolic link it'll contain the reference to where the link is
	*/
	this.linkLoc = config.linkLoc || '';
	/**
	* If is file or directory
	*/
	this.isFile = config.isFile;
	/**
	* Child nodes if loaded and is directory, null otherwise
	*/
	this.nodes = null;
	/**
	* Parent node or null if it's root
	*/
	this.parent = config.parentNode;
	/**
	* If it's currently loading this is the reference to the AJAX object
	*/
	this.curReq = null;
	TreeNode.nodeIndex[this.id] = this;

	/**
	* Toggles, loads, and unloads node based on it's current state
	*/
	this.toggle = function (){
		this.tree.handleClick && this.tree.handleClick(this);
		if(this.curReq){
			var iconNode = this.domNode.children[this.domNode.children.length-2];
			iconNode.className = iconNode.className.replace(/(^|\s)tree-node-icon-loading(\s|$)/, ' ').trim();
			this.tree.handleNodesLoaded && this.tree.handleNodesLoaded(this, true);
			this.curReq.close();
			this.curReq = null;
			this.unloadChildren();
		}else if(!this.isFile && this.nodes === null){
			this.loadChildNodes();
		}else if(!this.isFile && this.nodes instanceof Array){
			this.unloadChildren();
		}
	};
	/**
	* Load children nodes if it's a directory
	*/
	this.loadChildNodes = function (){
		if(this.isFile){
			return false;
		}
		if(this.curReq){
			this.curReq.close();
			this.curReq = null;
		}
		var iconNode = this.domNode.children[this.domNode.children.length-2];
		iconNode.className = iconNode.className.replace(/(^|\s)tree-node-icon-loading(\s|$)/, ' ').trim();
		iconNode.className += ' tree-node-icon-loading';
		this.curReq = new AJAX({
			url: 'reader.php?node='+encodeURIComponent(this.loc),
			scope: this,
			callback: function (reqObj, event){
				var data;
				try{
					data = JSON.parse(reqObj.responseText);
				}catch(e){
					log('error receiving data from server');
					this.curReq.close();
					this.curReq = null;
					iconNode.className = iconNode.className.replace(/(^|\s)tree-node-icon-loading(\s|$)/, ' ').trim();
					this.tree.handleNodesLoaded && this.tree.handleNodesLoaded(this, true);
					return;
				}
				if(data.error){
					log(data.error);
				}else{
					this.loadChildren(data.nodes);
				}
				this.curReq.close();
				this.curReq = null;
				iconNode.className = iconNode.className.replace(/(^|\s)tree-node-icon-loading(\s|$)/, ' ').trim();
				this.tree.handleNodesLoaded && this.tree.handleNodesLoaded(this, false);
			}
		});
		this.setExpanded(true);
	};
	/**
	* Expands or collapses the node
	* @param bool expanded True to expand, False to collapse
	*/
	this.setExpanded = function(expanded){
		var domNode = this.domNode.children[this.domNode.children.length-3],
			classes = domNode.className.split(' '),
			len = classes.length, i = 0, newClasses = [];
		if(expanded){
			this.domNode.className = this.domNode.className.replace(/(\s|^)(tree-is-folder-expanded|tree-is-folder-not-expanded)(\s|$)/, ' ').trim() + ' tree-is-folder-expanded';
		}else{
			this.domNode.className = this.domNode.className.replace(/(\s|^)(tree-is-folder-expanded|tree-is-folder-not-expanded)(\s|$)/, ' ').trim() + ' tree-is-folder-not-expanded';
		}
		for(;i<len;i++){
			switch(classes[i]){
				case 'tree-node-expand':
				case 'tree-node-expanded':
					if(!expanded){
						newClasses.push('tree-node-expand');
					}else{
						newClasses.push('tree-node-expanded');
					}
					break;
				case 'tree-node-expand-last':
				case 'tree-node-expanded-last':
					if(!expanded){
						newClasses.push('tree-node-expand-last');
					}else{
						newClasses.push('tree-node-expanded-last');
					}
					break;
				default:
					newClasses.push(classes[i]);
			}
		}
		domNode.className = newClasses.join(' ');
	};
	/**
	* Internal function used to load children into dom
	* @param TreeNode[] nodes Array of TreeNode objects to load under current node
	*/
	this.loadChildren = function(nodes){
		if(nodes === null){
			return false;
		}
		var len = nodes.length,
			i = 0, node;
		if(this.nodes === null){
			this.nodes = [];
		}else{
			this.unloadChildren();
			this.nodes = [];
		}
		for(;i<len;i++){
			node = nodes[i];
			node.tree = this.tree;
			node.parentNode = this;
			node = new TreeNode(node);
			this.nodes.unshift(node);
			node.domNode = this.tree.addNode(node.createDomEl(), this.domNode.nextSibling);
		}
	};
	/**
	* Unloads all children recrusively
	*/
	this.unloadChildren = function (){
		if(this.nodes instanceof Array){
			var i=0, len = this.nodes.length;
			while(this.nodes.length){
				this.nodes[0].unload();
			}
			this.nodes = null;
		}
		this.setExpanded(false);
	};
	/**
	* Unloads current node and children recrusively
	*/
	this.unload = function (){
		if(this.nodes instanceof Array){
			this.unloadChildren();
		}
		if(this.domNode){
			this.tree.removeNode(this.domNode);
		}
		if((parentIndex = this.parent.nodes.indexOf(this)) != -1){
			this.parent.nodes.splice(parentIndex, 1);
		}
		delete TreeNode.nodeIndex[this.id];
		if(this.curReq){
			this.curReq.close();
			this.curReq = null;
		}
		return true;
	};
	/**
	* Creates dom node and places it into dom
	*/
	this.createDomEl = function(){
		var div = document.createElement('div'),
			classes = ['tree-node'],
			index=0, curNode, divs = [], curDiv, iconDiv, fileType;
		if(this.isFile){
			classes.push('tree-is-file');
		}else{
			classes.push('tree-is-folder-not-expanded');
		}
		if(this.linkLoc){
			classes.push('tree-is-symbolic');
		}else{
			classes.push('tree-not-symbolic');
		}
		div.className = classes.join(' ');
		div.id = this.id;
		curNode = this;

		curDiv = document.createElement('span');
		curDiv.appendChild(document.createTextNode((this.name || this.loc) + (this.linkLoc?' -> '+this.linkLoc:'')))
		curDiv.className = 'tree-inner-link' + (this.linkLoc?' text-node-is-symbolic':'');
		divs.push(curDiv);

		curDiv = document.createElement('div');
		iconDiv = document.createElement('div');
		if(curNode.isFile){
			if(!curNode.parent || curNode.parent.nodes.indexOf(curNode) == curNode.parent.nodes.length-1){
				// is last in cur tree (dont continue line down)
				curDiv.className = 'tree-node-spacer tree-node-elbow-last';
			}else{
				// normal down and right
				curDiv.className = 'tree-node-spacer tree-node-elbow';
			}
			if((index = curNode.loc.lastIndexOf('.')) != -1){
				fileType = curNode.loc.substr(index+1) || 'unknown';
			}else{
				fileType = 'unknown';
			}
			iconDiv.className = 'tree-node-icon tree-node-icon-type-'+(fileType);
		}else{
			if(!curNode.parent || curNode.parent.nodes.indexOf(curNode) == curNode.parent.nodes.length-1){
				// is last in cur tree (dont continue line down)
				curDiv.className = 'tree-node-spacer tree-node-sign tree-node-expand-last';
			}else{
				// normal down and right
				curDiv.className = 'tree-node-spacer tree-node-sign tree-node-expand';
			}
			iconDiv = document.createElement('div');
			iconDiv.className = 'tree-node-icon tree-node-icon-type-folder';
		}
		divs.push(iconDiv);
		divs.push(curDiv);
		while(curNode.parent){
			curDiv = document.createElement('div');
			if(curNode.parent.parent && curNode.parent.parent.nodes && curNode.parent.parent.nodes.indexOf(curNode.parent) == curNode.parent.parent.nodes.length-1){
				curDiv.className = 'tree-node-spacer tree-node-spacer';
			}else{
				curDiv.className = 'tree-node-spacer tree-node-spacer-down';
			}
			divs.push(curDiv);
			curNode = curNode.parent;
		}
		for(var i=divs.length-1;i>=0;i--){
			div.appendChild(divs[i]);
		}
		return div;
	};
}
/**
* Ticker to give unique id to each object. It's auto incrmented on each construct
*/
TreeNode.idCounter = 1;
/**
* Node reference from unique id to node object
*/
TreeNode.nodeIndex = {};