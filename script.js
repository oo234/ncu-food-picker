console.log("JavaScript 已成功載入！");

let restaurants = [];
let categoryBoxes = [];
let isSpinning = false; // 紀錄目前是否正在播放動畫，防止亂點出錯

const categoryIcon = {
    "水餃": "Icon/水餃.svg",
    "早午餐": "Icon/早午餐.svg",
    "定食": "Icon/定食.svg",
    "泰式": "Icon/泰式.svg",
    "飯": "Icon/飯.svg",
    "義大利麵": "Icon/義大利麵.svg",
    "韓式": "Icon/韓式.svg"
};

// ==============================
// 判斷餐廳在特定時段是否有營業
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

// ==============================
// 取得目前勾選的餐廳清單
// ==============================
function getFilteredRestaurants() {
    const filtered = [];
    const checkedBoxes = document.querySelectorAll(".restaurantCheckbox:checked");
    checkedBoxes.forEach(function(checkbox){
        const restaurant = restaurants.find(r => r.name === checkbox.dataset.name);
        if(restaurant) filtered.push(restaurant);
    });
    return filtered;
}

// ==============================
// 畫出圓形轉盤 (修改為接收字串陣列)
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
// 即時更新預覽畫面
// ==============================
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
        // 轉盤模式預覽：顯示「種類」的大轉盤
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
// 繪製左側篩選清單
// ==============================
function renderCheckboxes() {
    const slot = document.querySelector('input[name="timeSlot"]:checked').value;
    const selectedLocation = document.getElementById("locationSelect").value;
    
    const restaurantCheckboxes = document.getElementById("restaurantCheckboxes");
    restaurantCheckboxes.innerHTML = ""; 

    const groups = {};
    const closedRestaurants = [];

    restaurants.forEach(function(restaurant){
        if (selectedLocation !== "all" && restaurant.place !== selectedLocation) return;

        const isOpen = isOpenDuringSlot(restaurant, slot);
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
                    ${restaurant.name}
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

    for(const type in groups){
        renderCategory(type, groups[type], true);
    }
    
    if (closedRestaurants.length > 0) {
        let slotNameText = slot === "lunch" ? "午餐未營業" : (slot === "dinner" ? "晚餐未營業" : "目前未營業");
        renderCategory(slotNameText, closedRestaurants, false);
    }

    categoryBoxes = document.querySelectorAll(".categoryBox");

    categoryBoxes.forEach(function(box){
        const list = box.querySelector(".restaurantList");
        const categoryCheckbox = box.querySelector(".categoryCheckbox");
        const restaurantCheckboxes = box.querySelectorAll(".restaurantCheckbox");

        categoryCheckbox.addEventListener("change", function(){
            restaurantCheckboxes.forEach(cb => cb.checked = categoryCheckbox.checked);
            categoryCheckbox.indeterminate = false;
            updatePreview(); 
        });

        restaurantCheckboxes.forEach(function(cb){
            cb.addEventListener("change", function(){
                updateCategoryCheckbox();
            });
        });

        const categoryName = box.querySelector(".categoryName");
        categoryName.addEventListener("click", function(){
            const currentDisplay = window.getComputedStyle(list).display;
            list.style.display = currentDisplay === "none" ? "block" : "none";
        });
    });
    
    updateCategoryCheckbox();
}

// ==============================
// 勾選狀態連動機制
// ==============================
function updateCategoryCheckbox(){
    categoryBoxes.forEach(function(box){
        const categoryCheckbox = box.querySelector(".categoryCheckbox");
        const restaurantCheckboxes = box.querySelectorAll(".restaurantCheckbox");
        let checkedCount = 0;

        restaurantCheckboxes.forEach(cb => { if(cb.checked) checkedCount++; });

        if(restaurantCheckboxes.length > 0 && checkedCount === restaurantCheckboxes.length){
            categoryCheckbox.checked = true;
            categoryCheckbox.indeterminate = false;
        }
        else if(checkedCount === 0){
            categoryCheckbox.checked = false;
            categoryCheckbox.indeterminate = false;
        }
        else{
            categoryCheckbox.checked = false;
            categoryCheckbox.indeterminate = true;
        }
    });
    
    updatePreview();
}

// ==============================
// 初始化載入
// ==============================
fetch("restaurants_updated.json")
.then(response => response.json())
.then(data => {
    restaurants = data;
    console.log("餐廳資料載入成功！");

    renderCheckboxes();

    const timeSlotRadios = document.querySelectorAll('input[name="timeSlot"]');
    timeSlotRadios.forEach(radio => radio.addEventListener("change", () => renderCheckboxes()));
    
    document.getElementById("locationSelect").addEventListener("change", () => renderCheckboxes());

    const drawMethodRadios = document.querySelectorAll('input[name="drawMethod"]');
    drawMethodRadios.forEach(radio => radio.addEventListener("change", updatePreview));
});

document.getElementById("selectAll").addEventListener("click",function(){
    document.querySelectorAll(".restaurantCheckbox").forEach(cb => cb.checked = true);
    updateCategoryCheckbox();
});

document.getElementById("unselectAll").addEventListener("click",function(){
    document.querySelectorAll(".restaurantCheckbox").forEach(cb => cb.checked = false);
    updateCategoryCheckbox();
});

// ==============================
// 抽籤按鈕事件
// ==============================
document.getElementById("pickButton").addEventListener("click", function () {
    if (isSpinning) return; 

    const filteredRestaurants = getFilteredRestaurants();
    const result = document.getElementById("result");

    if(filteredRestaurants.length === 0){
        result.innerHTML = "⚠️ 請至少選擇一家餐廳";
        return;
    }

    isSpinning = true; 
    
    const drawMethod = document.querySelector('input[name="drawMethod"]:checked').value;
    
    // 一開始先決定好最終贏家，後面的兩段轉盤都只是配合演出
    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const randomRestaurant = filteredRestaurants[randomIndex];

    const today = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[today.getDay()];
    const todayHours = randomRestaurant.openingHours[todayName];

    const finalResultHtml = `
        <h2 class="restaurantTitle">
            <img src="${randomRestaurant.restaurantImage}" class="restaurantImage">
            ${randomRestaurant.name}
        </h2>
        <p class="restaurantType">
            類型：${randomRestaurant.type}
            <img src="${randomRestaurant.typeIcon}" class="typeIcon">
        </p>
        <p>🕒 今日營業時間：</p>
        <p>
            ${todayHours && todayHours.length > 0 
                ? todayHours.map(time => time.open + " - " + time.close).join("<br>") 
                : "今日公休"
            }
        </p>
        <p>🧾 菜單：</p>
        <div class="menuImages">
            ${randomRestaurant.menuImages && randomRestaurant.menuImages.length > 0
                ? randomRestaurant.menuImages.map(image => `<img src="${image}" class="menuImage" onclick="openImage('${image}')">`).join("")
                : "目前沒有菜單圖片"
            }
        </div>
        <br>
        <a href="${randomRestaurant.map}" target="_blank">📍 查看位置</a>
        <br><br>
        <button onclick="isSpinning=false; updatePreview();" style="padding:10px 20px; background:#ccc; border:none; border-radius:8px; cursor:pointer;">重新抽籤</button>
    `;

    if (drawMethod === "basic") {
        result.innerHTML = finalResultHtml;
        isSpinning = false;

    } else if (drawMethod === "roulette") {
        
        // --- 兩階段轉盤邏輯 ---
        const uniqueCategories = [...new Set(filteredRestaurants.map(r => r.type))];
        const winningCategory = randomRestaurant.type;
        const catIndex = uniqueCategories.indexOf(winningCategory);

        // 階段一：準備種類轉盤
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

        setTimeout(() => {
            canvas1.style.transform = `rotate(${finalRotation1}deg)`;
        }, 50);

        // 等待第一段動畫轉完 (4.2秒)
        setTimeout(() => {
            const statusP = document.getElementById("wheelStatus");
            if(statusP) statusP.innerHTML = `抽中「<span style="color:#e74c3c; font-size:24px;">${winningCategory}</span>」！準備抽出店家... ✨`;

            // 停頓 1.5 秒讓使用者看清楚抽中了哪個種類
            setTimeout(() => {
                
                // 階段二：過濾出該種類底下的所有餐廳，並準備店家轉盤
                const restaurantsInCat = filteredRestaurants.filter(r => r.type === winningCategory);
                const restIndex = restaurantsInCat.indexOf(randomRestaurant);

                // 重新塞入 HTML 結構以重置 Canvas 轉動角度
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

                setTimeout(() => {
                    canvas2.style.transform = `rotate(${finalRotation2}deg)`;
                }, 50);

                // 等待第二段動畫轉完 (4.2秒)，顯示最終結果
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
            
            setTimeout(() => {
                zoomBall.classList.add("show");
            }, 50);

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
// Lightbox 功能
// ==============================
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");

function openImage(image){
    lightboxImage.src = image;
    lightbox.style.display = "flex";
}

lightbox.addEventListener("click", () => lightbox.style.display = "none");

// ==============================
// 側邊篩選面板 (Drawer) 控制
// ==============================
const togglePanelBtn = document.getElementById("togglePanelBtn");
const closePanelBtn = document.getElementById("closePanelBtn");
const restaurantPanel = document.querySelector(".restaurantPanel");

if (togglePanelBtn && restaurantPanel) {
    togglePanelBtn.addEventListener("click", () => restaurantPanel.classList.toggle("open"));
}
if (closePanelBtn && restaurantPanel) {
    closePanelBtn.addEventListener("click", () => restaurantPanel.classList.remove("open"));
}