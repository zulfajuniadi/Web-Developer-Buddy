Web-Developer-Buddy
===================

Reload browser on save. Compiles LESS automatically.

##Usage: 

1. Download and Install Node Webkit: (https://github.com/rogerwang/node-webkit)[From here].
1. Right Click bin/Web Developer Buddy.nw -> Open with Node Webkit.
1. Copy the generated script tag by clicking "Copy Script Tag"
1. Paste it into your web project, just before the closing </body> tag.
1. Modify the parameters inside the script tag as follows:

```html
<script src="http://localhost:8684/webdevbuddy.js">
    {
      "paths" : ["\\xampp\\htdocs\\test"], 
      "extensions" : ["js","css","html","less"],
      "less" : [{"style.less" : "..\\..\\style.css"}]
    }
</script>
```

__paths__ : The path to your web project
__extensions__ : The Extension you want to monitor. Upon changes to these files, the browser will reload.
__less__ : Less files you want to automatically compile. The Object key is the source file, the value is the output file relative to the source file.

###Enjoy!

