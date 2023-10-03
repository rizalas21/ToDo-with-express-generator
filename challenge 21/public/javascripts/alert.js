function confirmation(title) {
    const answer = confirm(`apakah kamu yakin menghapus data ${title} ?`)
    if (answer) return true 
    else return false
}