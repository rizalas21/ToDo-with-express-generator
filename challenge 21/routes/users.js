var express = require('express');
var router = express.Router();
const moment = require('moment')
const path = require('path')
const { isLoggedIn } = require('../helpers/util')

module.exports = function (db) {
  router.get('/', isLoggedIn, async (req, res) => { //create router read
    const { page = 1, title, startdate, enddate, complete, type_search } = req.query
    const limit = 5
    const offset = (page - 1) * 5
    const queries = []
    const params = []
    const count = []
    // let typeSort;
    const { rows: data } = await db.query('SELECT * FROM users WHERE id = $1', [req.session.user.userid])

    params.push[params.push(req.session.user.userid)]
    count.push[req.session.user.userid]

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
    //   sql += ` ORDER BY ${sort}`
    //   typeSort = sort.replace(' ', '+')
    // }

    params.push(limit, offset)
    sql += ` order by id desc limit $${params.length - 1} offset $${params.length}`
    console.log(sql)
    console.log(params)

    db.query('SELECT COUNT (*) AS total FROM todos', (err, { rows: data }) => {

      const total = data[0].total
      const pages = Math.ceil(total / limit)

      db.query(sql, params, (err, { rows: data }) => {
        if (err) res.render(err)
        else res.render('users/home', {
          data,
          query: req.query,
          pages,
          offset,
          page,
          url: req.url,
          moment,
          // typeSort,
          user: req.session.user,
          failedInfo: req.flash('failedInfo'),
          successInfo: req.flash('successInfo')
        })
      })
    })
  })

  router.get('/add', (req, res) => {//create router add
    res.render('users/add')
  })

  router.post('/add', isLoggedIn, (req, res) => {
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


  router.get('/edit/:index', isLoggedIn, (req, res) => {
    const index = req.params.index
    db.query('SELECT * FROM todos WHERE id = $1', [index], (err, { rows: item }) => {
      if (err) return res.send(err)
      else res.render('users/edit', { moment, item, user: req.session.user })
    })
  })

  router.post('/edit/:index', (req, res) => {
    const index = req.params.index
    const { title, deadline, complete } = req.body;
    db.query('UPDATE todos SET title = $1, deadline = $2, complete = $3 WHERE id = $4',
      [title, deadline, Boolean(complete), index], (err, data) => {
        if (err) return res.send(err)
        else res.redirect('/users')
      })
  })

  router.get('/upload/:index', isLoggedIn, (req, res) => {
    res.render('users/upload', { avatar: req.session.user.avatar })
  })

  router.post('/upload/:index', isLoggedIn, (req, res) => {
    let avatar;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    avatar = req.files.avatar;
    let fileName = Date.now() + '-' + avatar.name;

    uploadPath = path.join(__dirname, '..', 'public', 'images', fileName);

    avatar.mv(uploadPath, async function (err) {
      if (err)
        return res.status(500).send(err);
      // blablablabla 
      try {
        const { rows } = await db.query('UPDATE users SET avatar = $1 WHERE id = $2', [fileName, req.session.user.userid])
        res.redirect('/users')
      } catch (err) {
        res.send(err)
      }
    });
  })

  return router;
}