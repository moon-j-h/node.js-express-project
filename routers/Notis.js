/**
 * Created by skplanet on 2015-11-24.
 */

var express = require('express');
var router = express.Router();
var Noti = require('./../controllers/Notis');

//Listing
router.get('/',Noti.getNotis);

//add
//router.post('/',Noti.makeNoti);

//check
router.put('/:notiId',Noti.checkNoti);


module.exports = router;