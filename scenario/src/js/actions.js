function addNote(note, context) {
    addAction({
        type: "add_item",
        note: note
    }, context);
}

function doneNote(id, context){
    addAction({
        type: "done_item",
        id: id
    }, context);
}