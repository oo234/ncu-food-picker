console.log("JavaScript 已成功載入！");

let restaurants = [];

let categoryBoxes = [];

const categoryIcon = {
    "水餃":
    "Icon/水餃.svg",

    "早午餐":
    "Icon/早午餐.svg",

    "定食":
    "Icon/定食.svg",

    "泰式":
    "Icon/泰式.svg",

    "飯":
    "Icon/飯.svg",

    "義大利麵":
    "Icon/義大利麵.svg",

    "韓式":
    "Icon/韓式.svg"
};

// ==============================
// 載入餐廳資料
// ==============================
fetch("restaurants.json")
.then(function(response){

    return response.json();

})
.then(function(data){


    restaurants = data;


    console.log("餐廳資料載入成功！");
    console.log(restaurants);



    const restaurantCheckboxes =
    document.getElementById("restaurantCheckboxes");



    const groups = {};



    // 分類整理

    restaurants.forEach(function(restaurant){


        const type = restaurant.type;


        if(!groups[type]){

            groups[type] = [];

        }


        groups[type].push(restaurant);


    });



    console.log(groups);



    // 建立大分類

    for(const type in groups){


        restaurantCheckboxes.innerHTML += `

            <div class="categoryBox"
                 data-type="${type}">


                <div class="categoryTitle">


                    <input
                        type="checkbox"
                        class="categoryCheckbox"
                        checked
                    >


                    <span class="categoryName">


                        <img 
                            src="${categoryIcon[type]}"
                            class="categoryIcon"
                        >


                        ${type} (${groups[type].length})


                    </span>


                </div>


                <div class="restaurantList">


                </div>


            </div>


        `;


    }




    categoryBoxes =
    document.querySelectorAll(".categoryBox");



    // 建立小店

    categoryBoxes.forEach(function(box){


        const type =
        box.dataset.type;


        const list =
        box.querySelector(".restaurantList");



        const categoryCheckbox =
        box.querySelector(".categoryCheckbox");



        groups[type].forEach(function(restaurant){



            list.innerHTML += `


                <label class="restaurantItem">


                    <input
                        type="checkbox"
                        class="restaurantCheckbox"
                        data-name="${restaurant.name}"
                        checked
                    >


                    ${restaurant.name}


                </label>


            `;


        });



        const restaurantCheckboxes =
        box.querySelectorAll(".restaurantCheckbox");



        /*
            大分類控制小分類
        */

        categoryCheckbox.addEventListener(
        "change",
        function(){


            restaurantCheckboxes.forEach(function(cb){


                cb.checked =
                categoryCheckbox.checked;


            });


            categoryCheckbox.indeterminate=false;


        });





        /*
            小分類控制大分類
        */

        restaurantCheckboxes.forEach(function(cb){


            cb.addEventListener(
            "change",
            function(){


                updateCategoryCheckbox();


            });


        });





        /*
            點文字展開
        */

        const categoryName =
        box.querySelector(".categoryName");



        categoryName.addEventListener(
        "click",
        function(){


            if(list.style.display==="block"){


                list.style.display="none";


            }
            else{


                list.style.display="block";


            }


        });



    });


});

function updateCategoryCheckbox(){


    categoryBoxes.forEach(function(box){



        const categoryCheckbox =
        box.querySelector(".categoryCheckbox");



        const restaurantCheckboxes =
        box.querySelectorAll(".restaurantCheckbox");



        let checkedCount = 0;



        restaurantCheckboxes.forEach(function(cb){


            if(cb.checked){

                checkedCount++;

            }


        });



        if(
            checkedCount === restaurantCheckboxes.length
        ){

            categoryCheckbox.checked=true;

            categoryCheckbox.indeterminate=false;


        }

        else if(
            checkedCount===0
        ){

            categoryCheckbox.checked=false;

            categoryCheckbox.indeterminate=false;


        }

        else{


            categoryCheckbox.checked=false;

            categoryCheckbox.indeterminate=true;


        }



    });


}

// ==============================
// 全部選取 / 全部取消
// ==============================


const selectAll =
document.getElementById("selectAll");


const unselectAll =
document.getElementById("unselectAll");

