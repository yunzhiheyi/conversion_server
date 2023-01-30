
import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { ToolsService } from 'src/utils/tools.service';
import { OrderModel } from '../../models/admin/order.model';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
@Injectable()
export class OrderService {
  constructor(
    @InjectModel(OrderModel)
    private readonly orderModel: ReturnModelType<typeof OrderModel>,
    private readonly toolsService: ToolsService,
    private readonly snowflakeService: SnowflakeService,
  ) { }
  // 删除、批量删除权限菜单
  async delete(query: any, _userId: any) {
    // 判断是否是批量删除
    const ids = query.arrids && query.arrids instanceof Array ? query.arrids : [query.id];
    const result = await this.orderModel.deleteMany({ _id: { $in: ids } });
    return !!result
  }

  // 订单列表
  async orderList(query: any) {
    let reg = new RegExp(query.keyword, 'i');
    let findField = {};
    if (query.keyword) {
      findField['_id'] = { $regex: reg }
    }
    if (query.status) {
      findField['status'] = query.status
    }
    const options = {
      type: 'pop',
      findField,
      queryPpage: query.page,
      populate: [
        {
          path: 'user_id',
          select: { _id: 0, mobile: 1, nickname: 1 },
        },
        {
          path: 'product_code',
          select: { _id: 0, type: 1, expir_time: 1, product_code: 1, payment_price: 1 },
        },
      ]
    };
    let data = await this.toolsService.getPageList(options, this.orderModel);
    return data;
  }
}
