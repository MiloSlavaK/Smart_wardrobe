import "./folding.sc"
import "./rememberLocation.sc"
import "./findLocation.sc"
import "./laundry.sc"

main {
    match_intent {
        intent: "folding" -> folding.handle_folding()
        intent: "remember_location" -> rememberLocation.handle_remember()
        intent: "find_location" -> findLocation.handle_find()
        intent: "laundry" -> laundry.handle_laundry()
        intent: "help" -> reply.show_help()
        else -> reply.show_default()
    }
}