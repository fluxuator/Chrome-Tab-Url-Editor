var app = angular.module('AddressBarEditor', []);

app.directive('ngHotkey', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            var _attrs = attrs.ngHotkey.split(',');

            if (_attrs.length != 2) {
                console.error('2 parameters required!');
                return;
            }

            if (event.which == (parseInt(_attrs[0]) || 0)) {
                scope.$apply(function() {
                    scope.$eval(_attrs[1]);
                });
                event.preventDefault();
            }
        });
    };
});

app.factory('ChromeTab', function($q, UrlService) {
    var tab;

    return {
        loadTab: function() {
            var deferred = $q.defer();

            if (chrome.tabs == undefined) {
                deferred.reject('You should open this page as popup window!');
            } else {
                chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
                    tab = tabs[0];

                    deferred.resolve(UrlService.parseUrl(tab));
                });
            }

            return deferred.promise;
        },
        reloadTab: function(urlData) {
            chrome.tabs.update(tab.id, {
                url: UrlService.buildUrl(urlData)
            });
        }
    }
});

app.factory("UrlService", function() {
    var data = {
        host: null,
        path: null,
        query: [],
        hash: null,
        icon: null
    };

    return {
        parseUrl: function(tab) {
            var url = new Url(this.decode(tab.url));

            if (tab.favIconUrl) {
                data.icon = tab.favIconUrl
            }

            data.host =
                (url.protocol && (url.protocol + '://')) +
                (url.user && (url.user + (url.pass && (':' + url.pass)) + '@')) +
                (url.host && url.host) +
                (url.port && (':' + url.port));

            if (url.path)
                data.path = url.path.replace(/^\//, '');

            var qi = 0;
            angular.forEach(url.query, function(value, name) {
                if (typeof value === 'object') {
                    angular.forEach(value, function(subValue) {
                        data.query.push({key: qi++, name: name, value: subValue});
                    });
                } else if (typeof value === 'string') {
                    data.query.push({key: qi++, name: name, value: value});
                }
            });

            if (url.hash)
                data.hash = url.hash;

            return data;
        },

        buildUrl: function(urlData) {
            var self = this;
            var url =
                (urlData.host && urlData.host) +
                (urlData.path && ('/' + urlData.path));

            if (urlData.query.length) {
                url += ('?' + urlData.query.map(function(item) {
                    return item.name + '=' + self.encode(item.value);
                }).join('&'));
            }

            if (urlData.hash) {
                url += self.encode('#' + urlData.hash);
            }

            return url;
        },

        encode: function(str) {
            str = (str + '').toString();

            return encodeURI(str);
        },
        decode: function(str) {
            return decodeURIComponent((str + '')
                .replace(/%(?![\da-f]{2})/gi, function() {
                    return '%25';
                })
                .replace(/\+/g, '%20'));
        }
    };
});

app.controller('MainController', function($scope, $anchorScroll, ChromeTab) {
    ChromeTab
        .loadTab()
        .then(function(data) {
            $scope.urlData = data;
        });

    $scope.reloadPage = function() {
        var urlData = eval($scope.urlData);

        if (urlData) {
            ChromeTab.reloadTab(urlData);
        }
    };

    $scope.addRow = function() {
        var urlData = eval($scope.urlData);

        if (!urlData)
            return;

        var maxIndex = urlData.query.length || -1;

        urlData.query.push({
            key: (maxIndex === -1)
                ? 0
                : (urlData.query[maxIndex - 1].key + 1),
            name: '',
            value: ''
        });

        $scope.urlData = urlData;
    };

    $scope.removeRow = function(key) {
        var index = -1,
            urlData = $scope.urlData;

        for (var i = 0; i < urlData.query.length; i++) {
            if (urlData.query[i].key == key) {
                index = i;
                break;
            }
        }

        if (index > -1) {
            urlData.query.splice(index, 1);

            $scope.urlData = urlData;
        }
    };
});
