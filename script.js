console.log("JavaScript 已成功載入！");

// ==============================
// 1. 全域變數與狀態管理
// ==============================
let restaurants = [];
let categoryBoxes = [];
let isSpinning = false; // 紀錄目前是否正在播放動畫，防止亂點出錯
let favorites = JSON.parse(localStorage.getItem('ncu_favorites')) || []; // 我的最愛名單

const categoryIcon = {
    "水餃/湯包": "Icon/水餃.svg",
    "早午餐": "Icon/早午餐.svg",
    "便利商店": "Icon/便利商店.svg",
    "飯": "Icon/飯.svg",
    "義大利麵": "Icon/義大利麵.svg",
    "漢堡/潛艇堡": "Icon/漢堡.svg",
    "麵食": "Icon/麵食.svg",
    "飲料": "Icon/飲料.svg",
    "鹹水雞": "Icon/鹹水雞.svg",
    "火鍋": "Icon/火鍋.svg",
    "蛋餅": "Icon/蛋餅.svg",
    "牛排": "Icon/牛排.svg",
    "滷味/關東煮": "Icon/滷味關東煮.svg",
    "自助餐": "Icon/自助餐.svg",
    "鬆餅": "Icon/鬆餅.svg",
    "甜食": "Icon/甜食.svg",
    "炸物": "Icon/炸物.svg"
};

// ==============================
// 2. 初始化與資料載入
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    fetch("restaurants_updated.json")
        .then(response => response.json())
        .then(data => {
            restaurants = data;
            console.log("餐廳資料載入成功！");
            renderCheckboxes();
            setupEventListeners(); // 綁定所有事件
        });
});

// ==============================
// 3. 核心邏輯 (營業時間與篩選)
// ==============================
function isOpenDuringSlot(restaurant, slot) {
    if (slot === "none") return true; 

    const today = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[today.getDay()];
    const todayHours = restaurant.openingHours[currentDay];

    if (!todayHours || todayHours.length === 0) return false;

    let targetStartMins, targetEndMins;
    if (slot === "lunch") {
        targetStartMins = 11 * 60 + 30;
        targetEndMins = 13 * 60 + 30;
    } else if (slot === "dinner") {
        targetStartMins = 17 * 60 + 30;
        targetEndMins = 19 * 60 + 30;
    }

    for (let i = 0; i < todayHours.length; i++) {
        const openParts = todayHours[i].open.split(":");
        const closeParts = todayHours[i].close.split(":");
        const openMins = parseInt(openParts[0]) * 60 + parseInt(openParts[1]);
        let closeMins = parseInt(closeParts[0]) * 60 + parseInt(closeParts[1]);

        if (closeMins <= openMins) closeMins += 24 * 60; 

        if (openMins < targetEndMins && closeMins > targetStartMins) {
            return true;
        }
    }
    return false;
}

function getFilteredRestaurants() {
    const filtered = [];
    const checkedBoxes = document.querySelectorAll(".restaurantCheckbox:checked");
    const onlyFavorites = document.getElementById("onlyFavorites").checked;

    checkedBoxes.forEach(function(checkbox) {
        const restaurant = restaurants.find(r => r.name === checkbox.dataset.name);
        if (restaurant) {
            if (onlyFavorites && !favorites.includes(restaurant.name)) return;
            filtered.push(restaurant);
        }
    });
    return filtered;
}

