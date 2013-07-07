/**
* Simple AJAX class used to make it easier to track AJAX requests.
* @param config Example: {
*   callback: {function to callback when executed, first parameter is the xhr request, second is the event},
*   url: {url string to load},
*   scope: {scope to execute callback function as}
* }
*/
function AJAX(config){
	var reqObj;
	if(window.XMLHttpRequest){
		reqObj = new XMLHttpRequest();
	}else{
		reqObj = new ActiveXObject('Microsoft.XMLHTTP');
	}
	reqObj.onreadystatechange = function (){
		if(reqObj.readyState == 4 && reqObj.status == 200){
			var args = Array.prototype.slice.call(arguments);
			args.unshift(reqObj);
			config.callback.apply(config.scope || window, args);
		}
	};
	reqObj.open('GET', config.url, true);
	reqObj.send();
	this.close = function (){
		try{
			reqObj.abort();
		}catch(e){}
		reqObj = null;
	};
}