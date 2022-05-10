import { ToolsService } from '../../utils/tools.service';
import { Injectable, Logger, Query } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { SystemInfoModel } from '../../models/admin/system.model';
import { DatabaseModel } from '../../models/admin/database.model';
import dayjs from 'dayjs';
import _path from 'path';
import fs from 'fs-extra';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
@Injectable()
export class SystemService {
  private readonly logger = new Logger('SystemService');
  constructor(
    @InjectModel(SystemInfoModel)
    private readonly systemInfoModel: ReturnModelType<typeof SystemInfoModel>,
    @InjectModel(DatabaseModel)
    private readonly databaseModel: ReturnModelType<typeof DatabaseModel>,
    private readonly toolsService: ToolsService,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  // 添加更新基本参数
  async addSystemInfo(_body: any) {
    const _params = this.toolsService._params(_body);
    const _Id = await this.systemInfoModel.findOne({ '_id': 'SYS' });
    let result: any;
    if (_Id) {
      result = await this.systemInfoModel.updateMany({ _id: "SYS" }, { $set: _params });
    } else {
      result = await this.systemInfoModel.create(_params);
    }
    return !!result;
  }

  // 获取系统基本参数
  async getSystemInfo() {
    return await this.systemInfoModel.findOne({ _id: "SYS" }, { __v: 0, _id: 0 })
  }

  // 数据库备份 'mongodump -h [数据库地址:端口] -d [要备份的数据库名称] -o [备份路径]'
  async mongodump() {
    var todayBackUpName = dayjs().format('YYYY.MM.DD_HH.mm.ss');
    var todayBackUpPath = _path.join(__dirname, '../../db/' + todayBackUpName);
    var dbBackupPath = _path.join(__dirname, '../../db/');
    this.logger.log('正在备份中...')
    if (!fs.existsSync(dbBackupPath)) {
      //创建数据库备份父级目录
      fs.mkdirsSync(dbBackupPath);
    }
    const cmd = 'mongodump -h 127.0.0.1:27017 -d conversionDB -o ' + todayBackUpPath;
    var data = await this.toolsService.ShellExecCmd(cmd, '数据库备份');
    var _id = await this.snowflakeService.nextId();
    if (data['success']) {
      var _res = await this.databaseModel.create({
        _id,
        name: todayBackUpName + '备份',
        path: '/db/' + todayBackUpName,

      })
      this.logger.log('数据写入成功...')
      return _res
    }
  }
  // 数据库还原
  async mongorestore(_id: any) {
    var mongorestorePath = _path.join(__dirname, '../../db/' + _id + '/conversionDB');
    const cmd = 'mongorestore -h 127.0.0.1:27017 -d conversionDB --drop ' + mongorestorePath;
    this.logger.log('正在还原数据...')
    var data = await this.toolsService.ShellExecCmd(cmd, '数据库还原');
    if (data['success']) {
      this.logger.log(_id + '备份数据恢复成功...');
      return true;
    }
  }
  // 数据库列表
  async databaseList() {
    var dbBackupPath = _path.join(__dirname, '../../db/');
    if (!fs.existsSync(dbBackupPath)) {
      //创建数据库备份父级目录
      fs.mkdirsSync(dbBackupPath);
    }
    let components = []
    const files = fs.readdirSync(dbBackupPath)
    if (!files.length) {
      return [];
    }
    files.forEach(function (item, index) {
      let stat = fs.lstatSync(dbBackupPath + item)
      if (stat.isDirectory()) {
        var _list = item.split('_');
        var YYYY = _list[0].replace(/\./g, "-");
        var HHMMSS = _list[1].replace(/\./g, ":");
        components.push({
          _id: item,
          name: item + '备份',
          path: '/db/' + item + '/conversionDB',
          createdAt: YYYY + ' ' + HHMMSS
        })
      }
    })
    // 排序后返回
    return components.length > 0 ? components.sort((a, b) => {
      return b.createdAt < a.createdAt ? -1 : 1
    }) : [];
  }

  // 删除
  async delete(query: any) {
    var dbPath = _path.join(__dirname, '../../db/' + query.id);
    // 删除目录文件
    fs.removeSync(dbPath);
    return true;
  }

}


