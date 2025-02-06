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
    .style("border", "1px solid #000")  // 添加邊框
    .style("padding", "20px")  // 設置內邊距
    .style("box-sizing", "border-box")  // 使邊框和內邊距包含在區塊尺寸內
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
    .style('border', '1px solid #000')
    .style('box-sizing', 'border-box')
    .style('padding', '10px')
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

setup_main_grap([1])

setup_div_layer(1,[0.3,0.3,0.3] )
setup_func_layer(1,1, 'PTL')
setup_func_layer(1,2, 'Dashboard')
setup_func_layer(1,3, 'System')


function button_submit(task){
    console.log(task)

    switch(task) {
        case 'PTL':
            window.location.href = '/PTL_mode'
            break
        case 'Dashboard':
            window.location.href = '/Dashboard_mode'
            break
        case 'System':
            window.location.href = '/System_mode'
            break
    }
}