var logger = require('../logger'),
	request = require('request'),
	Seq = require('seq'),
	moment = require('moment'),
	cheerio = require('cheerio');

function get_company_id(html){
	var $ = cheerio.load(html);

	var $trs = $('.con tr'),
		company_id = 0,
		str_company_id = '',
		reg = /viewDetail\(\'(.+)\'\)/;

	if($trs.length){
		var $a_compnay = $trs.eq(0).find('a');

		str_company_id = $a_compnay.attr('onclick');
		if((company_id = reg.exec(str_company_id))){
			company_id = company_id[1];
		}
	}

	return company_id;
}

function get_format_date(str_date){
	var reg = /\d+/g,
		match_date,
		arr_date = [];

	while((match_date = reg.exec(str_date))){
		arr_date.push(match_date);
	}

	return arr_date.join('-');
}

function get_company_date(html){
	var $ = cheerio.load(html);

	var $trs = $('.list_boder tr'),
		$target_tr,
		$date_td,
		company_date;

	if($trs.length && $trs[4]){
		$target_tr = $trs.eq(4);
	}

	if(!$target_tr) return null;
	$date_td = $target_tr.find('td').eq(1);
	company_date = ($date_td.text() || '').trim();

	if(company_date){
		return get_format_date(company_date);
	}else{
		return null;
	}
}
function get_company_id_by_name(name, callback){
	var url = 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=doSearch';

	new Seq()
		.seq(function(){
			request.post({
				url:url,
				form:{keyWords : name, searchType:1}
			}, function(err, response, body){
				var company_id = get_company_id(body);

				return callback(null, company_id);
			});
		})
	;
}

function get_company_date_by_id(company_id, callback){
	var url = 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=viewDetail';

	new Seq()
		.seq(function(){
			var that = this;

			request.post({
				url:url,
				headers:{
					Origin:'http://www.sgs.gov.cn',
					Referer:'http://www.sgs.gov.cn/lz/etpsInfo.do?method=doSearch',
					Host:'www.sgs.gov.cn'
				},
				form:{etpsId: company_id}
			}, function(err, response, body){
				var company_date = get_company_date(body);

				return callback(null, company_date);
			});
		})
	;
}

function get_date(name, callback){
	new Seq()
		.seq(function(){
			var that = this;

			get_company_id_by_name(name, function(err, company_id){
				if(!company_id){
					logger.company_id.error('name is :' + name + ', company_id is null');
					return callback('company_id id null', null);
				}
				that(err, company_id);
			});
		})
		.seq(function(company_id){
			get_company_date_by_id(company_id, function(err, date){
				logger.register.info('name is :' + name);
				logger.register.info('company_id is :' + company_id);
				logger.register.info('company_date is :' + date);
				return callback(err, date);
			});
		})
	;
}

module.exports = {
	get_date : get_date
};