// ==============================
// 4. UI 渲染與畫面更新
// ==============================
function renderCheckboxes() {
    const slot = document.querySelector('input[name="timeSlot"]:checked').value;
    const selectedLocation = document.getElementById("locationSelector").value;
    const restaurantCheckboxes = document.getElementById("restaurantCheckboxes");
    
    restaurantCheckboxes.innerHTML = ""; 
    const groups = {};
    const closedRestaurants = [];

    restaurants.forEach(function(restaurant){
        if (selectedLocation !== "all" && restaurant.place !== selectedLocation) return;
        const isOpen = (slot === "all") ? true : isOpenDuringSlot(restaurant, slot);
        
        if (isOpen) {
            const type = restaurant.type;
            if(!groups[type]) groups[type] = [];
            groups[type].push(restaurant);
        } else {
            closedRestaurants.push(restaurant);
        }
    });

    function renderCategory(typeName, restaurantList, isOpen) {
        const iconHtml = categoryIcon[typeName] 
            ? `<img src="${categoryIcon[typeName]}" class="categoryIcon">` 
            : (isOpen ? `<span style="font-size: 24px; margin-right: 8px; vertical-align: middle;">🍽️</span>` : `<span style="font-size: 24px; margin-right: 8px; vertical-align: middle;">💤</span>`);
            
        const isChecked = isOpen ? "checked" : ""; 
        const displayStyle = isOpen ? "" : "display: none;";
        let listHtml = "";

        restaurantList.forEach(function(restaurant) {
            listHtml += `
                <label class="restaurantItem">
                    <input type="checkbox" class="restaurantCheckbox" data-name="${restaurant.name}" ${isChecked}>
                    <span class="clickable-name" onclick="showSpecificCard(event, '${restaurant.name}')">
                        ${restaurant.name}
                    </span>
                </label>
            `;
        });

        restaurantCheckboxes.innerHTML += `
            <div class="categoryBox" data-type="${typeName}">
                <div class="categoryTitle"> 
                    <input type="checkbox" class="categoryCheckbox" ${isChecked}>
                    <span class="categoryName">
                        ${iconHtml}
                        ${typeName} (${restaurantList.length})
                    </span>
                </div>
                <div class="restaurantList" style="${displayStyle}">
                    ${listHtml}
                </div>
            </div>
        `;
    }

    for (const type in groups) renderCategory(type, groups[type], true);
    if (closedRestaurants.length > 0) {
        let slotNameText = slot === "lunch" ? "午餐未營業" : (slot === "dinner" ? "晚餐未營業" : "目前未營業");
        renderCategory(slotNameText, closedRestaurants, false);
    }

    // 重新綁定勾選框事件
    categoryBoxes = document.querySelectorAll(".categoryBox");
    categoryBoxes.forEach(function(box){
        const list = box.querySelector(".restaurantList");
        const categoryCheckbox = box.querySelector(".categoryCheckbox");
        const restCheckboxes = box.querySelectorAll(".restaurantCheckbox");

        categoryCheckbox.addEventListener("change", function(){
            restCheckboxes.forEach(cb => cb.checked = categoryCheckbox.checked);
            categoryCheckbox.indeterminate = false;
            updatePreview(); 
        });

        restCheckboxes.forEach(cb => cb.addEventListener("change", updateCategoryCheckbox));

        const categoryName = box.querySelector(".categoryName");
        categoryName.addEventListener("click", function(){
            const currentDisplay = window.getComputedStyle(list).display;
            list.style.display = currentDisplay === "none" ? "block" : "none";
        });
    });
    
    updateCategoryCheckbox();
}

function updateCategoryCheckbox() {
    categoryBoxes.forEach(function(box){
        const categoryCheckbox = box.querySelector(".categoryCheckbox");
        const restCheckboxes = box.querySelectorAll(".restaurantCheckbox");
        let checkedCount = 0;

        restCheckboxes.forEach(cb => { if(cb.checked) checkedCount++; });

        if(restCheckboxes.length > 0 && checkedCount === restCheckboxes.length) {
            categoryCheckbox.checked = true;
            categoryCheckbox.indeterminate = false;
        } else if (checkedCount === 0) {
            categoryCheckbox.checked = false;
            categoryCheckbox.indeterminate = false;
        } else {
            categoryCheckbox.checked = false;
            categoryCheckbox.indeterminate = true;
        }
    });
    updatePreview();
}

