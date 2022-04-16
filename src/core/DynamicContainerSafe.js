module.exports = class DynamicContainerSafe {
    constructor(page, selector, insertBegin, strict) {
        this.page = page;
        this.insertBegin = insertBegin;
        this.selector = selector;
        this.intervals = { intervalId: null, strictIntervalId: null };
        this.strict = strict;
    };


    async serveContainer() {
        if(this.intervals.intervalId !== null) {
            console.log('[DCF] Couldn\'t start container serve twice.');
            return;
        }

        console.log('[DCS] Starting container serve.');
        let intervals = await this.page.evaluate((selector, insertBegin, strict) => {

            let childrenStorage = new Array();
            let container = document.querySelector(selector);

            if(container === null) {
                throw new Error('Container not found by passed selector: ' + this.selector);
            }
            
            let restoreContent = function() {
                container.innerHTML = '';
                childrenStorage.forEach((element) => {
                    container.insertAdjacentHTML('beforeend', element);
                });

                childrenCopy = [].slice.call(container.children);

                if(childrenStorage.length !== childrenCopy.length) {
                    console.log('[DCS] Inserting data has been corrupted while restoring content. Restoring again..');
                    restoreContent();
                    return;
                }

                for(let i = 0; i < childrenCopy.length; i++) {
                    if(childrenCopy[i].outerHTML !== childrenStorage[i]) {
                        console.log('[DCS] Inserting data has been corrupted while restoring content. Restoring again..');
                        restoreContent();
                        break;
                    }
                }
            };

            let checkContentStrictly = function() {
                console.log('[DCS] Strict content check started.');

                let children = [].slice.call(container.children);
                let difference = children.length - childrenStorage.length;
                let childrenStorageCopy = childrenStorage.slice();

                let elements;
                if(insertBegin === 'beforecontent') {
                    elements = children.slice(difference);
                } else if(insertBegin === 'aftercontent') {
                    elements = children.slice(0, -difference);
                }

                if(elements.length !== childrenStorageCopy.length) {
                    console.log('[DCS] Strict check detected corruption in container content.');
                    restoreContent();
                    return;
                }

                for(let i = 0; i < elements.length; i++) {
                    if(elements[i].outerHTML !== childrenStorageCopy[i]) {
                        console.log('[DCS] Strict check detected corruption in container content.');
                        return;
                    }
                }

                console.log('[DCS] Content has been checked strictly. All ok.');
            };

            let intervals = {
                intervalId: null,
                strictIntervalId: null,
            }

            intervals.intervalId = setInterval(() => {
                let children = [].slice.call(container.children);
                let difference = children.length - childrenStorage.length;

                if(difference > 0) {
                    let newElements;
                    if(insertBegin === 'beforecontent') {
                        newElements = children.slice(0, difference);

                        for(let i = 0; i < newElements.length; i++) {
                            newElements[i] = newElements[i].outerHTML;
                        }

                        childrenStorage = Array.prototype.concat(newElements, childrenStorage);
                    } else if(insertBegin === 'aftercontent') {
                        newElements = children.slice(-difference);

                        for(let i = 0; i < newElements.length; i++) {
                            newElements[i] = newElements[i].outerHTML;
                        }

                        childrenStorage = Array.prototype.concat(childrenStorage, newElements);
                    }
                    
                    console.log(`[DCS] New elements added - ${newElements.length}. Total: ${childrenStorage.length}.`);
                } else if(difference < 0) {
                    console.log('[DCS] Container content has been reseted by website scripts. Restoring content..');
                    
                    if(intervals.strictIntervalId !== null) {
                        console.log('[DCS] Pausing strict content check.');
                        clearInterval(intervals.strictIntervalId);
                        intervals.strictIntervalId = null;
                    }

                    restoreContent();
                    console.log('[DCS] Content restored.');

                    if(strict) {
                        console.log('[DCS] Resuming strict content check.');
                        intervals.strictIntervalId = setInterval(checkContentStrictly, 120000);
                    }
                }
            }, 15000);

            if(strict) {
                intervals.strictIntervalId = setInterval(checkContentStrictly, 120000);
            }

            return intervals;
        }, this.selector, this.insertBegin, this.strict);

        this.intervals = intervals;
    };

    async stopServe() {
        if(this.intervals === null) {
            console.log('[DCS] Couldn\'t stop serving container, since intervalId is null.');
            return;
        }

        await this.page.evaluate((intervalId, strictIntervalId) => {
            clearInterval(intervalId);

            if(strictIntervalId !== null) {
                clearInterval(strictIntervalId);
            }
        }, this.intervals.intervalId, this.intervals.strictIntervalId);

        this.intervals = { intervalId: null, strictIntervalId: null };
        console.log('[DCS] Container serve has stopped.');
    };
};