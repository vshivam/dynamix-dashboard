Handlebars.getTemplate = function(name) {
	if (Handlebars.templates === undefined || Handlebars.templates[name] === undefined) {
	    $.ajax({
	        url : 'templates/' + name + '.handlebars',
	        success : function(data) {
	            if (Handlebars.templates === undefined) {
	                Handlebars.templates = {};
	            }
	            Handlebars.templates[name] = Handlebars.compile(data);
	        },
	        async : false, 
	        cache: false
	    });
	}
	return Handlebars.templates[name];
};

Handlebars.getWidgetTemplate = function(pluginId) {
	if (Handlebars.templates === undefined || Handlebars.templates[pluginId] === undefined) {
	    $.ajax({
	        url : 'scripts/dynamix/widgets/templates/' + DynamixWidgets.widgetsMap[pluginId]["template"] + '.handlebars',
	        success : function(data) {
	        	console.log(data);
	            if (Handlebars.templates === undefined) {
	                Handlebars.templates = {};
	            }
	            Handlebars.templates[pluginId] = Handlebars.compile(data);
	        },
	        async : false, 
	        cache: false
	    });
	}
	return Handlebars.templates[pluginId];
};

/*** http://stackoverflow.com/a/14521217/1239966 ***/
jQuery.loadScript = function (url, callback) {
    jQuery.ajax({
        url: url,
        dataType: 'script',
        success: callback,
        async: true
    });
};

/*** http://stackoverflow.com/a/25867509/1239966 ***/
jQuery.getCss = function(urls, callback, nocache){
	if(typeof urls == 'undefined' || urls.length == 0){
		console.log('no css to load');
		callback();
		return;
	}else {
		if (typeof nocache=='undefined') nocache=false; // default don't refresh

		$.when.apply($,
        $.map(urls, function(url){
            if (nocache) url += '?_ts=' + new Date().getTime(); // refresh? 
            return $.get(url, function(){       
                $('<link>', {rel:'stylesheet', type:'text/css', 'href':url}).appendTo('head');                    
            });
        })
	    ).then(function(){
	        if (typeof callback=='function') callback();
	    });
	}    
};


jQuery.loadJs = function(urls, success) {
	if(typeof urls == 'undefined' || urls.length == 0){
		success();
		return;
	} else {
		var count = 0;
		$.each(urls, function(index, url){
			var callback = function(){
				count++;
				if(count == urls.length){
					success();
				}
			};
			$.loadScript(url, callback);
		});
	}
}


ScopeUtils = {
	loadDataIntoView : function(){
		var that = this;
		var scopeName = "Family";
		var accessScopeIds = Data["scopesForRole"][scopeName];
		var accessScopes = [];
		$.each(accessScopeIds, function(index, scopeId){
			var accessScope = Data["accessScopes"][scopeId];
			accessScopes.push({name : accessScope.name, scopeId : scopeId});
		});
		var scopesListTemplate = Handlebars.getTemplate('scopes-list');
		var html = scopesListTemplate({accessScopes : accessScopes});
		console.log(html);
		$('#scopes-page').find('.ui-content').append(html);
		$('#scopes-list').listview().listview('refresh');
		$('#scopes-list').on('click', 'a.scope-listitem', function(event){
			var scopeId = $(this).data('id');
			that.openScopeViewer(scopeId);
		});
	}, 

	openScopeViewer : function(scopeId){
		SharedData.currentScopeId = scopeId;
		$.mobile.pageContainer.pagecontainer("change", "#controls-page");
	}
};

Controls = {
	reset : function(){
		$('#plugins-list').empty();
	},
	loadDataIntoView : function() {
		var that = this;
		this.reset();
		var accessScope = Data["accessScopes"][SharedData.currentScopeId];
		$.each(accessScope.accessProfiles, function(index, accessProfile){
			that.addContainerForPlugin(accessProfile);

			for(key in accessProfile.deviceProfiles){
				if(accessProfile.deviceProfiles.hasOwnProperty(key)){
					WidgetUtils.addDeviceControls(accessProfile.pluginId, key, accessProfile["deviceProfiles"][key]);
				}
			}
		});
	}, 

	addContainerForPlugin : function(accessProfile){
		var pluginListitemTemplate = Handlebars.getTemplate('plugin-listitem');
		var html = pluginListitemTemplate({accessProfile : accessProfile});
		var elem = $('#plugins-list').append(html);
		elem.find('ul.controls-container').listview().listview('refresh')
	}, 
};

WidgetUtils = {

	addDeviceControls : function(pluginId, deviceName, commands) {
		$.getCss(DynamixWidgets["widgetsMap"][pluginId]["css"], function() {
			console.log("css loaded Successfully" + pluginId);
			$.loadJs(DynamixWidgets["widgetsMap"][pluginId]["js"], function(){
				console.log("js loaded Successfully" + pluginId);
				var data = {deviceId : deviceName, commands : {}};
				$.each(commands, function(index, command){
					data["commands"][command] = true;
				});
				var template = Handlebars.getWidgetTemplate(pluginId);
				var html = template({data : data});
				var controlsContainerElem = $('ul.controls-container[data-pluginid="'+pluginId +'"]');
				var controlsListElem = controlsContainerElem.find('li.controls-list');
				controlsListElem.append(html);
				controlsListElem.enhanceWithin();
				if(DynamixWidgets["widgetsMap"][pluginId].apply !== undefined){
					DynamixWidgets["widgetsMap"][pluginId].apply();
				}
			});
		});

	}
}