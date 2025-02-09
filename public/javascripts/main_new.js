
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