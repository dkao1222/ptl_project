//const socket = io();  // 连接到服务器
function setup_main_grap(div_array) {
    
    d3.select('body').append('div').attr('class','col').attr('id','my_dataviz')

    const d3_container = d3.select('#my_dataviz')
    .append('div')
    .style('display','flex' )
    .style("flex-direction", "row")
    .style('width', window.innerWidth + "px")
    .style("height", window.innerHeight + "px")

    // 插入兩個區塊 div，並設置它們的高度比
    const blocks = d3_container.selectAll(".block")
    .data(div_array)  // 設置兩個區塊的比例 (70% 和 30%)
    .enter()
    .append("div")
    .attr("class", "block")
    .style("flex", d => d) // 根據比例分配空間
    //.style("border", "1px solid #000")  // 添加邊框
    //.style("padding", "20px")  // 設置內邊距
    //.style("box-sizing", "border-box")  // 使邊框和內邊距包含在區塊尺寸內
    .attr('id', (d ,i) => `map_area-${i + 1}`)
    //.text(d => `區塊 ${d * 100}%`);  // 顯示比例

    blocks.each(function(d, i) {
        const block = d3.select(this);  // 获取当前区块
        const sub_block = block.append('div')  // 为当前区块添加 sub-block
            .attr('class', 'sub-block')
            .attr('id', (d ,i) => `sub_area-${i + 1}`)
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('width', '100%')  // 宽度 100% 填满父元素
            .style('height', '100%');  // 高度 100% 填满父元素
    })

    
}

function setup_div_layer(sub_id, div_array) {
    d3.select(`#map_area-${sub_id}`).select('.sub-block')
    .selectAll('.inner-block')
    .data(div_array)  // 设置两个子区块的高度比例
    .enter()
    .append('div')
    .attr('class', 'inner-block')
    .style('flex', d => d)
    .attr('id', (d ,i) => `func_${sub_id}_area-${i + 1}`)
    //.style('border', '1px solid #000')
    //.style('box-sizing', 'border-box')
    //.style('padding', '10px')
    //.text((d, i) => `子區塊 ${i + 1} (比例: ${d * 100}%)`);
    
}

function setup_func_layer(sub_id, function_id, data_text) {
    d3.select(`#func_${sub_id}_area-${function_id}`)
    .append("div")
    
    .attr("class", "sub-block")
    .style('display', 'flex')
    .style('flex-direction', 'column')  // 垂直居中
    .style("align-items", "center") // 水平居中
    .style("justify-content", "center") 
    .style('width', '100%')  // 宽度 100% 填满父元素
    .append("button")
    .text(data_text)
    .style("width", "100%")  // **按钮填满整个 div**
    .style("height", "100%")  // **按钮填满整个 div**
    .style("font-size", "2vw")  // **文字大小自适应（根据视口宽度变化）**
    .style("font-weight", "bold")  // 文字加粗
    .style("border", "none")  // 去掉默认边框
    .style("background-color", "#007bff")  // 按钮背景色
    .style("color", "white")  // 文字颜色
    .style("border-radius", "8px")  // 圆角
    .style("cursor", "pointer")  // 鼠标悬浮变手势
    .on("click", () => button_submit(data_text));  // 点击事件
    
}


function setup_func_h_append_button(sub_id, function_id, data_array, input_positions = [], input_settings = {}) {
    const container = d3.select(`#func_${sub_id}_area-${function_id}`);

    container.style("display", "flex")
        .style("flex-direction", "row")
        .style("gap", "10px")
        .style("align-items", "center");

    let inputElements = {}; 

    data_array.forEach((data_text, index) => {
        let inputKeyRight = `${index}-right`;

        // 如果 input 應該出現在這個按鈕的右邊，則添加 input (例如: 檔案選擇)
        if (input_positions.includes(inputKeyRight)) {
            inputElements[inputKeyRight] = add_input(container, input_settings[inputKeyRight] || {});
        }

        // 建立按鈕外層 div
        const buttonContainer = container.append("div")
            .attr("class", "sub-block")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("width", "120px")
            .style("height", "50px");

        // 添加按鈕
        const button = buttonContainer.append("button")
            .text(data_text)
            .style("width", "100%")
            .style("height", "100%")
            .style("font-size", "1rem")
            .style("font-weight", "bold")
            .style("border", "none")
            .style("background-color", "#007bff")
            .style("color", "white")
            .style("border-radius", "8px")
            .style("cursor", "pointer");

        // **如果是 Import 按鈕，綁定點擊事件來選擇檔案**
        if (data_text === "Import") {
            const fileInput = inputElements[inputKeyRight];

            button.on("click", () => {
                fileInput.node().click(); // 觸發檔案選擇
            });

            fileInput.on("change", function () {
                const file = this.files[0];
                if (file) {
                    uploadFile(file);
                }
            });
        } else {
            button.on("click", () => button_submit(data_text));  // 其他按鈕點擊
        }
    });
}

