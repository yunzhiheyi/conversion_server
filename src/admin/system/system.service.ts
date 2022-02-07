import { ToolsService } from '../../utils/tools.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { SystemInfoModel } from '../../models/admin/system.model';
@Injectable()
export class SystemService {
  constructor(
    @InjectModel(SystemInfoModel)
    private readonly systemInfoModel: ReturnModelType<typeof SystemInfoModel>,
    private readonly toolsService: ToolsService,
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
}


