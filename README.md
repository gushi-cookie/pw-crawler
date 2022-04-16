# PWCrawler (Puppeteer Web Crawler)
PWCrawler is a nodejs script for crawling over web pages and scrapping data from them. Most features are intended for working with nodes of a page. Here are common processes, the programm does with nodes: caching, inspecing, dumping, saving, restoring, hiding, scrolling.

# Prerequisites
Before using this tool you need `npm`, `nodejs` and `Chromium` or `Google Chrome` to be installed on your device.

# Installation
1. Get the repo on your device
   ```
   git clone https://github.com/DGGDAK47/pw-crawler
   ```

2. Come into the project directory
   ```
   cd pw-crawler
   ```
3. Install node dependencies
   ```
   npm install
   ```
4. Run script in the first time for initializing Chromium profile
   ```
   node index.js --manual-profile-input 'https://google.com'
   ```
*Use this option each time you need to use your Chrome profile in regular browser mode. For instance, login at some website.*

After these steps in the project directory `profile` folder must be created. This is a Chromium profile (like in google chrome) that will be used in futher runs of the script. Now you can use the tool.

# Usage
## Modes
**Headed** - in this mode a browser window is open.  
**SPL** - Scroll Page Load mode. Scrolls a specific element's content until its with timeout.  
**BCC** - what means Bulk Content Caching. This mode stores the content of the specific element in a cache. As soon, the element's nodes size goes over the limit, most early nodes are being hidden, within the limit. If some data in the element don't equal to its cache representation, then the element's content are being replaced by cached ones, within the limit.  
**DCS** - Dynamic Container Safe mode works like BCC mode, but doesn't hide nodes.  

## Arguments
* `-h|-help` - print the help message.
* `--headed` - runs browser in the headed mode.
* `--scroll-page-load <selector>` - activates SPL mode. Sets CSS selector for an element to be scrolled.
* `--scroll-page-load-direction <top|bottom>` - sets the scroll direction. Default: bottom.
* `--scroll-page-load-timeout <ms>` - sets a waiting timeout of the element not be scrolled, in milliseconds.
* `--manual-profile-input` - runs browser in the usual mode.
* `--save-page-on-complete [mhtml]` - enables a page saving and specifies save format, after all enabled modes are complete. Default: mhtml.
* `--dynamic-container-safe <selector>` - activates DCS mode on the element represented by selector.
* `--dynamic-container-safe-strict` - enables the strict mode for DCS one.
* `--dynamic-container-insert-begin <beforecontent|aftercontent>` - specifies a place in the element where new nodes are being added. Default: aftercontent.
* `--bulk-content-caching <selector>` - activates BCC mode on an element represented by CSS selector.
* `--bulk-content-caching-insert-begin <beforecontent|aftercontent>` - specifies a place in the element where new nodes are being added. Default: aftercontent.
* `--bulk-content-caching-cut-size <int>` - a cut size that will be used for hiding excess nodes, when the element's content length goes over the limit.
* `--bulk-content-caching-limit <int>` - the limit after reaching that most early nodes must be hidden.
* `--external-script <path>` - specifies a path to a script must be runned on a page. Note that the script are runned after the page are fully loaded.

## Examples
**Scrolling a content of a page**
```Shell
# You may replace the URL with another one. For instance, a search result from google images... may be trees search.
node index.js --scroll-page-load 'html' \
              --scroll-page-load-timeout 10000 \
              'https://google.com'
```

**Caching most content of a page and saving it in mhtml format**
```Shell
# This example is targeted for google images page. Search something there, paste the URL and run the command.
node index.js --headed \
              --bulk-content-caching '.islrc' \
              --save-page-on-complete \
              --scroll-page-load 'html' \
              <URL>
```