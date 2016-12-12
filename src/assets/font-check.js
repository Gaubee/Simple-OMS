(function () {
    /**
     * 检查字体宽度
     * @param {Object} family
     */
    var checkOffsetWidth = function (family) {
        var node = document.createElement("p");
        qing.dom.setStyles(node, {
            "font-family": family + ", Times New Roman",
            "font-size": '300pt',
            "display": "inline",
            "position": "absolute",
            "top": "-10000px",
            "left": "-10000px"
        });
        qing.dom.addClass(node, "sp-font-detect");
        node.innerHTML = "mmmmmmmmml";
        document.body.appendChild(node);

        var width = node.offsetWidth;
        document.body.removeChild(node);
        return width;
    };
    /**
     * 获取文字实际宽度
     */
    var getDefaultWidth = function () {
        if (!_defaultWidth)
            _defaultWidth = checkOffsetWidth("Times New Roman");
        return _defaultWidth;
    };
    var familyWidth = 0;
    var defaultWidth = getDefaultWidth();
    familyWidth = checkOffsetWidth('Inziu Iosevka SC');
    if (familyWidth !== defaultWidth) {
        //下载字体
        var css = `
@font-face {
  font-family: InziuSC;
  src: local("Inziu Iosevka SC"),
       url("./assets/font/inziu-SC-regular.ttc");
}
`,
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        head.appendChild(style);
    }
} ());