// ==UserScript==
// @name         Geocache Baidu Jumper
// @version      1.0
// @description  Read Geocache coordinates and add a button to Baidu map
// @author       Xelminoe
// @match        https://www.geocaching.com/geocache/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 解析 DMM 格式字符串为十进制度
    function parseDMM(coordStr) {
        const match = coordStr.match(/([NS])\s*(\d+)°\s*([\d.]+)\s*([EW])\s*(\d+)°\s*([\d.]+)/i);
        if (!match) return null;

        let [, latDir, latDeg, latMin, lonDir, lonDeg, lonMin] = match;
        let lat = parseInt(latDeg) + parseFloat(latMin) / 60;
        let lon = parseInt(lonDeg) + parseFloat(lonMin) / 60;
        if (latDir.toUpperCase() === 'S') lat = -lat;
        if (lonDir.toUpperCase() === 'W') lon = -lon;
        return { lat, lon };
    }

    // 构造百度地图跳转 URL
    function createBaiduMapURL(lat, lon) {
        return `https://api.map.baidu.com/marker?location=${lat},${lon}&output=html&coord_type=wgs84`;
    }

    // 创建浮动 UI
    function createFloatingUI(defaultLatLon) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 20px;
            background: #ffffffcc;
            border: 1px solid #ccc;
            border-radius: 10px;
            padding: 10px;
            z-index: 9999;
            font-size: 14px;
            box-shadow: 0 0 8px #888;
        `;

        container.innerHTML = `
            <input type="text" id="customCoords" placeholder="输入 DMM 或 lat,lon"
                style="width: 180px; margin-bottom: 5px;"
                value="${defaultLatLon.lat},${defaultLatLon.lon}">
            <br>
            <button id="gotoBaiduMap">跳转百度地图</button>
        `;

        document.body.appendChild(container);

        document.getElementById('gotoBaiduMap').onclick = () => {
            const val = document.getElementById('customCoords').value.trim();

            let coords = null;
            if (val.match(/^[\d.\-]+\s*,\s*[\d.\-]+$/)) {
                // 十进制度
                const [lat, lon] = val.split(',').map(parseFloat);
                if (!isNaN(lat) && !isNaN(lon)) coords = { lat, lon };
            } else {
                // 尝试解析 DMM 格式
                coords = parseDMM(val);
            }

            if (coords) {
                const url = createBaiduMapURL(coords.lat, coords.lon);
                window.open(url, '_blank');
            } else {
                alert("请输入合法坐标（十进制度或 DMM）");
            }
        };
    }

    // 页面入口
    function init() {
        const coordText = document.getElementById('uxLatLon')?.textContent;
        if (!coordText) return;
        const coords = parseDMM(coordText);
        if (!coords) return;
        createFloatingUI(coords);
    }

    // 监听器中只负责触发 init()
    const observer = new MutationObserver((mutations, obs) => {
        if (document.getElementById('uxLatLon')) {
            init();
            obs.disconnect(); // 只执行一次后停止监听
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
