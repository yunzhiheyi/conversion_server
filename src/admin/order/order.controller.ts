
import { Body, Controller, Get, HttpCode, Post, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ToolsService } from 'src/utils/tools.service';
import { OrderService } from './order.service';
import { IdDto, IdsDto, pagesDto } from '../admin.dto';
import { AdminGuard } from '../admin.guard';

@Controller('admin')
@ApiTags('订单管理')
export class OrderController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly orderService: OrderService,
  ) { }  //注入服务
  // 删除价格
  @Get('order/delete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '删除订单' })
  async deleteOrder(@Query() _Query: IdDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.orderService.delete(_Query, userInfo._id);
    var code = 200;
    var message = '删除成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '删除失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }
  // 批量删除订单
  @Post('order/batchdelete')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '批量删除' })
  async batchDeleteOrder(@Body() _Body: IdsDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['authorization']);
    var result = await this.orderService.delete(_Body, userInfo._id);
    var code = 200;
    var message = '删除成功'
    var data = true;
    if (!result) {
      code = 202;
      message = '删除失败'
      data = false;
    }
    return {
      code,
      data,
      message
    }
  }
  // 获取订单列表
  @Get('order/list')
  @HttpCode(200)
  @UseGuards(AdminGuard) // 拦截权限
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '获取价格列表' })
  async OrderList(@Query() _Query: pagesDto) {
    var price = await this.orderService.orderList(_Query);
    return {
      code: 200,
      data: price,
      message: '获取成功'
    }
  }
}
