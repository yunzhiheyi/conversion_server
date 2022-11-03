
import { Injectable, Logger } from '@nestjs/common';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
import { ReturnModelType } from '@typegoose/typegoose';
import dayjs from 'dayjs';
import { InjectModel } from 'nestjs-typegoose';
import { Teleprompter } from 'src/models/admin/teleprompter.model';
import { ToolsService } from 'src/utils/tools.service';
@Injectable()
export class AppTeleprompterService {
  public logger: Logger;
  constructor(
    @InjectModel(Teleprompter)
    private readonly teleprompter: ReturnModelType<typeof Teleprompter>,
    private readonly snowflakeService: SnowflakeService,
    private readonly toolsService: ToolsService

  ) {
    this.logger = new Logger('AppTeleprompterService')
  }
  // 新建
  async create(body: any, userId: any) {
    body._id = await this.snowflakeService.nextId();
    body.user_id = userId;
    return await this.teleprompter.create(body);
  }
  // 查询用户
  async list(query: any, user_id: string) {
    const options = {
      type: 'page',
      queryPpage: query.page,
      limt: 10,
      findField: {
        user_id,
      }
    };
    if (query.type) {
      options.findField['type'] = query.type || 1
    }
    let data = await this.toolsService.getPageList(options, this.teleprompter);
    var _tdata = data.result.length > 0 ? data.result.toJSON({ getters: true }) : []
    if (_tdata.createAt) {
      _tdata.createAt = dayjs(_tdata.createAt).format('YYYY-MM-DD HH:mm:ss')
    }
    return {
      pages: data.pages,
      result: _tdata,
      total: data.total
    };
  }
}