// **新增輸入框函數 (包含 file input)**
function add_input(container, settings) {
    return container.append("input")
        .attr("type", settings.type || "text")  // 預設為 text
        .attr("placeholder", settings.placeholder || "輸入內容")
        .style("width", "200px")
        .style("height", "40px")
        .style("font-size", "1rem")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("display", settings.type === "file" ? "none" : "inline-block"); // 隱藏 file input
}

// **上傳檔案的函數**
function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    fetch("/pick/import_file", {
        method: "POST",
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        console.log("Upload Success:", data);
        alert("檔案上傳成功：" + data.filename);
    })
    .catch(error => {
        console.error("Upload Error:", error);
        alert("上傳失敗，請重試");
    });
}



 
function sub_selection(sub_id, function_id, data) {
    let options = d3.select(`#func_${sub_id}_area-${function_id}`)
    .append("div")
    .attr("class", "sub-block")
    .style('display', 'flex')
    .style('flex-direction', 'column')
    .style('width', '100%')  // 宽度 100% 填满父元素
    .style('height', '100%')

    let selector = options.append('select')
    .attr("name", "time-list")
    .attr('id','getWarehosueId')

    selector.selectAll('option')
    .data(data)
    .enter()
    .append('option')
    .attr('value', d => d[0])
    .text(d => d)


}

function sub_table(sub_id, function_id, jsonData) {
    console.log(jsonData)
    // 如果 jsonData 为空或未定义，则打印错误并返回
    if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
        console.error("Invalid jsonData provided to sub_table:", jsonData);
        return; // 退出函数，防止后续代码执行
    }

    let container = d3.select(`#func_${sub_id}_area-${function_id}`);
    // 先清空旧表格（防止重复创建）
    container.selectAll("table").remove();

    // 创建 table
    let table = container.append("table")
        .attr("class", "data-table")
        .style("width", "100%")
        .style("border-collapse", "collapse")
        .style("text-align", "center");

    // 取 JSON 的 key 作为表头
    let columns = Object.keys(jsonData[0]);

    // 创建表头
    let thead = table.append("thead").append("tr");
    thead.selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(d => d) // 表头名称
        .style("border", "1px solid black")
        .style("padding", "8px")
        .style("background-color", "#007bff")
        .style("color", "white");

    // 创建表格主体
    let tbody = table.append("tbody");

    // 填充表格数据
    let rows = tbody.selectAll("tr")
        .data(jsonData)
        .enter()
        .append("tr");

    rows.selectAll("td")
        .data(row => columns.map(column => row[column])) // 取 JSON 值
        .enter()
        .append("td")
        .text(d => d)
        .style("border", "1px solid black")
        .style("padding", "8px");
}


setup_main_grap([1])

setup_div_layer(1,[0.1,0.9] )
setup_func_h_append_button(1,1, ['Start','Setting','Import'], ['2-right'],{
    '2-right': { type: 'file', placeholder: '選取檔案' }
})
//setTimeout(() => add_input_next_to_buttons(1, 1), 500);
//setup_func_layer(1,1, 'Pick')
//setup_func_layer(1,2, 'Drop')

$.ajax({
    url: '/task/Pick_order',
    method:'GET',
    success: function(response){
        sub_table(1, 2, response)
    },
    error: function(err){
        console.log(err)
    }

})



// 监听服务器推送的数据
socket.on('file-uploaded', function(data) {
    console.log(data); // 用来调试，确保数据格式正确

    if (data && data.success) {
        // 确保返回的数据是数组，并传递给 `sub_table` 函数
        if (Array.isArray(data.data)) {
            sub_table(1, 2, data.data);  // 传递更新的数据
        } else {
            console.error('Invalid data format: Expected an array');
        }
    } else {
        console.error('No data or failure message received');
    }
});



function button_submit(task){
    console.log(task)

    switch(task) {
        case 'Start':
            window.location.href = '/task/pick_start'
            break
    }
}