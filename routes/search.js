var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio'),
	async = require('async'),
	_ = require('lodash'),
	seq = require('seq'),
	request = require('request'),
	register = require('../lib/register');

function filter_company(html){
	var $ = cheerio.load(html),
		filtered_company = [],
		company = {},
		$trs = $('.tgList tr'),
		$tr_tds;

	_.forEach($trs, function(tr, index){
		if(index === 0) return;
		$tr_tds = $(tr).find('td');
		company = {};
		company.date = $tr_tds.eq(0).text();
		company.name = $tr_tds.eq(1).text();
		company.status = $tr_tds.eq(2).text();

		filtered_company.push(company);
	});

	// write_file(contents);
	return filtered_company;
}

//得到分页信息
function get_page_info(html){
	var $ = cheerio.load(html),
		page_info = {};

	var $page_tr = $('.page_table tr'),
		$page_tds;
	
	if($page_tr.length > 0){
		$page_tds = $page_tr.find('td');

		if($page_tds.eq(0).length > 0){
			var total_text = $page_tds.eq(0).text(),
				page_count_text = $page_tds.eq(2).text(),
				total,//总条数
				page_count,//总页数
				reg = /\d+/g;

			if((total = reg.exec(total_text))){
				page_info.total = total[0];
				reg.lastIndex = 0;
			}
			if((page_count = reg.exec(page_count_text))){
				page_info.page_count = page_count[0];
			}
		}
	}

	return page_info;
}

function get_request_params(page_index, query){
	var params = {};

	params['appTotalSearchCondition.etpsName'] = query.industry;
	if(query.start_date){
		params['appTotalSearchCondition.startDate'] = query.start_date;
	}
	if(query.end_date){
		params['appTotalSearchCondition.endDate'] = query.end_date;
	}
	params.p = page_index || 1;

	return params;
}

function write_file(content, file_name){
	fs.writeFile(path.join(__dirname, '../' + file_name + '.txt'), content, function(){

	});
}
/* GET home page. */
router.get('/', function(req, res, next) {
	var query = req.query,
		arr_company = [],
		url = 'http://www.sgs.gov.cn/shaic/appStat!toEtpsAppList.action';

	new seq()
		.seq(function(){
			var that = this,
				params = get_request_params(1, query);

			request.post({
				url:url,
				form: params
			}, function(err, response, body){
				// var com = filter_company(body);

				//arr_company = arr_company.concat(com);
				// write_file(JSON.stringify(com), 'first');
				//分页信息
				var page_info = get_page_info(body);

				return res.json({
					code : 0,
					data: page_info
				});
			});
		})
		// .seq(function(page_info){
		// 	var page_count = +page_info.page_count,
		// 		arr_page = [];

		// 	for(var i = 1; i <= page_count; i++){
		// 		arr_page.push(i);
		// 	}

		// 	async.each(arr_page, function(i, next){
		// 		console.log(i);
		// 		params = get_request_params(i, query);
		// 		request.post({
		// 			url:url,
		// 			form: params
		// 		}, function(err, response, body){
		// 			var com = filter_company(body);

		// 			//得到公司的注册时间
		// 			async.each(com, function(compnay, next2){
		// 				register.get_date(compnay.name, function(err, date){
		// 					if(err){
		// 						compnay.is_del = true;
		// 					}
		// 					compnay.register_date = date;
		// 					next2();
		// 				});
		// 			}, function(err){
		// 				com = _.filter(com, function(company){
		// 					if(!company.is_del){
		// 						return true;
		// 					}
		// 					return false;
		// 				});
		// 				arr_company = arr_company.concat(com);
		// 				// if(params.start_date === compnay.register_date){
		// 					// arr_company.push(compnay);
		// 				// }
		// 				next();
		// 			});
		// 			// arr_company = arr_company.concat(com);
		// 			// write_file(JSON.stringify(com), i);
		// 			// next();
		// 		});
		// 	}, function(){
		// 		return res.json({
		// 			code : 0,
		// 			data : arr_company
		// 		});
		// 	});
		// })
	;
});

router.get('/:list', function(req, res, next){
	var query = req.query,
		arr_company = [],
		url = 'http://www.sgs.gov.cn/shaic/appStat!toEtpsAppList.action';

	new seq()
		.seq(function(){
			var params = get_request_params(query.page_index, query),
				that = this;

			request.post({
				url:url,
				form: params
			}, function(err, response, body){
				var com = filter_company(body);

				//得到公司的注册时间
				async.each(com, function(compnay, next){
					register.get_date(compnay.name, function(err, date){
						if(err){
							compnay.is_del = true;
						}
						compnay.register_date = date;
						next();
					});
				}, function(err){
					com = _.filter(com, function(company){
						if(!company.is_del){
							return true;
						}
						return false;
					});
					arr_company = arr_company.concat(com);
					that();
				});
			});
		})
		.seq(function(){
			return res.json({
				code : 0,
				data : arr_company
			});
		})
});

module.exports = router;
