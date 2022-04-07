const Logger = require('./Logger');

module.exports = class BulkContentCaching {

    constructor(page, selector, cutSize, nodesLimit, insertBegin) {
        this.page = page;
        this.selector = selector;
        this.cutSize = cutSize;
        this.nodesLimit = nodesLimit;
        this.insertBegin = insertBegin;

        this.logger = new Logger();

        this.dataId = null;
        this.dataProperty = null;
    };

    async init() {
        let result = await this.page.evaluate(() => {
            let dataId;
            let dataProperty;

            do {
                dataId = Math.random().toString(36).slice(2);
                dataProperty = `bulkContentCaching_${dataId}`;

                if(window[dataProperty] === undefined) {
                    window[dataProperty] = {
                        moduleAbbr: 'BCC',
                        moduleId: dataId,
                        target: null,
                        cache: null,
                        recursionTimeoutId: null,
                        enabled: false,
                        log: null,
                    };

                    break;
                }
            } while(true);

            return { dataId: dataId, dataProperty: dataProperty };
        });

        this.dataId = result.dataId;
        this.dataProperty = result.dataProperty;

        this.logger.initLogger('BCC', true, this.dataId, Logger.FgColor.CYAN);
        this.logger.enablePageLog(this.page);
        
        this.logger.log('Instance initialized.');
    };


    async dumpCache() {
        await this.page.evaluate((dataProperty) => {
            return new Promise((resolve, reject) => {
                let log = function(message) {
                    console.log(JSON.stringify({
                        moduleAbbr: window[dataProperty].moduleAbbr,
                        moduleId: window[dataProperty].moduleId,
                        message: message,
                    }));
                };

                let dumpCache = function() {
                    let activeNodes = new Array();
                    window[dataProperty].cache.forEach((node) => {
                        activeNodes.push(node.cloneNode(true));
                    });

                    window[dataProperty].target.innerHTML = '';
                    activeNodes.forEach((node) => {
                        window[dataProperty].target.appendChild(node);
                    });
                };
                
                let inspectorRecursion = function() {
                    triesCount++;

                    let activeNodes = [].slice.call(window[dataProperty].target.childNodes);
                    let cache = window[dataProperty].cache;

                    if(activeNodes.length !== cache.length) {
                        log(`Try ${triesCount}`);
                        dumpCache();
                        setTimeout(inspectorRecursion, 10000);
                        return;
                    }

                    for(let i = 0; i < cache.length; i++) {
                        if(!activeNodes[i].isEqualNode(cache[i])) {
                            log(`Try ${triesCount}`);
                            dumpCache();
                            setTimeout(inspectorRecursion, 10000);
                            return;
                        }
                    }

                    log(`Successfully dumped ${window[dataProperty].cache.length} nodes.`);
                    resolve();
                };

                log(`Dumping cache..`);
                dumpCache();
                let triesCount = 0;
                setTimeout(inspectorRecursion, 10000);
            });
        }, this.dataProperty);
    };

    async startCaching() {
        await this.page.evaluate((selector, cutSize, nodesLimit, insertBegin, dataProperty) => {
            const RECURSION_INTERVAL = 10000;

            window[dataProperty].cache = new Array();
            window[dataProperty].target = document.querySelector(selector);

            let log = function(message) {
                console.log(JSON.stringify({
                    moduleAbbr: window[dataProperty].moduleAbbr,
                    moduleId: window[dataProperty].moduleId,
                    message: message,
                }));
            };

            let compareStringsSimilarity = function(first, second) {
                first = first.replace(/\s+/g, '')
                second = second.replace(/\s+/g, '')
            
                if (first === second) return 1; // identical or empty
                if (first.length < 2 || second.length < 2) return 0; // if either is a 0-letter or 1-letter string
            
                let firstBigrams = new Map();
                for (let i = 0; i < first.length - 1; i++) {
                    const bigram = first.substring(i, i + 2);
                    const count = firstBigrams.has(bigram)
                        ? firstBigrams.get(bigram) + 1
                        : 1;
            
                    firstBigrams.set(bigram, count);
                };
            
                let intersectionSize = 0;
                for (let i = 0; i < second.length - 1; i++) {
                    const bigram = second.substring(i, i + 2);
                    const count = firstBigrams.has(bigram)
                        ? firstBigrams.get(bigram)
                        : 0;
            
                    if (count > 0) {
                        firstBigrams.set(bigram, count - 1);
                        intersectionSize++;
                    }
                }
            
                return (2.0 * intersectionSize) / (first.length + second.length - 2);
            };

            let compareNodesSimilarity = function(node1, node2) {
                if(node1 === undefined || node2 === undefined || node1.nodeType !== node2.nodeType) {
                    return 0;
                } else if(node1.nodeType === Node.TEXT_NODE) {
                    return compareStringsSimilarity(node1.textContent, node2.textContent);
                } else if(node1.nodeType === Node.ELEMENT_NODE) {
                    return compareStringsSimilarity(node1.textContent, node2.textContent);
                } else {
                    return 0;
                }
            };

            let restoreData = function(prevNodesCachedAmount) {
                log(`Restoring corrupted data. Reseting ${prevNodesCachedAmount} cached nodes`);
                
                if(insertBegin === 'beforecontent') {
                    window[dataProperty].cache = window[dataProperty].cache.slice(prevNodesCachedAmount);
                } else if(insertBegin === 'aftercontent') {
                    window[dataProperty].cache = window[dataProperty].cache.slice(-prevNodesCachedAmount);
                }

                log(`Clearing target content. Dumping cache..`);

                let cacheSlice;
                if(insertBegin === 'beforecontent') {
                    cacheSlice = window[dataProperty].cache.slice(0, nodesLimit);
                } else if(insertBegin === 'aftercontent') {
                    cacheSlice = window[dataProperty].cache.slice(-nodesLimit);
                }

                let activeNodes = new Array();
                cacheSlice.forEach((node) => {
                    activeNodes.push(node.cloneNode(true));
                });

                window[dataProperty].target.innerHTML = '';

                activeNodes.forEach((node) => {
                    window[dataProperty].target.appendChild(node);
                });

                log(`Data restored.`);
                return activeNodes;
            };

            let recursion = function(prevActiveNodes, prevNodesCachedAmount) {
                if(!window[dataProperty].enabled) {
                    return;
                }


                // #1 Precaching
                if(window[dataProperty].cache.length === 0) {
                    let newNodes = [].slice.call(window[dataProperty].target.childNodes);

                    newNodes.forEach((node) => {
                        window[dataProperty].cache.push(node.cloneNode(true));
                    });

                    if(window[dataProperty].cache.length !== 0) {
                        log(`Nodes precached: ${window[dataProperty].cache.length}.`);
                    }

                    window[dataProperty].recursionTimeoutId = setTimeout(recursion, RECURSION_INTERVAL, newNodes, newNodes.length);
                    return;
                }


                // #2 Inspecting active nodes
                let activeNodes = [].slice.call(window[dataProperty].target.childNodes);
                
                let activeNodesSlice;
                if(insertBegin === 'beforecontent') {
                    activeNodesSlice = activeNodes.slice(activeNodes.length - prevActiveNodes.length);
                } else if(insertBegin === 'aftercontent') {
                    activeNodesSlice = activeNodes.slice(0, prevActiveNodes.length);
                }

                if(activeNodesSlice.length !== prevActiveNodes.length) {
                    log(`\x1b[43m\x1b[30mNodes inspection. Active nodes length changed. Previous nodes length ${prevActiveNodes.length}; Current nodes length ${prevActiveNodes.length}.`);
                    return;
                }

                for(let i = 0; i < activeNodesSlice.length; i++) {
                    if(activeNodesSlice[i] !== prevActiveNodes[i]) {
                        log(`\x1b[43m\x1b[30mNodes inspection. Last active nodes copy is not same as current target nodes. Iterated ${i} times.`);
                        return;
                    }
                }


                // #3 Slicing
                let cache = window[dataProperty].cache;

                let lastCachedNode;
                if(insertBegin === 'beforecontent') {
                    lastCachedNode = cache[0];
                } else if(insertBegin === 'aftercontent') {
                    lastCachedNode = cache[cache.length - 1];
                }

                let cacheIndex;
                for(let i = 0; i < activeNodes.length; i++) {
                    if(activeNodes[i].isEqualNode(lastCachedNode)) {
                        cacheIndex = i;
                        break;
                    }
                }

                if(cacheIndex === undefined) {
                    log(`\x1b[43m\x1b[30mCouldn't find last cached target node by cache index.`);
                    return;
                }

                let activeNodesJoin;
                if(insertBegin === 'beforecontent') {
                    activeNodesJoin = activeNodes.slice(cacheIndex, activeNodes.length);
                } else if(insertBegin === 'aftercontent') {
                    activeNodesJoin = activeNodes.slice(0, cacheIndex + 1);
                }

                let cachedNodesJoin;
                if(insertBegin === 'beforecontent') {
                    cachedNodesJoin = cache.slice(0, activeNodesJoin.length);
                } else if(insertBegin === 'aftercontent') {
                    cachedNodesJoin = cache.slice(-activeNodesJoin.length);
                }

                let newNodes;
                if(insertBegin === 'beforecontent') {
                    newNodes = activeNodes.slice(0, activeNodes.length - activeNodesJoin.length);
                } else if(insertBegin === 'aftercontent') {
                    newNodes = activeNodes.slice(activeNodesJoin.length - activeNodes.length);
                }


                // #4 Inspecting joins
                if(activeNodesJoin.length !== cachedNodesJoin.length) {
                    log(`\x1b[43m\x1b[30mNodes inspection. Joins lengths are different.`);
                    return;
                    // let activeNodes = restoreData(prevNodesCachedAmount);
                    // window[dataProperty].recursionTimeoutId = setTimeout(recursion, RECURSION_INTERVAL, activeNodes, 0);
                }

                for(let i = 0; i < activeNodesJoin.length; i++) {
                    if(!activeNodesJoin[i].isEqualNode(cachedNodesJoin[i])) {
                        let nodeCacheIndex;
                        if(insertBegin === 'beforecontent') {
                            nodeCacheIndex = i;
                        } else if(insertBegin === 'aftercontent') {
                            nodeCacheIndex = cache.length - cachedNodesJoin.length + i;
                        }

                        let nodesSimilarity = compareNodesSimilarity(activeNodesJoin[i], cachedNodesJoin[i]);
                        nodesSimilarity = Number(Number(nodesSimilarity).toFixed(3));

                        log(`\x1b[33mCached node by index ${nodeCacheIndex} is not equal to its active node representation. Checking nodes similarity..`);

                        if(nodesSimilarity >= 0.6) {
                            log(`\x1b[33mNodes similarity is ${nodesSimilarity}. Replacing cached node with active one.`);
                            cache[nodeCacheIndex] = activeNodesJoin[i].cloneNode(true);
                        } else {
                            log(`\x1b[33mNodes similarity is ${nodesSimilarity}. Cached node can't be replaced with active one.`);
                        }
                    }
                }


                // #5 Excess nodes hiding
                let toHideNodes = new Array();
                if(activeNodes.length > nodesLimit) {
                    if(insertBegin === 'beforecontent') {
                        toHideNodes = activeNodesJoin.slice(-cutSize);
                    } else if(insertBegin === 'aftercontent') {
                        toHideNodes = activeNodesJoin.slice(0, cutSize);
                    }

                    toHideNodes.forEach((node) => {
                        node.remove();
                    });
                }


                // #6 Caching
                let newNodesClones = new Array();
                newNodes.forEach((node) => {
                    newNodesClones.push(node.cloneNode(true));
                });

                if(insertBegin === 'beforecontent') {
                    cache.unshift(...newNodesClones);
                } else if(insertBegin === 'aftercontent') {
                    cache.push(...newNodesClones);
                }


                // #7 State logging
                log(`New nodes cached: ${newNodes.length}. Excess nodes hidden: ${toHideNodes.length}. Cache size: ${cache.length}. Active nodes: ${window[dataProperty].target.childNodes.length}.`);


                // #8 Recursing
                if(window[dataProperty].enabled) {
                    let currentActiveNodes;
                    if(insertBegin === 'beforecontent') {
                        currentActiveNodes = activeNodes.slice(0, activeNodes.length - toHideNodes.length);
                    } else if(insertBegin === 'aftercontent') {
                        currentActiveNodes = activeNodes.slice(toHideNodes.length - activeNodes.length);
                    }

                    window[dataProperty].recursionTimeoutId = setTimeout(recursion, RECURSION_INTERVAL, currentActiveNodes, newNodes.length);
                }
            };
            
            window[dataProperty].enabled = true;
            log('Caching process started.');
            setTimeout(recursion, RECURSION_INTERVAL, null, null);

        }, this.selector, this.cutSize, this.nodesLimit, this.insertBegin, this.dataProperty);
    };

    async stopCaching() {
        await this.page.evaluate((dataProperty) => {
            let log = function(message) {
                console.log(JSON.stringify({
                    moduleAbbr: window[dataProperty].moduleAbbr,
                    moduleId: window[dataProperty].moduleId,
                    message: message,
                }));
            };

            if(window[dataProperty].enabled) {
                window[dataProperty].enabled = false;

                if(window[dataProperty].recursionTimeoutId !== null) {
                    clearTimeout(window[dataProperty].recursionTimeoutId);
                    window[dataProperty].recursionTimeoutId = null;
                }

                log('Caching process stopped.');
            }
        }, this.dataProperty);
    };

};