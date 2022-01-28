
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { ToolsService } from '../../utils/tools.service';
import { PriceModel } from '../../models/admin/price.model';
import { InjectModel } from 'nestjs-typegoose';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
@Injectable()
export class PriceService {
  constructor(
    @InjectModel(PriceModel)
    private readonly priceModel: ReturnModelType<typeof PriceModel>,
    private readonly toolsService: ToolsService,
    private readonly snowflakeService: SnowflakeService,
  ) { }
  // 添加菜单
  async add(_body: { [x: string]: any; }, _userId: any) {
    const _params = this.toolsService._params(_body);
    _params['_id'] = await this.snowflakeService.nextId();
    const result = await this.priceModel.create(_params);
    return !!result;
  }
  // 更新菜单
  async update(_body: any) {
    const _params = this.toolsService._params(_body);
    const result = await this.priceModel.updateMany(
      { _id: _body._id },
      { $set: _params },
    );
    return !!result;
  }

  // 查询
  async query(_body: any) {
    const result = await this.priceModel.findOne(_body)
    return result;
  }

  // 删除、批量删除权限菜单
  async delete(query: any, _userId: any) {
    // 判断是否是批量删除
    const ids = query.arrids && query.arrids instanceof Array ? query.arrids : [query.id];
    const result = await this.priceModel.deleteMany({ _id: { $in: ids } });
    return !!result
  }

  // 价格列表
  async priceList(query: any) {
    const options = {
      type: query['page'] ? 'page' : 'list',
      sortType: 'sort',
      sortVal: '1'
    };
    return await this.toolsService.getPageList(options, this.priceModel);
  }
}
