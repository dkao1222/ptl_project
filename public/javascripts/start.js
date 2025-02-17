const socket = io(); // 连接到服务器

// **🔥 初始化主结构**
function setup_main_grap(div_array) {
    d3.select('body').append('div', 'col').attr('id', 'my_dataviz');

    const d3_container = d3.select('#my_dataviz')
        .append('div')
        .style('display', 'flex')
        .style('flex-direction', 'row')
        .style('width', window.innerWidth + "px")
        .style('height', window.innerHeight + "px");

    const blocks = d3_container.selectAll(".block")
        .data(div_array)
        .enter()
        .append("div")
        .attr("class", "block")
        .style("flex", d => d)
        .style("border", "1px solid #000")
        .style("padding", "20px")
        .style("box-sizing", "border-box")
        .attr('id', (d, i) => `map_area-${i + 1}`);

    blocks.each(function (d, i) {
        d3.select(this)
            .append('div')
            .attr('class', 'sub-block')
            .attr('id', `sub_area-${i + 1}`)
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('width', '100%')
            .style('height', '100%');
    });
}

// **🔥 设定 UI 结构**
function setup_div_layer(sub_id, div_array) {
    d3.select(`#map_area-${sub_id}`).select('.sub-block')
        .selectAll('.inner-block')
        .data(div_array)
        .enter()
        .append('div')
        .attr('class', 'inner-block')
        .style('flex', d => d)
        .attr('id', (d, i) => `func_${sub_id}_area-${i + 1}`)
        .style('border', '1px solid #000')
        .style('box-sizing', 'border-box')
        .style('padding', '10px');
}

// **🔥 任务分配**
function assignTask() {
    console.log("📡 请求任务分配...");
    fetch('/task/pick_assign', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            console.log("📩 任务已分配:", data);
            if (data.success) {
                let assignedEsp = Object.keys(data.assignments)[0];
                let assignedTask = data.assignments[assignedEsp];
                showTaskInput(1, 2, assignedEsp, assignedTask.task_id);
            } else {
                alert("❌ 任务分配失败: " + data.error);
            }
        })
        .catch(error => {
            console.error("❌ 任务分配请求失败:", error);
        });
}

// **🔥 监听任务完成事件**
socket.on('task-completed', function (data) {
    console.log("📩 任务完成通知:", data);
    if (data.success) {
        alert(`任务 ${data.task_id} 在 ESP ${data.esp_id} 上完成！`);
        assignTask();
    }
});

// **🔥 创建 UI 按钮**
function setup_func_h_append_button(sub_id, function_id, data_array) {
    const container = d3.select(`#func_${sub_id}_area-${function_id}`)
        .style("display", "flex")
        .style("flex-direction", "row")
        .style("gap", "10px")
        .style("align-items", "center");

    data_array.forEach((data_text) => {
        container.append("button")
            .text(data_text)
            .style("width", "120px")
            .style("height", "50px")
            .style("font-size", "1rem")
            .style("font-weight", "bold")
            .style("border", "none")
            .style("background-color", "#007bff")
            .style("color", "white")
            .style("border-radius", "8px")
            .style("cursor", "pointer")
            .on("click", () => button_submit(data_text));
    });
}

// **🔥 用户输入任务**
function showTaskInput(sub_id, function_id, esp_id, task_id) {
    let container = d3.select(`#func_${sub_id}_area-${function_id}`);
    container.selectAll("#taskInputForm").remove();

    let form = container.append("div").attr("id", "taskInputForm");
    form.append("h2").text("请输入 Task ID 或 SKU");

    form.append("input")
        .attr("type", "text")
        .attr("id", "taskInput")
        .style("width", "70%")
        .style("font-size", "1.2em")
        .attr("placeholder", "请输入 Task ID 或 SKU")
        .on("keypress", function (event) {
            if (event.key === "Enter") {
                submitTaskInput(esp_id, task_id, d3.select("#taskInput").property("value"));
            }
        });

    form.append("button")
        .attr("id", "submitBtn")
        .style("width", "20%")
        .style("font-size", "1.2em")
        .text("提交")
        .on("click", function () {
            submitTaskInput(esp_id, task_id, d3.select("#taskInput").property("value"));
        });
}

// **🔥 任务提交**
function submitTaskInput(esp_id, task_id, taskInput) {
    if (!taskInput) {
        alert("请输入 Task ID 或 SKU");
        return;
    }

    console.log("🚀 发送任务完成确认:", taskInput);

    fetch('/task/complete_task', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ esp_id, task_id })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("✅ 任务已完成:", data);
                alert("任务完成");
                assignTask();
            } else {
                console.error("❌ 任务完成失败:", data);
                alert("任务完成失败: " + data.error);
            }
        })
        .catch(error => {
            console.error("❌ 任务完成请求失败:", error);
            alert("任务完成请求失败，请检查日志");
        });
}

// **🔥 页面加载时自动分配任务**
document.addEventListener("DOMContentLoaded", function () {
    assignTask();
});

setup_main_grap([0.4, 0.6]);
setup_div_layer(1, [0.1, 0.1, 0.8]);
setup_func_h_append_button(1, 1, ['Start', 'Setting', 'Import']);