// ==============================
// 全部選取
// ==============================

selectAll.addEventListener("click",function(){


    const checkboxes =
    document.querySelectorAll(".restaurantCheckbox");


    checkboxes.forEach(function(checkbox){


        checkbox.checked = true;


    });


    updateCategoryCheckbox();


});




// ==============================
// 全部取消
// ==============================

unselectAll.addEventListener("click",function(){


    const checkboxes =
    document.querySelectorAll(".restaurantCheckbox");


    checkboxes.forEach(function(checkbox){


        checkbox.checked = false;


    });


    updateCategoryCheckbox();


});
// ==============================
// 找到 HTML 裡的按鈕
// ==============================

// 找到 id="pickButton" 的按鈕
// 並把它存到 button 變數中
const button = document.getElementById("pickButton");
// 找到顯示結果的區域
const result = document.getElementById("result");
// ==============================
// 目前選擇的餐廳分類
// 預設全部
// ==============================



// ==============================
// 按鈕事件
// ==============================

// 當按鈕被點擊時
button.addEventListener("click", function () {

    // ==============================
    // 確認餐廳資料是否載入完成
    // ==============================

    if (restaurants.length === 0) {

        result.innerHTML = "⌛ 餐廳資料載入中，請稍後再試";

        return;

    }

    // ==============================
    // 取得勾選餐廳
    // ==============================

    const filteredRestaurants = [];


    const checkedBoxes =
    document.querySelectorAll(
        ".restaurantCheckbox:checked"
    );



    checkedBoxes.forEach(function(checkbox){


        const restaurant =
        restaurants.find(function(item){


            return item.name === checkbox.dataset.name;


        });


        if(restaurant){

            filteredRestaurants.push(restaurant);

        }


    });



    if(filteredRestaurants.length === 0){


        result.innerHTML =
        "⚠️ 請至少選擇一家餐廳";


        return;


    }

    // 隨機產生位置
    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);


    // 取得餐廳物件
    const randomRestaurant = filteredRestaurants[randomIndex];

    // ==============================
    // 取得今天的營業時間
    // ==============================

    // 取得今天的日期
    const today = new Date();

    // 星期名稱對照表
    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    // 今天是星期幾（例如 Monday）
    const todayName = days[today.getDay()];

    // 取得今天的營業時間
    const todayHours =
        randomRestaurant.openingHours[todayName];

    // 看看 Console 會印出什麼
    console.log("今天是：", todayName);
    console.log("今天營業時間：", todayHours);

    // 建立餐廳卡片
    result.innerHTML = `

        <h2 class="restaurantTitle">

            <img 
                src="${randomRestaurant.restaurantImage}"
                class="restaurantImage"
            >

            ${randomRestaurant.name}

        </h2>


        <p class="restaurantType">

            類型：
            ${randomRestaurant.type}


            <img 
                src="${randomRestaurant.typeIcon}"
                class="typeIcon"
            >

        </p>


        <p>
            🕒 今日營業時間：
        </p>


        <p>
            ${todayHours.map(function(time){

                return time.open + " - " + time.close;

            }).join("<br>")}
        </p>

        <p>
            🧾 菜單：
        </p>

        <div class="menuImages">

            ${
            randomRestaurant.menuImages 
            ?
            randomRestaurant.menuImages.map(function(image){

                return `
                    <img 
                        src="${image}"
                        class="menuImage"
                        onclick="openImage('${image}')"
                    >
                `;

            }).join("")
            :
            "目前沒有菜單圖片"
            }

        </div>

        <br>


        <a href="${randomRestaurant.map}" target="_blank">
            📍 查看位置
        </a>

    `;

});

// ==============================
// Lightbox 功能
// ==============================


// 找到 Lightbox 元件

const lightbox =
document.getElementById("lightbox");


const lightboxImage =
document.getElementById("lightboxImage");



// 點圖片時開啟

function openImage(image){

    console.log("點擊圖片：", image);


    lightboxImage.src = image;


    lightbox.style.display = "flex";

}



// 點黑色背景關閉

lightbox.addEventListener("click", function(){


    lightbox.style.display = "none";


});