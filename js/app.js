/*
    # Endpoint URL #
    
    https://api.github.com/legacy/repos/search/{query}
    
    Note: Github imposes a rate limit of 60 request per minute. Documentation can be found at http://developer.github.com/v3/.
    
    # Example Response JSON #
    
    {
      "meta": {...},
      "data": {
        "repositories": [
          {
            "type": string,
            "watchers": number,
            "followers": number,
            "username": string,
            "owner": string,
            "created": string,
            "created_at": string,
            "pushed_at": string,
            "description": string,
            "forks": number,
            "pushed": string,
            "fork": boolean,
            "size": number,
            "name": string,
            "private": boolean,
            "language": number
          },
          {...},
          {...}
        ]
      }
    }
*/

var githubGetter = (function(window, $, _) {

    var helpers = {
        slugify: function(text) {
            return text.toString().toLowerCase()
                .replace(/\s+/g, '-') // Replace spaces with -
                .replace(/[^\w\-]+/g, '') // Remove all non-word chars
                .replace(/\-\-+/g, '-') // Replace multiple - with single -
                .replace(/^-+/, '') // Trim - from start of text
                .replace(/-+$/, ''); // Trim - from end of text
        }
    }


    return {

        initialize: function() {
            this.cache = {};
            this.bindUIElements();
            this.bindEvents();
        },

        bindUIElements: function() {
            this.ui = this.ui || {};
            _.extend(this.ui, {
                body: $('body'),
                loader: $('#loader'),
                search: $('#search'),
                overlayContainer: $('#overlay-container'),
                resultsContainer: $('#results-container')
            });
            console.log(this.ui);
        },

        bindEvents: function() {
            // Bind search function to input
            this.ui.search.on('keypress', _.bind(this.onSearchQuery, this));
            // Close Overlay
            this.ui.overlayContainer.on('click', _.bind(this.onClickOverlay, this));
        },



        onSearchQuery: function(e) {
            if (e.which == 13) {
                this.searchGithub(this.ui.search.val());
            }
        },

        onClickOverlay: function(e) {
            this.ui.overlayContainer.removeClass('active');
            // Unlock scrolling on the body
            this.ui.body.removeClass('locked');
        },

        searchGithub: function(query) {

            this.query = query;
            // Show Loader
            this.ui.loader.addClass('active');
            // Hide previous results
            this.ui.resultsContainer.fadeOut(400);

            // Check if the query has already been made
            console.log(this.getCache());
            if (this.getCache()) {
                this.renderResults(this.getCache().results);
            } else {
                this.ajaxRequest();
            }
        },

        getCache: function() {
            // Look for the query in cache
            return this.cache[helpers.slugify(this.query)] || false;
        },

        renderResults: function(data) {
            console.log(this.query, data);
            this.ui.loader.removeClass('active');

            // add the query to the response object
            data.query = this.query;

            var searchResults = {
                query: this.query,
                results: data
            }
            this.repoData = searchResults;

            // render the template with
            // the search results
            this.renderRepoList(searchResults);
            this.renderRepoInfo(searchResults);

            // add response to cache object
            this.cache[helpers.slugify(this.query)] = searchResults;
        },

        ajaxRequest: function() {
            console.log('ajaxRequest', this.query);

            // Set the url with the search query
            var urlQuery = 'https://api.github.com/legacy/repos/search/' + this.query;

            // Make an ajax call to the github api
            $.getJSON(urlQuery, {
                    format: "json",
                })
                .done(_.bind(this.renderResults, this))
                .fail(_.bind(this.handleError, this));
        },

        handleError: function() {
            this.ui.loader.removeClass('active');
        },

        renderRepoList: function(data) {
            // Render the underscore template and
            // inject in our search results.
            this.ui.resultsContainer.html(this.resultsTemplate(data)).hide().fadeIn(500);
        },

        // Getting More Info on a Repo
        renderRepoInfo: function(data) {

            // Click event for displaying the repo info
            this.ui.resultsContainer.on('click', '#repo-info', _.bind(function(e) {

                var i = $(e.currentTarget).data('index');
                var currentRepo = this.repoData.results.repositories[i];

                // Render the underscore template and inject in our search results.
                this.ui.overlayContainer.html(this.repoinfoTemplate(currentRepo)).addClass('active');
                // Lock scrolling on the body
                this.ui.body.addClass('locked');

            }, this));
        },


        resultsTemplate: _.template(
            '<h2>Search Results for <em><%- query %></em></h2>' +
            '<div class="repo-list">' +
            '<div class="repo-head"><span class="repo-name">Name</span><span class="repo-owner">Owner</span></div>' +
            '<% _.each( results.repositories, function( repository, i ){ %>' +
            '<a id="repo-info" data-index="<%- i %>">' +
            '<div class="repo">' +
            '<span class="repo-name"><%- repository.name %></span>' +
            '<span class="repo-owner"><%- repository.owner %></span>' +
            '</div>' +
            '</a>' +
            '<% }); %>' +
            '<div>'
        ),

        repoinfoTemplate: _.template(
            '<article class="repo-details wrapper">' +
            '<h2>Repository Details for <em><%- name %></em></h2>' +
            '<p>Language: <strong><%- language %></strong></p>' +
            '<p>Owner: <strong><%- owner %></strong></p>' +
            '<p>Followers: <strong><%- followers %></strong></p>' +
            '<p>Description: <%- description %></p>' +
            '<a href="<%- url %>" class="button">GitHub Link</a>' +
            '</article>'
        )

    };

})(window, jQuery, _);

githubGetter.initialize(); //Boom
