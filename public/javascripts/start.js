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

  
};
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


setup_main_grap([0.4,0.6])
setup_div_layer(1, [0.1,0.1,0.8])
function button_submit(task){
  console.log(task)
  alert(task)
}


function showTaskInput(sub_id, function_id) {
  d3.select(`#func_${sub_id}_area-${function_id}`)
  d3.select(`#func_${sub_id}_area-${function_id}`).select('.sub-block').append("h2").text("请输入 Task ID 或 SKU");
  const form = d3.select(`#func_${sub_id}_area-${function_id}`).append("div").attr("id", "inputForm");
  form.append("input")
  .attr("type", "text")
  .attr("id", "taskInput")
  .style("height", "100%")
  .style("width", "70%")
  .style("font-size", "1.2em")
  .attr("placeholder", "请输入 Task ID 或 SKU")
  .on("keypress", function(event) {
      if (event.key === "Enter") {
          submitTaskInput(d3.select("#taskInput").property("value"));
      }
  });;
  
  form.append("button")
  .attr("id", "submitBtn")
  .style("height", "100%")
  .style("width", "20%")
  .style("font-size", "1.2em")
  .text("提交")
  .on("click", function() {
    submitTaskInput(d3.select("#taskInput").property("value"));
  });
}

showTaskInput(1,2)