function updatePreview() {
    if (isSpinning) return; 

    const result = document.getElementById("result");
    const drawMethod = document.querySelector('input[name="drawMethod"]:checked').value;
    const filtered = getFilteredRestaurants();

    if (filtered.length === 0) {
        result.innerHTML = "⚠️ 該條件下沒有餐廳，請重新選擇";
        return;
    }

    if (drawMethod === "roulette") {
        const uniqueCategories = [...new Set(filtered.map(r => r.type))];
        result.innerHTML = `
            <div class="wheel-container">
                <div class="wheel-pointer"></div>
                <canvas id="wheelCanvas" width="500" height="500" class="wheel-canvas"></canvas>
            </div>
            <p style="font-size:20px; font-weight:bold; margin-top:15px; color: #ff9800;">點擊「開始抽！」來啟動兩階段轉盤！</p>
        `;
        drawWheel(uniqueCategories);

    } else if (drawMethod === "gacha") {
        result.innerHTML = `
            <div class="gacha-machine-container" style="transform: scale(0.85); margin-top: 0;">
                <div class="gacha-globe">
                    <div class="gacha-ball ball-1"></div>
                    <div class="gacha-ball ball-2"></div>
                    <div class="gacha-ball ball-3"></div>
                    <div class="gacha-ball ball-4"></div>
                </div>
                <div class="gacha-base">
                    <div class="gacha-knob"></div>
                    <div class="gacha-chute"></div>
                </div>
            </div>
            <p style="font-size:20px; font-weight:bold; color: #ff9800;">扭蛋機準備就緒！點擊開始抽！</p>
        `;
    } else {
        result.innerHTML = `
            <div style="font-size: 80px; margin: 30px 0;">🎲</div>
            <p style="font-size:20px; font-weight:bold; color: #ff9800;">準備好秒抽了嗎？</p>
        `;
    }
}

// ==============================
// 5. 我的最愛連動功能
// ==============================
function renderFavoritesList() {
    const listDiv = document.getElementById('favoritesList');
    if (!listDiv) return;
    
    if (favorites.length === 0) {
        listDiv.innerHTML = '<span class="fav-empty">目前沒有收藏，快去抽卡點愛心！</span>';
        return;
    }
    listDiv.innerHTML = favorites.map(name => `<span class="fav-tag">${name}</span>`).join('');
}

window.toggleFavList = function() {
    if (typeof renderFavoritesList === "function") renderFavoritesList();

    const isChecked = document.getElementById("onlyFavorites").checked;
    const listDiv = document.getElementById("favoritesList");
    
    listDiv.style.display = isChecked ? "block" : "none";

    const checkboxes = document.querySelectorAll(".restaurantCheckbox");
    checkboxes.forEach(cb => {
        if (isChecked) {
            cb.checked = favorites.includes(cb.dataset.name);
        } else {
            cb.checked = true;
        }
    });

    if (typeof updateCategoryCheckbox === "function") updateCategoryCheckbox();
    if (typeof updatePreview === "function") updatePreview();
};

window.toggleFavorite = function(name) {
    const index = favorites.indexOf(name);
    if (index > -1) {
        favorites.splice(index, 1); 
    } else {
        favorites.push(name);      
    }
    localStorage.setItem('ncu_favorites', JSON.stringify(favorites));

    const btn = document.getElementById('favBtn');
    if (btn) btn.innerHTML = favorites.includes(name) ? '❤️' : '🤍';

    renderFavoritesList();
};

// ==============================
// 6. 動畫繪製 (轉盤)
// ==============================
function drawWheel(labels) {
    const canvas = document.getElementById("wheelCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const radius = canvas.width / 2;
    const totalItems = labels.length;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    if (totalItems === 0) return;

    const sliceAngle = (2 * Math.PI) / totalItems;

    for (let i = 0; i < totalItems; i++) {
        const startAngle = i * sliceAngle - (Math.PI / 2); 
        const endAngle = (i + 1) * sliceAngle - (Math.PI / 2);

        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, startAngle, endAngle);
        ctx.fillStyle = `hsl(${(i * 360) / totalItems}, 70%, 65%)`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff";
        ctx.stroke();

        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        let text = labels[i];
        if(text.length > 10) text = text.substring(0, 10) + '...';
        ctx.fillText(text, radius - 30, 7); 
        ctx.restore();
    }
}

// ==============================
// 7. Lightbox 功能
// ==============================
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");

function openImage(image){
    lightboxImage.src = image;
    lightbox.style.display = "flex";
}
lightbox.addEventListener("click", () => lightbox.style.display = "none");

