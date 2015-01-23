/**
 * @author smart [wupeng_xg@163.com]
 * @fileoverview selector based on js,Compatible with IE6+ and others
 */
(function(win,doc,undef){
    var cache = {};    
    var whitespace = "[\\x20\\t\\r\\n\\f]",//空白字符        
        //匹配分隔符,tagName,Id,Class
        re_selector_fragment = /^\s*([>+~])?\s*([*\w-]+)?(?:#([\w-]+))?(?:\.([\w.-]+))?\s*/,        
        rcomma = new RegExp( "," ),//匹配逗号
        rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),//分隔符>+~或者空格
        characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",
        identifier = characterEncoding.replace( "w", "w#" ),                
        attributes = "([*\w-]+)?\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace +        
        "*([*^$|!~]?=)" + whitespace +      
        "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
        "*\\]";
    var match,context;
    var selectorFun = {
        _hasClasses : function(elm, classNames)
        {//判断一个元素是否存在classNames这个类
            if (elm.className === "") {
                return false;
            }
            for (var c = 0; c < classNames.length; c++)
            {         
                if((" " + elm.className + " ").indexOf(" "+classNames[c]+" ") === -1){
                    return false;
                }
            }
            return true;
        },
        contains : function(o,results)
        {
            results = !results ? [] : results; 
            for (var c = results.length; c--; ) {
                if (results[c] === o) {
                    return true;
                }
            }
            return false;
        },
        trim : function(str){
            var s = str.replace(/^(\u3000|\s|\t)*/gi, "");
            s = s.replace(/(\u3000|\s|\t)*$/gi, "");
            return s;
        },
        find : function (elm, selectorFragment)
        {//根据selectorFragment选择符查找在上下文elm中匹配元素            
            var c, results = selectorFragment.id ?
                ((c = ((elm && elm.ownerDocument) || doc).getElementById(selectorFragment.id)) && selectorFun._isDescendant(c, elm)) ? [c] : [] :
                selectorFun.toArray(elm.getElementsByTagName(selectorFragment.uTag || "*"));
            c = results.length;        
            if (c > 0 && (selectorFragment.id || selectorFragment.classes)) {
                while (c--) {
                    if (!selectorFun._match(results[c], selectorFragment)) {
                        results.splice(c, 1);
                    }
                }
            }
            return results;
        },
        _isDescendant : function(elm, ancestor)
        {
            while ((elm = elm.parentNode) && elm !== ancestor) { }
            return elm !== null;
        },
        toArray : function (nodes)//转化为数组操作
        {//将节点转化为数组
            try {
                return Array.prototype.slice.call(nodes);
            } catch (e) {
                var arr = [];
                for (var i = 0, l = nodes.length; i < l; i++) {
                    arr.push(nodes[i]);
                }
                return arr;
            }
        },
        _match : function (elm, selector)
        {//对比两个节点元素是否相同
            if (!selector) return true;

            var tag = selector.uTag,
                id = selector.id,
                classes = selector.classes;

            return (elm.nodeType === 1) &&
            !(tag && tag !== elm.tagName.toLowerCase()) &&//如果是元素选择器则判断tagName是否相同
            !(id && id !== elm.id) &&//如果是Id选择器则判断tagName是否相同
            !(classes && !selectorFun._hasClasses(elm, classes));//如果是class选择器则判断tagName是否相同
        },
        _sel : function (selector)
        {//将选择器按照正则匹配
            var f, out = [], attr,attrL,attrFlag=false,refFlag=false,uTag,isAttr;
            if (typeof selector === "string")
            {           
                while (selector)
                {
                    attr = selector.match(attributes);
                    f = selector.match(re_selector_fragment);
                    if(!!attr) attrFlag = true;//判断是否为属性选择器
                    if(!!f && !!f[2]) refFlag = true;//判断是否为tagName选择器，因为属性选择器只判断[]之间的，不判断前面的标签，所以得加上这一步                    
                    isAttr = attrFlag && refFlag;//判断是为属性选择器

                    if (f[0] === "") break;//如果什么都没有匹配到
                    if(!isAttr){uTag = f[2] || ""}
                    out.push({
                        rel: f[1],//分隔符
                        uTag: uTag,//标签名
                        id: f[3],//id名
                        classes: (f[4]) ? f[4].split(".") : undef,//类名
                        attr: {
                            tagName : isAttr && selectorFun.trim(f[0]) || undef,
                            attrName : isAttr && attr[2] || undef,
                            attrValue : isAttr && attr[6] || undef
                        }
                    });
                    var sliceLen = attrFlag && refFlag ? f[0].length + attr[0].length : f[0].length;
                    attrFlag=false,refFlag=false;                    
                    selector = selector.substring(sliceLen);                    
                }
            }
            if(!out.length){out = [{}];}            
            return out;
        }
    };
    var E = function(selector,context){
        selector = selectorFun.trim(selector);
        context = context ? context : doc;
        if(!context.querySelectorAll){//最后要换成context.querySelectorAll            
            return context.querySelectorAll(selector);//高版本浏览器支持querySelectorAll的就用这个方法
        }
        else
        {//不支持querySelectorAll                       
            if(rcomma.exec(selector)){//群组选择器，也就是有逗号的情况下                
                var selectorArr = selector.split(',');
                var selectorNewArr = [];
                for(var i=0;i<selectorArr.length;i++){                    
                   selectorNewArr = selectorNewArr.concat(E(selectorArr[i],context));
                }                
                return selectorNewArr;
            }
            else//单个选择器，非通用选择器
            {
                var refelm = context || win.document.documentElement,                    
                    results = [],
                    elements = [refelm];
                var con = 0;                
                selectorFragments = (!cache[selector]) ? selectorFun._sel(selector) : cache[selector];//将单个选择器中的所有链式子选择器分离开来                            
                for(var i in cache){con++;}
                if(con > 49){for(var i in cache){delete cache[i];break;}}
                cache[selector] = selectorFragments;//将正则匹配的选择符及结果进行缓存，再存取该选择器时就走缓存             
                for (var i=0;i<selectorFragments.length;i++)//遍历子选择器
                {
                    fragment = selectorFragments[i];//子选择器中的一个                
                    for (var j=0;j<elements.length;j++)//遍历上下文
                    {
                        elm = elements[j];//上下文
                        if(fragment.attr.tagName){//如果为属性选择器
                            var children = elm.getElementsByTagName('*');
                            for(var w=0;w<children.length;w++){
                                var el = children[w];
                                var attr = fragment.attr;
                                if(el.nodeType == 1 && el.tagName.toLowerCase() == attr.tagName){                                    
                                    if(attr.attrName == 'class'){//IE下兼容性问题，getAttribute获取class时要用className                                        
                                        var attrClass = el.getAttribute(attr.attrName) || el.className;
                                        if(attrClass == attr.attrValue){
                                            results.push(children[w]);
                                        }
                                    }
                                    else if(el.getAttribute(attr.attrName) == attr.attrValue){                                                                        
                                        results.push(children[w]);
                                    }                                                                
                                }
                            }                            
                        }
                        else//如果不是属性选择器
                        {
                            switch (fragment.rel)//检查该属性，判断选择器类型
                            {
                                case ">"://子选择器
                                    var children = elm.childNodes;                                    
                                    for (var z=0;z<children.length;z++)
                                    {
                                        if (selectorFun._match(children[z], fragment))
                                        {
                                            results.push(children[z]);
                                        }
                                    }
                                    break;
                                    
                               case "~"://同层中所有符合条件的选择器
                                    while (elm = elm.nextSibling)
                                    {
                                        if (selectorFun._match(elm, fragment))
                                        {
                                            if (selectorFun.contains(elm,results))
                                            {
                                                break;
                                            }
                                            results.push(elm);
                                        }
                                    }
                                    break;

                                case "+"://兄弟选择器
                                    while ((elm = elm.nextSibling) && elm.nodeType !== 1) { }                        
                                    if (elm && selectorFun._match(elm, fragment))
                                    {
                                        results.push(elm);
                                    }
                                    
                                    break;

                                default://其他情况，比如后代选择器
                                    elms = selectorFun.find(elm, fragment);                             
                                    if (i > 0)
                                    {
                                        for (e = 0, le = elms.length; e < le; e++)
                                        {
                                            if (!selectorFun.contains(elms[e]),results) {
                                                results.push(elms[e]);
                                            }
                                        }
                                    }
                                    else { results = results.concat(elms); }
                                    break;
                            }
                        }                        
                    }
                    if (!results.length) {
                        return [];
                    }
                    elements = results.splice(0, results.length);
                }
                return elements;
            }
        }       
    };
    win.E = E;
 })(window,document);