define(['sarah', 'jquery'], function(app, $) {

    var response = [];
    var checked = [];
    var lessO = [];
    var Templates = app.Templates;
    var Collections = app.Collections;
    var Utils = app.Utils;

    function parseUrl(url) {
        var parser = document.createElement('a');
        parser.href = url;
        return {
            protocol: parser.protocol,
            host: parser.host,
            hostname: parser.hostname,
            port: parser.port,
            pathname: parser.pathname,
            hash: parser.hash,
            search: parser.search
        }
    }

    function renderResults() {
        var fileListLi = '';
        var lessListLi = '';
        var searchExtVal = $('#searchExt').val();
        var searchLessVal = $('#searchLess').val();
        response.exts.filter(function(ext) {
            if (searchExtVal === '') {
                return true;
            }
            return ext.indexOf(searchExtVal) > -1;
        }).sort().forEach(function(ext) {
            var setChecked = (checked.indexOf(ext) > -1) ? 'checked="checked"' : '';
            fileListLi += '<li><label for="' + ext + '"><input ' + setChecked + ' type="checkbox" name="filetypes[]" id="' + ext + '" value="' + ext + '"> ' + ext.toUpperCase() + '</label></li>';
        });
        response.less.filter(function(less) {
            if (searchLessVal === '') {
                return true;
            }
            return less.indexOf(searchLessVal) > -1;
        }).sort().forEach(function(less) {
            var cssf = less.replace('.less', '.css');
            var lessOObj = lessO.filter(function(lessOObj) {
                return lessOObj.id === 'lesso_' + less;
            });
            var lessOutVal = '';
            if (lessOObj.length > 0) {
                lessOutVal = lessOObj[0].value;
            }
            var setChecked = (checked.indexOf(less) > -1) ? 'checked="checked"' : '';
            lessListLi += '<li><label for="' + less + '"><input ' + setChecked + ' id="' + less + '" type="checkbox" name="lessIn[]" value="' + less + '"> ' + less + ' &raquo;</label> <input class="lessOutInput" id="lesso_' + less + '" name="lessOut[]" value="' + lessOutVal + '" placeholder="' + cssf + '"/></li>';
        });
        $('#fileList').html(fileListLi);
        $('#lessList').html(lessListLi);
        $(document).on('change', 'input[type=checkbox]', function() {
            var self = this;
            if (this.checked) {
                return checked.push(self.id);
            }
            checked = checked.filter(function(check) {
                return check !== self.id;
            });
        });
        $(document).on('keyup', '.lessOutInput', function(e) {
            var self = this;
            if (self.value === '') {
                lessO = lessO.filter(function(lessOObj) {
                    return lessOObj.id !== self.id;
                });
            } else {
                var lessOVal = lessO.filter(function(lessOObj) {
                    return lessOObj.id === self.id;
                });

                if (lessOVal.length > 0) {
                    lessOVal[0].value = self.value;
                } else {
                    lessO.push({
                        id: self.id,
                        value: self.value
                    })
                }
            }
        });
        $('#lessDiv, #filesDiv, #submitDiv').css('display', 'block');
    }

    function checkValid() {
        response = [];
        checked = [];
        lessO = [];
        var isValid = true;
        var checked = false;

        var inputs = $('#outlet form');

        inputs.each(function() {
            if (this.checkValidity() === false) {
                isValid = false;
            }
        });

        if (isValid) {
            $.get('http://localhost:8684/dirinfo?path=' + encodeURIComponent($('#path').val()), function(serverResponse) {
                if (serverResponse !== '0') {
                    $('#fileList, #lessList').empty();
                    var data = JSON.parse(serverResponse);
                    response = data;
                    renderResults();
                } else {
                    $('#lessDiv, #filesDiv, #submitDiv').css('display', 'none');
                }
            });
        }
    }

    /* SARAHJS Module Definition */

    return {
        collections: {
            Resources: {
                plugins: {
                    localstorage: {}
                }
            }
        },
        templates: {
            resourceList: {
                template: 'resourceList.html',
                events: {}
            },
            resourceForm: {
                template: 'resourceForm.html',
                events: {
                    'click #delete' : function() {
                        if(confirm('Are you sure you want to delete ' + this.active.name + '?')) {
                            Collections.Resources.remove(this.active._id);
                            app.Router('/resources');
                        }
                    },
                    'keyup .checkvalid': checkValid,
                    'keyup #searchExt': renderResults,
                    'click #searchExt': renderResults,
                    'keyup #searchLess': renderResults,
                    'click #searchLess': renderResults,
                    'submit #resourceForm': function(e, elem) {
                        console.log(this);
                        this.hosts = this.hosts.split(',');
                        this.extensions = response.exts;
                        this.lessFiles = response.less;
                        var resource = Collections.Resources.save(this);
                        app.Router('/resource/' + resource._id);
                        e.preventDefault();
                        return false;
                    }
                }
            }
        },
        routes: {
            '/resource/edit/:id' : function(id) {
                Templates.resourceList.attributes({
                    state : function() {
                        return 'edit';
                    },
                    resources: function() {
                        return Collections.Resources.getAll();
                    },
                    active: function() {
                        return Collections.Resources.get(id)
                    },
                    url: function() {
                        return Collections.Resources.get(id).hosts[0]
                    }
                }).setOutlet('#outlet');
                var resource = Collections.Resources.get(id);
                setTimeout(function(){
                    checkValid();
                    checked = _.union(resource.filetypes, resource.lessIn);
                    lessO = resource.lessIn.map(function(id, idx){
                        return {
                            id : 'lesso_' + id,
                            value : resource.lessOut[idx]
                        }
                    });
                }, 500)
            },
            '/resource/:id': function(id) {
                Templates.resourceList.attributes({
                    state : function() {
                        return 'view';
                    },
                    resources: function() {
                        return Collections.Resources.getAll();
                    },
                    active: function() {
                        return Collections.Resources.get(id)
                    }
                }).setOutlet('#outlet');
            },
            '/resources/new': function() {
                Templates.resourceForm.attributes({
                    state: function() {
                        return 'new';
                    },
                    url: function() {
                        return Utils.Store.get('__newUrl') || '';
                    },
                    projectName: function() {
                        return parseUrl(Utils.Store.get('__newUrl')).host;
                    }
                }).setOutlet('#outlet');
            },
            '/resource': function() {
                Templates.resourceList.attributes({
                    resources: function() {
                        return Collections.Resources.getAll();
                    },
                    active: function() {
                        return false;
                    }
                }).setOutlet('#outlet');
            }
        },
        preInit: function() {
            Handlebars.registerHelper('titleCase', function(str, opts){
                return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
            });
        },
        postInit: function() {
            app.Router('*', this.routes['/resource'], this);
        },
        onEnter: function() {},
        onLeave: function() {}
    }
});