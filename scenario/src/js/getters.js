function get_request(context) {
    if (context && context.request)
        return context.request.rawRequest;
    return {}
}

function get_server_action(request){
    if (!request || !request.payload) return {};
    // salutejs sendData({action:{...}}) приходит в payload.server_action
    if (request.payload.server_action) {
        return request.payload.server_action;
    }
    // запасной путь для нестандартной упаковки
    if (request.payload.data && request.payload.data.server_action) {
        return request.payload.data.server_action;
    }
    return {};
}

function get_screen(request){
    if (request &&
        request.payload &&
        request.payload.meta &&
        request.payload.meta.current_app &&
        request.payload.meta.current_app.state){
        return request.payload.meta.current_app.state.screen;
    }
    return "";
}

function get_selected_item(request){
if (request &&
        request.payload &&
        request.payload.meta &&
        request.payload.meta.current_app &&
        request.payload.meta.current_app.state){
        return request.payload.selected_item;
    }
    return null;
}

function get_items(request){
if (request &&
        request.payload &&
        request.payload.meta &&
        request.payload.meta.current_app &&
        request.payload.meta.current_app.state &&
        request.payload.meta.current_app.state.item_selector){
        return request.payload.meta.current_app.state.item_selector.items;
    }
    return null;
}

function get_id_by_selected_item(request){
    var items = get_items(request);
    var selected_item = get_selected_item(request);
    if (selected_item && items) {
        log('get_id_by_selected_item(): selected_item: '+toPrettyString(selected_item))
        if (items[selected_item.index]) {
            return items[selected_item.index].id
        }
    }
    return null;
}

// Возвращает полный объект выбранной вещи из состояния приложения
// (включая instruction/washing/category), чтобы сценарий мог
// озвучить инструкцию напрямую, без обращения к Canvas App.
function get_selected_full_item(request){
    var items = get_items(request);
    var selected_item = get_selected_item(request);
    if (selected_item && items && items[selected_item.index]) {
        return items[selected_item.index];
    }
    return null;
}

// Находит вещь в состоянии по подстроке названия (для голосового запроса
// вида «как стирать носки», когда карточка не выбрана в интерфейсе).
function find_item_by_name(request, name){
    var items = get_items(request);
    if (!items || !name) return null;
    var q = ("" + name).toLowerCase().trim();
    if (!q) return null;
    for (var i = 0; i < items.length; i++) {
        var title = (items[i].title || "").toLowerCase();
        if (title === q || title.indexOf(q) !== -1 || q.indexOf(title) !== -1) {
            return items[i];
        }
    }
    return null;
}

// Выбирает вещь для голосовой команды: сначала по выбранной карточке,
// затем по совпадению названия из распознанного текста.
function resolve_item(request, name){
    var item = get_selected_full_item(request);
    if (item) return item;
    return find_item_by_name(request, name);
}