// ==============================
// 8. 綁定所有事件監聽器
// ==============================
function setupEventListeners() {
    // 綁定時段切換
    document.querySelectorAll('input[name="timeSlot"]').forEach(radio => 
        radio.addEventListener("change", () => renderCheckboxes())
    );
    
    // 綁定抽籤方式切換
    document.querySelectorAll('input[name="drawMethod"]').forEach(radio => 
        radio.addEventListener("change", updatePreview)
    );

    // 全選與取消按鈕
    document.getElementById("selectAllBtn").addEventListener("click", function() {
        document.querySelectorAll(".restaurantCheckbox").forEach(cb => cb.checked = true);
        updateCategoryCheckbox();
    });

    document.getElementById("deselectAllBtn").addEventListener("click", function() {
        document.querySelectorAll(".restaurantCheckbox").forEach(cb => cb.checked = false);
        updateCategoryCheckbox();
    });

    // 側邊面板開關 (左側與右側)
    const togglePanelBtn = document.getElementById("togglePanelBtn");
    const closePanelBtn = document.getElementById("closePanelBtn");
    const restaurantPanel = document.querySelector(".restaurantPanel");
    if (togglePanelBtn) togglePanelBtn.addEventListener("click", () => restaurantPanel.classList.toggle("open"));
    if (closePanelBtn) closePanelBtn.addEventListener("click", () => restaurantPanel.classList.remove("open"));

    const toggleLeftMenuBtn = document.getElementById("toggleLeftMenuBtn");
    const closeLeftMenuBtn = document.getElementById("closeLeftMenuBtn");
    const leftMenu = document.getElementById("leftMenu");
    if (toggleLeftMenuBtn) toggleLeftMenuBtn.addEventListener("click", () => leftMenu.classList.toggle("open"));
    if (closeLeftMenuBtn) closeLeftMenuBtn.addEventListener("click", () => leftMenu.classList.remove("open"));

    // 防呆機制：手動勾選餐廳時，自動解除「我的最愛」模式
    document.getElementById("restaurantCheckboxes").addEventListener("change", function(e) {
        if (e.target.tagName.toLowerCase() === "input" && e.target.type === "checkbox") {
            const favSwitch = document.getElementById("onlyFavorites");
            if (favSwitch.checked) {
                favSwitch.checked = false;
                document.getElementById("favoritesList").style.display = "none";
            }
            if (typeof updatePreview === "function") updatePreview();
        }
    });
    
    document.getElementById("onlyFavorites").addEventListener("change", updatePreview);
}

