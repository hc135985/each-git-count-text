#!/usr/bin/env node
const { Command } = require('commander')//结构Command对象
const program = new Command() //实例化
const package = require('./package.json');//获取目录文件
const inquirer = require('inquirer')//引入inquirer插件
const { exec } = require('child_process');
const chalk = require('chalk');
 
const logSuccess = msg => {
  console.log(chalk.green(`✔ ${msg}`));
};
 
const logError = msg => {
  console.log(chalk.red(`× ${msg}`));
};
 
const logWarning = msg => {
  console.log(chalk.yellow(`⚠️ ${msg}`));
};


const isDate = (date, key) => {
    let flag = true;
    const arr = date.split('-');
    if (arr.length < 3) {
      flag = false
    } else {
      arr.forEach((e,i) => {
        if (i > 0 && e > 31) {
          flag = false;
        } else if(i === 0 && e.length !== 4) {
          flag = false;
        }
      })
    }
    !flag && logError(`TypeError: ${key} is not date type`)
    return flag;
}

program.version(package.version).description('查看git代码行数').option('-V', '版本号').option('each', '查询git代码行数')//版本号和项目头文件相同
program.command('each')//创建一个命令
     .action(()=>{
           inquirer
               .prompt(
                  [
                    {
                       type:"input",
                       name:"name",
                       message:'请输入你的名字',
                    },
                    {
                        type:"input",
                        name:"startDate",
                        message:'请输入开始日期，例如：2020-01-01',
                    },
                    {
                        type:"date",
                        name:"endDate",
                        message:'请输入结束日期，例如：2020-01-01',
                    }
                  ]  
               )
                .then((active)=>{
                   //获取命令行参数，active===obj
                   if (isDate(active.startDate, 'startDate') && isDate(active.endDate, 'endDate') && active.name.trim().length > 0) {
                    exec(`git log --author="${active.name.trim()}" --since=${active.startDate} --until=${active.endDate} --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "added lines: %s, removed lines: %s, total lines: %s\\n", add, subs, loc }'`, (error, stdout, stderr) => {
                      if (error) {
                        logError(`exec error: ${error}`);
                        return;
                      }
                      let numArr = stdout.match(/\d+/ig)
                      if (!Array.isArray(numArr) || numArr.length < 2) numArr = [0, 0];
                      const date = new Date(active.startDate).getTime();
                      const date1 = new Date(active.endDate).getTime();
                      let day = (date1 - date) / 1000 / 3600 / 24;
                      day = day - (day / 7 * 2);
                      const dayNum = Math.ceil((numArr[0] * 1 + numArr[1] * 1) / day);
                      let log = null;
                      let status = '';
                      if (dayNum <= 1) {
                        status = '每天不到一行代码，请注意！！！！'
                        log = logError;
                      } else if (dayNum > 1 && dayNum <= 150) {
                        status = `每天${dayNum}行代码，中规中矩，有待进步`
                        log = logWarning
                      } else {
                        status = `每天${dayNum}行代码，必须奖励！`
                        log = logSuccess
                      }
                      const str = `${active.name} 你好！\n 你在${active.startDate}   至   ${active.endDate}; \n 一共添加了${numArr[0]}行代码，删除了${numArr[1]}行代码; \n ${status}`
                      log(str)
                    });
                   } else if (active.name.trim().length === 0) {
                    logError(`Error: 参数有错，请重新执行！`)
                   }
              } )
      })

      program.parse(process.argv)