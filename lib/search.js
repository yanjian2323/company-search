var fs = require('fs');
var path = require('path');
var logger = require('../logger'),
	cheerio = require('cheerio'),
	async = require('async'),
	_ = require('lodash'),
	seq = require('seq'),
	request = require('request'),
	register = require('./register');

var keywords_name = ['分公司'];

function contain_name(name){
	for(var i = 0; i < keywords_name.length; i++){
		if(name.indexOf(keywords_name[i]) > -1){
			logger.company_name.info(name + ' is in keywords');
			return true;
		}
	}
	return false;
}
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
		company.register_date = '';

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

function get_data(arr_query, client, callback){
	var url = 'http://www.sgs.gov.cn/shaic/appStat!toEtpsAppList.action';

	async.eachLimit(arr_query, 1, function(query, cb1){
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

					return that(null, page_info);
				});
			})
			.seq(function(page_info){
				var total = page_info.page_count,
					arr_page= [];

				for(var i = 1; i <= total; i++){
					arr_page.push(i);
				}
				async.eachLimit(arr_page, 2, function(page_index, next){
					var params = get_request_params(page_index, query);

					request.post({
						url:url,
						form: params
					}, function(err, response, body){
						var com = filter_company(body),
							that = this,
							arr_company = [];

						async.each(com, function(company, next2){
							register.get_date(company.name, function(err, arr_date){
								if(err){//找不到company_id，也就是没有执照的
									// arr_company.push(company);
									client.send({list: [company]});
									return next2();
								}
								for(var i = 0; i < arr_date.length; i++){
									if(arr_date[i] === company.date){
										company.register_date = arr_date[i];
										client.send({list: [company]});
										// arr_company.push(company);
										break;
									}
								}
								next2();
							});
						}, function(){
							// client.send({list: arr_company});
							next();
						});
					});
				}, function(){
					return cb1();
				});
			})
		;
	}, function(){
		callback();
		console.log('completed');
	});
}

module.exports = {
	get_data : get_data
};