// ==============================
// 9. 開始抽籤按鈕核心邏輯
// ==============================
document.getElementById("pickButton").addEventListener("click", function () {
    // UX 優化：開始抽籤時，自動收起左右兩側選單
    const leftMenu = document.querySelector('.leftMenu');
    const rightPanel = document.querySelector('.restaurantPanel');
    if (leftMenu) { leftMenu.classList.remove('open', 'active', 'show'); leftMenu.style.left = ""; }
    if (rightPanel) { rightPanel.classList.remove('open', 'active', 'show'); rightPanel.style.right = ""; }
    
    if (isSpinning) return; 

    const filteredRestaurants = getFilteredRestaurants();
    const result = document.getElementById("result");

    if (filteredRestaurants.length === 0) {
        result.innerHTML = "⚠️ 請至少選擇一家餐廳";
        return;
    }

    isSpinning = true; 
    const drawMethod = document.querySelector('input[name="drawMethod"]:checked').value;
    
    // 預先決定最終贏家
    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const randomRestaurant = filteredRestaurants[randomIndex];
    const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
    const todayHours = randomRestaurant.openingHours[todayName];

    // 隨機卡片背景
    const randomNum = Math.floor(Math.random() * 29) + 1;
    const randomCardBg = 'card/' + randomNum + '.jpg';
    
    // 判斷愛心狀態
    const isFav = favorites.includes(randomRestaurant.name);
    const favBtnText = isFav ? "❤️" : "🤍";

    // 組合最終顯示的卡片 HTML (抽籤版)
    const finalResultHtml = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${randomCardBg}'); background-size: cover; background-position: center; z-index: 0; opacity: 0.85;"></div>
        <div style="position: relative; z-index: 1;">
            <h2 class="restaurantTitle">
                <img src="${randomRestaurant.restaurantImage}" class="restaurantImage">
                ${randomRestaurant.name}
            </h2>
            <button id="favBtn" class="fav-icon-btn" onclick="toggleFavorite('${randomRestaurant.name}')">
                ${favBtnText}
            </button>
            
            <p class="restaurantType">
                類型：${randomRestaurant.type}
                <span class="typeIcon">${randomRestaurant.typeIcon}</span>
            </p>
            <p>地點：${randomRestaurant.place}</p>
            <p>今日營業時間：</p>
            <p>
                ${todayHours && todayHours.length > 0 ? todayHours.map(time => time.open + " - " + time.close).join("<br>") : "今日公休"}
            </p>
            <p>菜單：</p>

            <div class="menuImages">
                ${randomRestaurant.menuImages && randomRestaurant.menuImages.length > 0
                    ? randomRestaurant.menuImages.map(image => `<img src="${image}" class="menuImage" onclick="openImage('${image}')">`).join("")
                    : "目前沒有菜單圖片"
                }
            </div>
            <br>
            <a href="${randomRestaurant.map}" target="_blank">查看位置</a>
            <br><br>
            <button onclick="isSpinning=false; updatePreview();" style="padding:10px 20px; background:#ccc; border:none; border-radius:8px; cursor:pointer;">重新抽籤</button>
        </div>
    `;

    // 依據不同抽籤方式執行對應動畫
    if (drawMethod === "basic") {
        result.innerHTML = finalResultHtml;
        isSpinning = false;

    } else if (drawMethod === "roulette") {
        const uniqueCategories = [...new Set(filteredRestaurants.map(r => r.type))];
        const winningCategory = randomRestaurant.type;
        const catIndex = uniqueCategories.indexOf(winningCategory);

        result.innerHTML = `
            <div class="wheel-container">
                <div class="wheel-pointer"></div>
                <canvas id="wheelCanvas" width="500" height="500" class="wheel-canvas"></canvas>
            </div>
            <p style="font-size:20px; font-weight:bold; margin-top:15px; color: #ff9800;" id="wheelStatus">第一階段：抽出種類中... 🎡</p>
        `;

        drawWheel(uniqueCategories);
        const canvas1 = document.getElementById("wheelCanvas");
        const sliceDeg1 = 360 / uniqueCategories.length;
        const randomOffset1 = (Math.random() * 0.8 - 0.4) * sliceDeg1; 
        const finalRotation1 = (360 * 6) - (catIndex * sliceDeg1 + sliceDeg1 / 2 + randomOffset1);

        setTimeout(() => canvas1.style.transform = `rotate(${finalRotation1}deg)`, 50);

        setTimeout(() => {
            const statusP = document.getElementById("wheelStatus");
            if(statusP) statusP.innerHTML = `抽中「<span style="color:#e74c3c; font-size:24px;">${winningCategory}</span>」！準備抽出店家... ✨`;

            setTimeout(() => {
                const restaurantsInCat = filteredRestaurants.filter(r => r.type === winningCategory);
                const restIndex = restaurantsInCat.indexOf(randomRestaurant);

                result.innerHTML = `
                    <div class="wheel-container">
                        <div class="wheel-pointer"></div>
                        <canvas id="wheelCanvas" width="500" height="500" class="wheel-canvas"></canvas>
                    </div>
                    <p style="font-size:20px; font-weight:bold; margin-top:15px; color: #ff9800;" id="wheelStatus2">第二階段：抽出店家！ 🎯</p>
                `;

                drawWheel(restaurantsInCat.map(r => r.name));
                const canvas2 = document.getElementById("wheelCanvas");
                const sliceDeg2 = 360 / restaurantsInCat.length;
                const randomOffset2 = (Math.random() * 0.8 - 0.4) * sliceDeg2;
                const finalRotation2 = (360 * 6) - (restIndex * sliceDeg2 + sliceDeg2 / 2 + randomOffset2);

                setTimeout(() => canvas2.style.transform = `rotate(${finalRotation2}deg)`, 50);

                setTimeout(() => {
                    result.innerHTML = finalResultHtml;
                    isSpinning = false; 
                }, 4200);
            }, 1500);
        }, 4200);

    } else if (drawMethod === "gacha") {
        const gachaColors = ["#ff4757", "#1e90ff", "#2ed573", "#ffa502", "#9b59b6", "#e84393"];
        const randomColor = gachaColors[Math.floor(Math.random() * gachaColors.length)];

        result.innerHTML = `
            <div class="gacha-machine-container" id="gachaMachine">
                <div class="gacha-globe">
                    <div class="gacha-ball ball-1"></div>
                    <div class="gacha-ball ball-2"></div>
                    <div class="gacha-ball ball-3"></div>
                    <div class="gacha-ball ball-4"></div>
                </div>
                <div class="gacha-base">
                    <div class="gacha-knob" id="gachaKnob"></div>
                    <div class="gacha-chute"></div>
                </div>
                <div class="dropped-ball" id="droppedBall" style="background: linear-gradient(to bottom, ${randomColor} 50%, #fff 50%);"></div> 
            </div>
            <p style="font-size:20px; font-weight:bold; color: #ff9800; margin-top:20px;" id="gachaStatus">扭蛋瘋狂攪拌中... 🌀</p>
        `;

        const knob = document.getElementById("gachaKnob");
        const droppedBall = document.getElementById("droppedBall");
        const statusP = document.getElementById("gachaStatus");
        const innerBalls = document.querySelectorAll(".gacha-ball");

        innerBalls.forEach(ball => ball.classList.add("mixing"));

        setTimeout(() => {
            innerBalls.forEach(ball => ball.classList.remove("mixing")); 
            statusP.innerText = "轉動旋鈕中... ⚙️";
            knob.classList.add("turn");
        }, 1000);

        setTimeout(() => {
            statusP.innerText = "扭蛋掉出來了！ 🎁";
            droppedBall.classList.add("drop");
        }, 1500);

        setTimeout(() => {
            result.innerHTML = `
                <div class="zoom-ball-container" id="zoomBall">
                    <div class="zoom-ball-top" style="background: ${randomColor};"></div>
                    <div class="gacha-result-icon">🎉</div>
                    <div class="zoom-ball-bottom"></div>
                </div>
                <p style="font-size:20px; font-weight:bold; color: #ff9800; margin-top:20px;" id="gachaStatus2">打開扭蛋...</p>
            `;
            
            const zoomBall = document.getElementById("zoomBall");
            const statusP2 = document.getElementById("gachaStatus2");
            
            setTimeout(() => zoomBall.classList.add("show"), 50);
            setTimeout(() => {
                statusP2.innerText = "登愣！ ✨";
                zoomBall.classList.add("open");
            }, 800);

            setTimeout(() => {
                result.innerHTML = finalResultHtml;
                isSpinning = false; 
            }, 2000);
        }, 2400); 
    }
});

// ==============================
// 10. 點擊側邊欄名字，直接顯示餐廳卡片
// ==============================
window.showSpecificCard = function(event, restaurantName) {
    event.preventDefault();
    event.stopPropagation();

    const selectedRestaurant = restaurants.find(r => r.name === restaurantName);
    if (!selectedRestaurant) return;

    const isFav = favorites.includes(selectedRestaurant.name);
    const favBtnText = isFav ? "❤️" : "🤍";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[new Date().getDay()];
    const todayHours = selectedRestaurant.openingHours ? selectedRestaurant.openingHours[todayName] : [];
    
    const randomNum = Math.floor(Math.random() * 29) + 1;
    const randomCardBg = 'card/' + randomNum + '.jpg';

    const finalResultHtml = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${randomCardBg}'); background-size: cover; background-position: center; z-index: 0; opacity: 0.85;"></div>
        <div style="position: relative; z-index: 1;">
            <h2 class="restaurantTitle">
                <img src="${selectedRestaurant.restaurantImage}" class="restaurantImage">
                ${selectedRestaurant.name}
            </h2>
            <button id="favBtn" class="fav-icon-btn" onclick="toggleFavorite('${selectedRestaurant.name}')">
                ${favBtnText}
            </button>
            
            <p class="restaurantType">
                類型：${selectedRestaurant.type}
                <span class="typeIcon">${selectedRestaurant.typeIcon}</span>
            </p>
            <p>地點：${selectedRestaurant.place}</p>
            <p>今日營業時間：</p>
            <p>
                ${todayHours && todayHours.length > 0 ? todayHours.map(time => time.open + " - " + time.close).join("<br>") : "今日公休"}
            </p>
            <p>菜單：</p>

            <div class="menuImages">
                ${selectedRestaurant.menuImages && selectedRestaurant.menuImages.length > 0
                    ? selectedRestaurant.menuImages.map(image => `<img src="${image}" class="menuImage" onclick="openImage('${image}')">`).join("")
                    : "目前沒有菜單圖片"
                }
            </div>
            <br>
            <a href="${selectedRestaurant.map}" target="_blank">查看位置</a>
            <br><br>
            <button onclick="updatePreview();" style="padding:10px 20px; background:#f3f4f6; color:#111; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">返回抽籤</button>
        </div>
    `;

    const resultDiv = document.getElementById("result");
    if(resultDiv) resultDiv.innerHTML = finalResultHtml;

    // 自動關閉右側面板
    const rightPanel = document.querySelector('.restaurantPanel');
    if (rightPanel) {
        rightPanel.classList.remove('open');
    }
};

// ==============================
// 11. 動態地圖模式 (Leaflet.js) 與畫面切換
// ==============================
let ncuMap; // 宣告全域變數來裝地圖

function initMap() {
    if (ncuMap) {
        ncuMap.invalidateSize(); 
        return; 
    }

    // 1. 在建立地圖的時候，加上 { attributionControl: false } 把右下角的標籤徹底隱藏
    ncuMap = L.map('map', {
        attributionControl: false 
    }).setView([24.9682, 121.1944], 15);

    // 👇 1. 將剛剛複製的金鑰貼在引號裡面
    const maptilerKey = 'TKNU2YdrV041zVOiU9vy';

    // 👇 2. 載入 MapTiler 的 Dataviz Light (專門給開發者用的極簡無雜訊底圖)
    L.tileLayer('https://api.maptiler.com/maps/dataviz-light/256/{z}/{x}/{y}.png?key=' + maptilerKey, {
        maxNativeZoom: 20, // 支援高畫質放大到 20 級 (不會糊掉！)
        maxZoom: 22        // 強制允許放大到 22 級，讓蜘蛛網特效可以完美展開
    }).addTo(ncuMap);

    const markers = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 18 
    });

    restaurants.forEach(restaurant => {
        if (restaurant.coords) {
            const [lat, lng] = restaurant.coords.split(',').map(Number);
            const emojiIcon = restaurant.typeIcon || "🍽️";

            // 👇 升級 2：把圖標縮小，讓定位更精準
            const customMarkerIcon = L.divIcon({
                className: 'custom-map-marker',
                html: emojiIcon,
                iconSize: [24, 24],             // 從 30 縮小成 24
                iconAnchor: [12, 12],           // 錨點精準對齊正中心 (24 的一半)
                popupAnchor: [0, -12]           // 彈出卡片的高度跟著下修
            });

            const marker = L.marker([lat, lng], { icon: customMarkerIcon });
            
            marker.bindPopup(`
                <div style="text-align: center; min-width: 120px;">
                    <b style="font-size: 16px; color: #333;">${restaurant.name}</b><br>
                    <span style="font-size: 13px; color: #666;">${restaurant.type}</span><br>
                    <span style="font-size: 12px; color: #999;">📍 ${restaurant.place}</span>
                </div>
            `);

            markers.addLayer(marker);
        }
    });

    ncuMap.addLayer(markers);
}

document.addEventListener("DOMContentLoaded", () => {
    const mapLink = document.querySelectorAll(".menu-list li a")[1];
    if (mapLink) {
        mapLink.addEventListener("click", function(event) {
            event.preventDefault(); 
            
            // 隱藏抽籤 UI
            document.getElementById("result").style.display = "none";
            document.getElementById("pickButton").style.display = "none";
            document.getElementById("drawMethodSelector").style.display = "none";
            
            // 顯示地圖區塊
            document.getElementById("mapContainer").style.display = "block";
            document.getElementById("leftMenu").classList.remove("open");
            
            // 延遲一點點呼叫地圖，確保 mapContainer 已經顯示 (DOM 計算完成)，地圖才不會變形
            setTimeout(() => {
                initMap();
            }, 100);
        });
    }
});

window.backToDraw = function() {
    document.getElementById("mapContainer").style.display = "none";
    document.getElementById("result").style.display = "block";
    document.getElementById("pickButton").style.display = "block";
    document.getElementById("drawMethodSelector").style.display = "inline-flex"; 
};