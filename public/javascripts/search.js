var $industry_list = $('.industry-list'),
	$industry_item_tmpl = $('#industry-tmpl'),
	$industry_name = $('#industry_name'),
	$loading = $('.loading'),
	$empty = $('.no-data'),
	arr_search_result = [],
	arr_search_industry = [];

function get_company_page_info(query){
	return $.ajax({
		url:'search?date='+new Date().getTime(),
		data: query
	});
}

function get_company(page_index, query){
	query = $.extend(query, {page_index: page_index});
	return $.ajax({
		url:'search/list?date='+new Date().getTime(),
		data: query
	});
}

function remove_industry(industry_name){
	$.each(arr_search_industry, function(i, industry){
		if(industry === industry_name){
			arr_search_industry.splice(i, 1);
			return false;
		}
	});
}
function load_data(data){
	arr_search_result = arr_search_result.concat(data);
	$('#company-list-tmpl').tmpl(data).appendTo('#body_list');
}
function get_query(industry){
	var query = {};

	query.start_date = $('#start_date').val();
	query.end_date = $('#end_date').val();
	query.industry = industry;

	return query;
}

function reset(){
	$('#body_list').html('');
	$loading.show();
	$empty.hide();
}

function is_load_complete(index, count){
	console.log(index, count);
	if(index === count){
		$loading.hide();
		if(arr_search_result.length === 0){
			$empty.show();
		}else{
			$empty.hide();
		}
		$('.btn-search').removeAttr('disabled');
	}
}

function load_company(arr_query, arr_count){
	var index = 0,
		i = 0,
		count = 0;

	for(; i < arr_count.length; i++){
		count += arr_count[i];
	}
	$.each(arr_search_industry, function(i, industry){
		for(var j = 1; j <= arr_count[i]; j++){
			get_company(j, arr_query[i]).done(function(res){
				load_data(res.data);
				index++;
				is_load_complete(index, count);
			});
		}
	});
}

$('.btn-search').on('click', function(e){
	e.preventDefault();
	if(arr_search_industry.length === 0){
		alert('请先选择行业');
		return false;
	}
	$(this).attr('disabled', true);
	reset();

	var arr_count = [],
		index = 0,
		arr_query = [];

	$.each(arr_search_industry, function(i, industry){
		var query = get_query(industry);

		arr_query.push(query);

		get_company_page_info(query)
		.done(function(res){
			query.total = res.data.page_count;
			get_company(1, query);
		});
	});
});

$('.btn-add-industry').on('click', function(e){
	e.preventDefault();
	var industry_name = $industry_name.val();

	if(!$.trim(industry_name)) return false;
	if(arr_search_industry.indexOf(industry_name) > -1){
		alert('不能重复添加');
		return false;
	}
	$industry_item_tmpl.tmpl({industry:industry_name}).appendTo($industry_list);
	arr_search_industry.push(industry_name);
	$industry_name.val('');
	$industry_name.focus();
});

$industry_list.on('click', '.industry-close', function(){
	$(this).closest('.industry-item').fadeOut(500, function(){
		$(this).remove();
		var industry_name = $(this).find('.industry-name').text();

		remove_industry(industry_name);
	});
});

var socket = null;
$('.btn-search1').on('click', function(e){
	e.preventDefault();
	if(arr_search_industry.length === 0){
		alert('请先选择行业');
		return false;
	}
	var arr_query = [];

	reset();
	$(this).attr('disabled', true);
	if(!socket){
		socket = create_websocket();
	}
	$.each(arr_search_industry, function(i){
		var query = get_query(arr_search_industry[i]);

		arr_query.push(query);
	});
	$loading.show();
	socket.send(arr_query);
});
//建立websocket
function create_websocket(){
	var socket= io('',{'reconnect':false,'auto connect':false}); 

	// 添加一个连接监听器
	socket.on('connect',function() { 
	  console.log('Client has connected to the server!'); 
	});

	// 添加一个连接监听器
	socket.on('message',function(data) {
	  if(data === 'completed'){
	  	$loading.hide();
	  	// socket.close();
	  	return;
	  }
	  arr_search_result = arr_search_result.concat(data.list);
	  console.log('Received a message from the server!',data);
	  load_data(data.list); 
	});
	
	// 添加一个关闭连接的监听器
	socket.on('disconnect',function() {
	  socket.close();
	  console.log('The client has disconnected!'); 
	}); 

	return socket;
}
