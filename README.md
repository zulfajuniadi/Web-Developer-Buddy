Web Developer Buddy
===================

Reload browser on save. Compiles LESS automatically.

##Getting the Google Chrome Extension:

You can download the extension from  [here](https://chrome.google.com/webstore/detail/web-developer-buddy/danjkilgmjfnhacgffegahgpibepenfo).

##Getting the accompanying software:

You can download releases from [here](https://github.com/zulfajuniadi/Web-Developer-Buddy/releases).

##Building from source
(Tested on OSX 10.9 - Should work fine with other *nix based systems.)

You can optionally build the binaries from source using [this nifty bash script](https://gist.github.com/zulfajuniadi/7751839#file-nwbuild). *(First time bash scripting ~ be nice)*

###Requirements

1. zip (flags -qxr)
2. cp (flags -R)
3. mv
4. rm
5. cat
6. sed (flags -n)
7. awk
8. chmod (flags -x)
9. ls (flags -lt)

###Howto

1. Place the ``nwbuild`` gist file somewhere in your PATH (I placed mine in ``~/bin``).
2. Create a new folder called ``nwbuild-src`` on the same level as ``nwbuild``.
3. Create another folder inside ``nwbuild-src`` and name it according to the current [node-webkit](https://github.com/rogerwang/node-webkit#introduction) release (``v0.8.1`` as of today). By default ``nwbuild`` will search for the node-webkit binaries based upon the latest modified folder date.
4. Inside _that_ folder, unzip the three distributions of node-webkit and name them win, mac and linux
5. Run ``nwbuild appname version`` from inside this source directory. (By default it will fail if it can't find the ``package.json`` file).
6. It will create a new ``build`` directory (if not exists) and build .nw .exe .app and linux binaries inside a timestamped folder inside ``build``.

**Do not forget to chmod +x the ``nwbuild`` file**

##Using Node-Webkit: 
(Handy for quick debugging of Web Developer Buddy)

1. Download and Install Node Webkit: (https://github.com/rogerwang/node-webkit).
1. Right Click ``bin/Web Developer Buddy.nw`` -> Open with Node Webkit.

*The .nw file is just a plain old .zip file. You can rename it to .zip and decompress to view the source.*

##But I'm Not Using Google Chrome?!

1. Copy the generated script tag by clicking "Copy Script Tag"
1. Paste it into your web project, just before the closing ``</body>`` tag.
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

> __paths__ : The path to your web project.<br/>
> __extensions__ : The Extension you want to monitor. Upon changes to these files, the browser will reload.<br/>
> __less__ : Less files you want to automatically compile. The Object key is the source file, the value is the output file relative to the source file.


##Screenshots

The Chrome Extension options page:

<p align="center">
<img src="http://3.bp.blogspot.com/-kbWwQPqJsc0/UpyrxpbZL8I/AAAAAAAABxs/OErnhHmHkCo/s1600/options.png" />
<br/><i>You can choose any extension to monitor inside your application path. It will reload the browser upon the file modifications. You can also set the ouput filename for your less files.</i>
</p>


<p align="center">
<img src="http://2.bp.blogspot.com/-_ubfKzxbcrk/UpyrxqeiX-I/AAAAAAAABxw/0NP3watRsfY/s1600/app.png"/>
<br/><i>By default it listens to http://0.0.0.0:8684. Any changes and connections will be logged here</i>
</p>

##Credits Where It's Due

Special thanks to the awesome [node-webkit](https://github.com/rogerwang/node-webkit#introduction) project. Which without it, creating simple html based applications such as this would be a pain in the ass.

##Licence

MIT

Copyright (C) 2013 Zulfa Juniadi Zulkifli

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

##Enjoy!

