import "../js/reply.js"
import "../js/actions.js"

intent findLocation {
    handle_find {
        item = slot("item")
        location = actions.findLocation(item)

        if (location != null) {
            reply.show_location(item, location)
        } else {
            reply.location_unknown(item)
        }
    }
}