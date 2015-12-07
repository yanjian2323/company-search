var log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' }, //控制台输出
    {
       category:"register",
       type: "dateFile",
       filename: "./logs/register",
       alwaysIncludePattern: true,
       pattern: "-yyyy-MM-dd.log"
    },
    {
      category:"company_id_error",
       type: "dateFile",
       filename: "./logs/company_id_error",
       alwaysIncludePattern: true,
       pattern: "-yyyy-MM-dd.log"
    }
  ]
});

var register = log4js.getLogger('register');

register.setLevel('INFO');

var company_id = log4js.getLogger('company_id_error');

company_id.setLevel('INFO');

module.exports = {
	register : register,
  company_id : company_id
};