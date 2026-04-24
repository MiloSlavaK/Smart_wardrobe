import "../js/reply.js"
import "../js/actions.js"

intent laundry {
    handle_laundry {
        item = slot("item")
        tip = actions.getLaundryTip(item)

        if (tip != null) {
            reply.send_laundry(tip)
        } else {
            reply.no_tip(item)
        }
    }
}