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
    (Number.isNaN(new Date(date).getTime())) && (flag = false);
    !flag && logError(`TypeError: ${key} is not date type`)
    return flag;
}

const getDate = date => new Date(date).toLocaleDateString().split('/').map((e, i) => i > 0 && e < 10 && `0${e}` || e).join('-');

const gitServer = (name, startTime, endTime) => `git log --author="${name.trim()}" --since=${startTime} --until=${endTime} --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "added lines: %s, removed lines: %s, total lines: %s\\n", add, subs, loc }'`;

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
            .then(({ startDate, endDate, name })=>{
                if (isDate(startDate, 'startDate') && isDate(endDate, 'endDate') && name.trim().length > 0) {
                    const [startTime, endTime] = [getDate(startDate), getDate(endDate)];
                    exec(gitServer(name, startTime, endTime), (error, stdout) => {
                        if (error) {
                            logError(`exec error: ${error}`);
                            return;
                        }
                        let numArr = stdout.match(/\d+/ig)
                        if (!Array.isArray(numArr) || numArr.length < 2) numArr = [0, 0];
                        const date = new Date(startTime).getTime();
                        const date1 = new Date(endTime).getTime();
                        let day = (date1 - date) / 1000 / 3600 / 24;
                        day = Math.ceil(day - (day / 7 * 2));
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
                        const str = `${name} 你好！\n 你在${startTime}  至  ${endTime}; \n 一共添加了${numArr[0]}行代码，删除了${numArr[1]}行代码; \n ${status}`
                        log(str)
                    });
                } else if (name.trim().length === 0) {
                  logError(`Error: 参数有错，请重新执行！`)
                }
          })
    })

program.parse(process.argv)