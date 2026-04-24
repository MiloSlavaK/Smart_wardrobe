intent FoldClothing {
    phrases {
        "как сложить {item}"
        "как убрать {item}"
        "инструкция для {item}"
    }
    slots {
        item: string
    }
    on_success {
        send_data {
            action_id: "folding"
            parameters {
                item: "@item"
            }
        }
    }
}

intent RememberLocation {
    phrases {
        "я положил {item} в {location}"
        "запомни {item} в {location}"
    }
    slots {
        item: string
        location: string
    }
    on_success {
        send_data {
            action_id: "remember"
            parameters {
                item: "@item"
                location: "@location"
            }
        }
    }
}

intent FindLocation {
    phrases {
        "где {item}"
        "куда я положил {item}"
    }
    slots {
        item: string
    }
    on_success {
        send_data {
            action_id: "where_is"
            parameters {
                item: "@item"
            }
        }
    }
}