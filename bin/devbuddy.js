#!/usr/bin/env node
const { Command } = require('commander');
const program = new Command();
program.name('devbuddy').description('AI协作开发助手').version('0.1.0');
program.command('init').description('初始化项目配置').action(() => { console.log('DevBuddy initialized!'); });
program.command('review').description('代码审查').option('-f, --file <path>').action((opts) => { console.log('Reviewing code...' + (opts.file ? opts.file : ' (all changes)')); });
program.command('hook-install').description('安装 Git Hooks').action(() => { console.log('Git hooks installed!'); });
program.parse();
