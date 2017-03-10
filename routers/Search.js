/**
 * Created by Moon Jung Hyun on 2015-11-19.
 */

var express = require('express');
var router = express.Router();

var Search = require('./../controllers/Search');

router.get('/', Search.searchAtAll);

router.get('/hashTag', Search.searchAtHashTag);

router.get('/artist', Search.searchAtArtist);

router.get('/space', Search.searchAtSpace);

module.exports = router;