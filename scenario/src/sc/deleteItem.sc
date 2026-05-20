theme: /

    state: УдалениеЭлемента
        q!: (~удалить|удали)
            $AnyText::anyText

        script:
            log('deleteItem: context: ' + JSON.stringify($context))
            var item_id = get_id_by_selected_item(get_request($context));
            deleteItem(item_id,$context);

        a: Удаляю