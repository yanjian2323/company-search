var express = require('express');
var router = express.Router();
var fs = require('fs'),
	path = require('path');

function get_all_industry(callback){
	fs.readFile(path.join(__dirname, '../config.txt'), 'utf-8', function(err, data){
		if(err){
			return callback('找不到config.txt文件');
		}
		return callback(null, data);
	});
}
/* GET home page. */
router.get('/', function(req, res, next) {
	// register.get_date('上海宇统电器安装有限公司');
	res.render('index');
	// get_all_industry(function(erd:dfjdks;fjskd:d:fdslkfjr, content){
	// 	if(err){
	// 		return res.send(err);
	// 	}

	// 	var arr_industry = (content && content.split(',')) || [];

	// 	res.render('index', {
	// 		industries : arr_industry
	// 	});
	// });
});

module.exports = router;
