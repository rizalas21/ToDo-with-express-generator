var express = require('express');
var router = express.Router();
const moment = require('moment')
const path = require('path')
const fs = require('fs')

module.exports = function (db) {
router.get('/', (req, res) => { //create router read
  const { page = 1, title, startdate, enddate, complete, type_search } = req.query
  const limit = 5
  const offset = (page - 1) * 5
  const queries = []
  const params = []
  const count = []

  if (title) {
    params.push(title)
    count.push(title)
    queries.push(`title like '%' || $${params.length} || '%'`)
  }

  if (startdate && enddate) {
    queries.push(`deadline between $${params.length - 1} and $${params.length}`)
    params.push(startdate, enddate)
    count.push(startdate, enddate)
  } else if (startdate) {
    queries.push(`deadline >= $${params.length}`)
    params.push(startdate)
    count.push(startdate)
  } else if (enddate) {
    queries.push(`deadline <= $${params.length}`)
    params.push(enddate)
    count.push(enddate)
  };

  if (complete) {
    queries.push(`complete = $${params.length}`)
    params.push(complete)
    count.push(complete)
  }


  let sqlCount = 'SELECT COUNT (*) AS total FROM todos WHERE userid = $1'
  let sql = 'SELECT * FROM todos WHERE userid = $1'
  if (queries.length > 0) {
    sql += ` AND (${queries.join(` ${type_search} `)})`
    sqlCount += ` AND (${queries.join(` ${type_search} `)})`
  }

  // if(sort) {

  // }

  params.push(limit, offset)
  sql += ` order by id desc limit $${params.length - 1} offset $${params.length}`

  db.query('SELECT COUNT (*) AS total FROM todos', (err, { rows: data }) => {

    const total = data[0].total
    const pages = Math.ceil(total / limit)

    db.query(sql, params, (err, {rows : data}) => {
      if (err) res.render(err)
      else res.render('users/home', { data, query: req.query, pages, offset, page, moment })
    })
  })
})

router.get('/add', (req, res) => {//create router add
  res.render('users/add')
})

router.post('/add', (req, res) => {
  db.query('INSERT INTO todos (title, userid) VALUES ($1, $2)', [req.body.title, req.session.user.userid], (err) => {
    if (err) return res.send(err)
    else res.redirect('/users')
  })
})

router.get('/delete/:index', (req, res) => {
  const index = req.params.index
  db.query('DELETE FROM todos WHERE id = $1', [index], (err) => {
    if (err) return res.send(err)
    else res.redirect('/users')
  })
})


router.get('/edit/:index', (req, res) => {
  const index = req.params.index
  const item = db.get('SELECT * FROM todos WHERE id = $1', [index], (err, rows) => {
    if (err) return res.send(err)
    else res.render('users/edit', { data, moment })
  })
})

router.post('/edit/:index', (req, res) => {
  const index = req.params.index
  const {title, deadline, complete} = req.body;
  db.query('UPDATE todos SET title = $1, deadline = $2, complete = $3 WHERE id = $4', [title, deadline, Boolean(complete), index], (err, data) => {
    if (err) return res.send(err)
    else res.redirect('/users')
  })
})



return router;
}