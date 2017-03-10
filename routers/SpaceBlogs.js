/**
 * Created by skplanet on 2015-11-16.
 */

var express = require('express');
var router = express.Router();
var SpaceBlog = require('./../controllers/SpaceBlogs');

var auth = require('./../config/middlewares/authorization');
var blogAuth = [auth.blog.hasAuthorization];

router.post('/', SpaceBlog.addSpaceBlog);

//프로필 사진수정
router.get('/:blogId/profilePhoto', SpaceBlog.getProfilePhoto);
router.put('/:blogId/profilePhoto',blogAuth, SpaceBlog.modifyProfilePhoto);

//위치 가져오기
router.get('/:blogId/location',SpaceBlog.getLocation);

//프로필 정보 수정 (이메일, 전화등)
router.get('/:blogId/profile',SpaceBlog.getProfile );
router.put('/:blogId/profile',blogAuth,SpaceBlog.modifyProfile);

router.delete('/:blogId',blogAuth,SpaceBlog.deleteSpaceBlog);

module.exports = router;
