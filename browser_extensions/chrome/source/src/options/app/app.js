define([
    'jquery',
    'sarah',
    /** 
     * Define modules here.
     *
     * Modules are placed in app/ModuleName directory whereby ModuleName is the Module's Name.
     * The directory *MUST* contain a .js file named according to the Modules' Name.
     * 
     * i.e. If you are creating a 'projects' module, you should create a directory named projects inside the app directory
     * with a 'projects.js' file inside the projects directory.
     * 
     * Modules are loaded using 'sarah.modules![ModuleName]' (make sure you don't leave out the exclamation mark).
     */

    /* Let's load the users module */
    'sarah.modules!resources',
    // 'sarah.modules!anotherModule'
], function($, app){
    setInterval(function(){
        $.get('http://localhost:8684', function(){
            $('#webbuddyoffline').removeClass('show');
        }).fail(function(){
            $('#webbuddyoffline').addClass('show');
        });
    }, 500);

    /* Anything here will be ran after successful load of all modules. */

    /* Go to default route */

    // app.Router('#/');
});