/**
* When error happens this is just a way to know something went wrong. For now it just prints it to console.
* @param msg Error message
*/
function log(msg){
	window.console && console.log(msg);
};
/**
* Trim function if not already setup. Found on Mozilla site.
*/
if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}
/**
* indexOf function if not already setup. Found on Mozilla site.
*/
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
    "use strict";
    if (this == null) {
      throw new TypeError();
    }
    var t = Object(this);
    var len = t.length >>> 0;

    if (len === 0) {
      return -1;
    }
    var n = 0;
    if (arguments.length > 1) {
      n = Number(arguments[1]);
      if (n != n) { // shortcut for verifying if it's NaN
        n = 0;
      } else if (n != 0 && n != Infinity && n != -Infinity) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }
    if (n >= len) {
      return -1;
    }
    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
    for (; k < len; k++) {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }
    return -1;
  };
}
/**
* Sets up viewport
*/
(function (){
	var doc = document,
		shouldTraverse = true,
		treeTable, viewport, contentPort, contentTextArea, curReq = null, treeTd, loadingMask, contentOwner, loadFn;
	/**
	* Removes loading mask if one is already loaded
	*/
	function removeLoadingMask(){
		loadingMask.parentNode.removeChild(loadingMask);
		loadingMask = null;
	}
	/**
	* Adds loading mask if not already loaded
	*/
	function createLoadingMask(){
		if(loadingMask){
			return;
		}
		loadingMask = document.createElement('div');
		loadingMask.className = 'content-loading-owner';
		lmContent = document.createElement('div');
		lmContent.className = 'content-loading-mask';
		loadingMask.appendChild(lmContent);
		loadingMask = contentPort.insertBefore(loadingMask, contentTextArea);
		return;
	}
	/**
	* Function to execute when document loads
	*/
	loadFn = function (){
		createViewPort();
		// Create Tree node
		var fileTree = new FileTree({
			owner: document.getElementById('viewport-tree'),
			onClick: function (node){
				// Cancels traversing of dom because user clicked.
				shouldTraverse = false;
				// Do not try and load data if it's not a file
				if(!node.isFile){
					return;
				}
				// Cancel loading request if is currently loading.
				if(curReq){
					curReq.close();
					curReq = null;
				}
				createLoadingMask();
				contentTextArea.value = '';

				/**
				* Loads data from server and loads it into TextArea in right/center side of page.
				*/
				curReq = new AJAX({
					callback: function (reqObj, event){
						try{
							var data = JSON.parse(reqObj.responseText);
						}catch(e){
							log('error receiving data from server');
							curReq.close();
							curReq = null;
							removeLoadingMask();
							return;
						}
						contentTextArea.value = data.data;
						curReq.close();
						curReq = null;
						removeLoadingMask();
					},
					scope: this,
					url: 'reader.php?node='+encodeURIComponent(node.loc)
				});
			},
			onNodesLoaded: function (node, hasError){
				// This is the function/area used to traverse dom
				if(shouldTraverse){
					var hasFolder = false,
						i = 0, len = node.nodes?node.nodes.length:0;
					for(;i<len;i++){
						if(!node.nodes[i].isFile){
							node.nodes[i].loadChildNodes();
							hasFolder = true;
							break;
						}
					}
					if(node.isFile || !len || !hasFolder){
						var curNode = node,
							index;
						while(curNode.parent){
							index = curNode.parent.nodes.indexOf(curNode);
							len = curNode.parent.nodes.length;
							i = 1;
							while(index != -1 && index+i < len){
								if(!curNode.parent.nodes[index+i].isFile){
									curNode.parent.nodes[index+i].loadChildNodes();
									return;
								}
								i++;
							}
							curNode = node.parent;
						}
					}
				}
			}
		});
		// To keep things consistent a onresize event was used to know how tall a page was and resize the objects accordingly
		if(window.addEventListener){
			window.addEventListener('resize', function (){
				treeTd.style.height = document.documentElement.clientHeight.toString() + 'px';
				fileTree.tree.style.height = document.documentElement.clientHeight.toString() + 'px';
				try{
				contentTextArea.style.height = (document.documentElement.clientHeight-30).toString() + 'px';
				}catch(e){/* IE ISSUE */}
			});
		}else{
			if(typeof window.onresize != 'undefined'){
				window.attachEvent('onresize', function (){
					treeTd.style.height = document.documentElement.clientHeight.toString() + 'px';
					fileTree.tree.style.height = document.documentElement.clientHeight.toString() + 'px';
					try{
					contentTextArea.style.height = (document.documentElement.clientHeight-30).toString() + 'px';
					}catch(e){/* IE ISSUE */}
				});
			}
		}
		// Setup initial height of a few specific dom nodes.
		treeTd.style.height = document.documentElement.clientHeight.toString() + 'px';
		fileTree.tree.style.height = document.documentElement.clientHeight.toString() + 'px';
		try{
		contentTextArea.style.height = (document.documentElement.clientHeight-30).toString() + 'px';
		}catch(e){/* IE ISSUE */}
		fileTree.rootNode.loadChildNodes();
	};
	// Attach onload event to window
	if(window.addEventListener){
		window.addEventListener('load', loadFn);
	}else{
		window.attachEvent('onload', loadFn);
	}
	/**
	* Easy function used to create table
	* @param rows Number of rows
	* @param cols Number of colums
	*/
	function createTable(rows, cols){
		var table = document.createElement('table'),
			tbody = table.appendChild(document.createElement('tbody')),
			tr, td;
		for(var i=0;i<rows;i++){
			tr = tbody.appendChild(document.createElement('tr'));
			for(var j=0;j<cols;j++){
				td = tr.appendChild(document.createElement('td'));
				td.appendChild(document.createElement('div'));
			}
		}
		return table;
	}
	/**
	* Creates the actual viewport
	*/
	function createViewPort(){
		var body = doc.body;
		for(var i=0;i<doc.body.children.length;i++){
			doc.body.removeChild(doc.body.children[i]);
		}
		viewport = createTable(1, 2);
		viewport.id = 'viewport';
		(treeTd = viewport.firstChild.children[0].children[0]).firstChild.id = 'viewport-tree';
		treeTd.id = 'viewport-tree-owner';
		(contentPort = (contentOwner = viewport.firstChild.children[0].children[1]).firstChild).id = 'viewport-content';
		contentOwner.id = 'viewport-content-owner'
		contentTextArea = contentPort.appendChild(document.createElement('textarea'));
		return doc.body.appendChild(viewport);
	}
})();
