/**
 * Created by heroKoo on 2015-11-08.
 */

var express = require('express');
var router = express.Router();

var showPost = require('./../controllers/ShowPosts');

//list
router.get('/', showPost.getShowList);

//addform-web
router.get('/showPostsForm', showPost.getShowAddForm);

//add
router.post('/', showPost.addShowPost);

router.get('/webTest', showPost.getWebShowList);


//detail
router.get('/:postId', showPost.getShowPost);


module.exports = router;