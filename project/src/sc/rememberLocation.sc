import "../js/reply.js"
import "../js/actions.js"

intent rememberLocation {
    handle_remember {
        item = slot("item")
        location = slot("location")

        actions.saveLocation(item, location)
        reply.confirm_location(item, location)
    }
}