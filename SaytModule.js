/**
*	@class SaytModule
*	@param root 
*   
*	@fires dataAvailable The class has loaded its data and is ready
*	@fires dataError Some error is occurred during data loading
*	@author Stefano Sergio
*/
Refuel.define('SaytModule', {inherits: 'GenericModule'},  
    function SaytModule() {
        var config = {
            minChars: 2,
            searchParam: 'q',
            delay: 100
        };
        var lastQuery,
            searchTimeout,
            resultList,
            listItemTemplate,
            theList;

        this.init = function(myConfig) {
            config = Refuel.mix(config, myConfig); 
            delete config['data'];
            
            if (config.root) this.template.setRoot(config.root);
            this.template.subscribe('parsingComplete', create, this);
            this.template.parseTemplate();
            
            if (this.dataSource) {
                this.dataSource.subscribe('dataAvailable', function(data) {
                    this.draw();
                    this.notify('loadComplete');
                }, this);
                this.dataSource.init(config);
            }
            this.currentQuery = null;
        }

        function create(e) {
            this.elements['inputField'].addEventListener('keyup', handleTyping.bind(this));
            resultList = this.elements['resultList'];
            if (!resultList) {
                resultList = document.createElement('ul');
                this.template.getRoot().appendChild(resultList);
                this.elements['resultList'] = resultList;
            }
            listItemTemplate = this.elements['listItemTemplate'];
            if (!listItemTemplate) {
                listItemTemplate = document.createElement('li');
                listItemTemplate.innerHTML = '<div class="view">{{title}}</div>';
                resultList.appendChild(listItemTemplate);
                this.elements['listItemTemplate'] = listItemTemplate;
            }

            //if ListModule is defined inside markup
            theList = this.getModulesByClass('ListModule')[0];
            //if ListModule is not already defined
            if (!theList) {
                theList = Refuel.newModule('ListModule', {
                    'root': resultList,
                    'dataLabel': 'list',
                    'elements': {
                        'template': listItemTemplate 
                    }
                });
                this.addModule(theList);
            }
            this.hide();
            //XXX we got to call here because in general doesnt have all config?
            theList.template.parseTemplate();
        }

        this.draw = function(data) {
            //XXX with super() method we'll be fine
            data = data || this.data;
            this.template.render(data);

            //ignores any dataPath the list may have
            theList.data = data;

            //theList.toggleClass('show', data.length);
            data.length ? this.show() : this.hide();
        }

        function handleTyping(e) {
            var query = e.target.value.trim();
            if (searchTimeout) window.clearTimeout(searchTimeout);
            searchTimeout = window.setTimeout(startSearch.bind(this, query),config.delay);
        }

        function cancelSearch() {
            lastQuery = this.currentQuery; //move in currentQuery setter?
            this.currentQuery = null;
        }
        function startSearch(query) {
            //console.log('start sayt search', query);
            if (searchTimeout) window.clearTimeout(searchTimeout);
            theList.template.clear();
            if (query.length === 0) {
                this.hide();
            }
            else if (query.length >= config.minChars) {
                lastQuery = this.currentQuery;
                this.currentQuery = query;
                this.dataSource.load({'params': config.searchParam+'='+query});
            }
        }

        this.hide = function() {
             theList.toggleClass('hide', true);
        }
        this.show = function() {
             theList.toggleClass('hide', false);
        }

        function oa_update(e) {
            //console.log('SaytModule.oa_update', e);
        }

      	
});
