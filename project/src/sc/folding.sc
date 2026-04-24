import "../js/reply.js"
import "../js/actions.js"

intent folding {
    handle_folding {
        item = slot("item")
        data = actions.getFoldingInstruction(item)

        if (data != null) {
            reply.send_folding(data)
        } else {
            reply.not_found(item)
        }
    }
}