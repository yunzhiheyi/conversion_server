import { Body, Controller, Post, Headers, Query, Logger, UseGuards, Req, Res, HttpCode, Get } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateIdDto, ProductCodeDto, OrderUpdateDto } from '../app.dto';
import { ToolsService } from '../../utils/tools.service';
import { PayService } from './pay.service';
import { InjectBullMQ, BullMQ } from 'nestjs-bullmq';
import { AppGuard } from '../app.guard';
import { CacheService } from 'src/utils/redis.service';
import { pagesDto } from 'src/admin/admin.dto';
@Controller('app')
@ApiTags('支付')
export class PayController {
  logger: Logger;
  constructor(
    @InjectBullMQ('QueueName') private readonly bullMQ: BullMQ,
    private readonly toolsService: ToolsService,
    private readonly redisService: CacheService,
    private readonly payService: PayService,
  ) {
    this.logger = new Logger('PayController')
    // 监听队列里处理完成后移除队列
    this.bullMQ.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      if (jobId) {
        this.bullMQ.queue.remove(jobId);
      }
    });
    // 队列查看，有值就取消订单
    this.bullMQ.process(async job => {
      if (job.data.order_id) {
        this.logger.log('订单' + job.data.order_id + '取消')
        await this.payService.cancelOrder({ order_id: job.data.order_id });
      }
    })
  }
  @Post('order/create')
  @UseGuards(AppGuard) // 拦截权限
  @HttpCode(200)
  @ApiOperation({ summary: '创建订单' })
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  async createOrder(@Body() caeatePostOrder: ProductCodeDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    const data = await this.payService.create(caeatePostOrder, userInfo.data.id)
    console.log('data---', data);
    if (data.order_id) {
      // 加入队列30分钟后失效
      const Job = await this.bullMQ.queue.add('order', { order_id: data.order_id }, { delay: 1800000 });
      this.redisService.set('bullMQ_JOB_ID', Job.id, 0);
    }
    return {
      code: 200,
      data,
      message: '创建成功'
    }
  }
  @Post('order/cancel')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '取消订单状态' })
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  async updateOrder(@Body() orderUpdate: OrderUpdateDto) {
    const data = await this.payService.cancelOrder(orderUpdate)
    if (data) {
      // 取消成功后移除队列
      var JobID = await this.redisService.get('bullMQ_JOB_ID');
      this.bullMQ.queue.remove(JobID);
    }
    return {
      code: 200,
      data,
      message: '取消成功'
    }
  }
  @Post('order/pay')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '订单支付' })
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  async payOrder(@Body() caeatePostOrder: CreateIdDto) {
    const data = await this.payService.pay(caeatePostOrder)
    return {
      code: 200,
      data,
      message: '更新成功'
    }
  }
  // 微信回调通知
  @Post('order/notify')
  @ApiOperation({ summary: '回调通知' })
  async notifyUrl(@Req() _req, @Res() _res) {
    const { event_type, resource, isSuccess } = await this.payService.decryptNotify(_req.body);
    if (isSuccess) {
      // 支付成功后移除队列
      var JobID = await this.redisService.get('bullMQ_JOB_ID');
      this.bullMQ.queue.remove(JobID);
      this.logger.log('微信回调通结果:', event_type)
    }
    // 已经返回XML，就是会一直不停的收到消息，已经对业务作了处理
    _res.set('Content-Type', 'text/xml')
    if (event_type.indexOf('SUCCESS') > -1) {
      _res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>')
    } else {
      _res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[通知失败]]></return_msg></xml>')
    }
  }
  // 用户订单列表
  @Get('order/list')
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '用户订单列表' })
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  async UserOrderList(@Query() _Query: pagesDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    const data = await this.payService.orderList(_Query, userInfo.data.id);
    return {
      code: 200,
      data,
      message: '获取成功'
    }
  }
}
