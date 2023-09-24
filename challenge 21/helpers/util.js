module.exports = {
    isLoggedIn: function (req, res, next) {
        if (req.session.user) {
            next()
        } else {
            res.redirect('/')
        }
    }
}

function showDelete(id, name) {
    document.getElementById("deleteModal").style.display = "block";
    document.getElementById("deleteYes").setAttribute('href', `/delete/${id}`)
    document.getElementById("labelcard").innerHTML = `Apakah kamu yakin akan menghapus data ${name} ?`
}

function hideDelete() {
    document.getElementById("deleteModal").style.display = "none";
}