import { Injectable } from '@nestjs/common';
import _path from 'path';
import fs from 'fs';
import Payment from '@axolo/node-wechat-pay';
import { OrderModel } from '../../models/admin/order.model';
import { SystemService } from '../../admin/system/system.service';
import { InjectModel } from 'nestjs-typegoose';
import { SnowflakeService } from '@quickts/nestjs-snowflake';
import dayjs from 'dayjs';
import { AppRecord } from '../../models/app/record.model';
import { AppUserModel } from '../../models/app/user.model';
import { PriceService } from '../../admin/price/price.service';
import { PriceModel } from '../../models/admin/price.model';
import { ReturnModelType } from '@typegoose/typegoose';
import { ToolsService } from '../../utils/tools.service';
import { WechatService } from '../wechat/wechat.service';
// import { OnQueueActive } from 'nestjs-bullmq';
@Injectable()
export class PayService {
  public serverUrl: any  // 服务器地址
  public wechatKey: any  // 微信支付key
  public mch_id: any     // 微信支付 mch_id
  public appid: any      // 小程序 appid
  public pemKeyPath: any
  public pemCrtPath: any
  public notifyUrl: string
  public Payment: any
  public Snowflake: any
  constructor(
    @InjectModel(OrderModel)
    private readonly orderModel: ReturnModelType<typeof OrderModel>,
    @InjectModel(PriceModel)
    private readonly priceModel: ReturnModelType<typeof PriceModel>,
    @InjectModel(AppRecord)
    private readonly recordModel: ReturnModelType<typeof AppRecord>,
    @InjectModel(AppUserModel)
    private readonly userModel: ReturnModelType<typeof AppUserModel>,
    private readonly systemService: SystemService,
    private readonly priceService: PriceService,
    private readonly toolsService: ToolsService,
    private readonly snowflakeService: SnowflakeService,
    private readonly wechatService: WechatService,

  ) {
    var _time = new Date().getTime() / 1000;
    // 从后台参数去读取
    this.systemService.getSystemInfo().then((_SYS: any) => {
      this.appid = _SYS.miniprogram.appid; //小程序AppId
      this.wechatKey = _SYS.wechatPay.key; //自行去商户后台生成
      this.mch_id = _SYS.wechatPay.mch_id; //商户id
      this.serverUrl = _SYS.setup.serverUrl;
      const pemKeyPath = _path.resolve(__dirname, '../../public/pem/wechat_key.pem');
      const pemCrtPath = _path.resolve(__dirname, '../../public/pem/wechat_cert.pem');
      this.pemKeyPath = fs.readFileSync(pemKeyPath).toString();
      this.pemCrtPath = fs.readFileSync(pemCrtPath).toString();
      this.notifyUrl = _SYS.setup.serverUrl + '/api/app/order/notify';
      this.Payment = new Payment({
        appType: 'mp',
        appId: _SYS.miniprogram.appid,
        mchId: _SYS.wechatPay.mch_id,
        mchCertKey: this.pemKeyPath, //或者直接复制证书文件内容
        mchCert: this.pemCrtPath,
        mchCertSn: '5B1257D8281200EA13CAC7210437531146B43695',
        apiV3Key: this.wechatKey,
        notifyUrl: this.notifyUrl, //可以在初始化的时候传入设为默认值, 不传则需在调用相关API时传入, 调用相关API时传入新值则使用新值,
      });
    });
  }
  // 根据订单查询信息
  public async getOrderInfo(order_id: any) {
    return await this.orderModel.findOne({ _id: order_id }).populate([
      {
        path: 'user_id',
        select: { _id: 1, openid: 1, unionid: 1, remaining_time: 1 },
      },
      {
        path: 'product_code',
        select: { _id: 0, payment_price: 1, expir_time: 1, name: 1 },
      }]);
  }
  //获取RSA签名返回支付信息给前端
  async pay(_body: any) {
    // 根据订单ID查询支付金额
    let orderInfo = await this.getOrderInfo(_body.order_id);
    if (!orderInfo) {
      return false;
    }
    var price: any = orderInfo.product_code['payment_price'];
    // 获取prepay_id
    var res = await this.Payment.http.post('/v3/pay/transactions/jsapi', {
      appid: this.appid,
      mchid: this.mch_id,
      description: '语音转换精灵_' + orderInfo.product_code['name'] + '充值',
      out_trade_no: orderInfo._id, // 订单号,
      amount: {
        total: (price / 100) * 100,  // 以分为单位
      },
      payer: {
        openid: orderInfo.user_id['openid']
      },
      notify_url: this.notifyUrl,
    });
    // 获取支付密钥
    return this.Payment.payRequest('prepay_id=' + res.data.prepay_id);
  }
  // 关闭订单状态
  async cancelOrder(_body: any) {
    const result = await this.orderModel.updateMany({ _id: _body.order_id }, {
      $set: {
        status: 'TRADING_HALT',
        close_time: Date(),
        timeout_time: null
      }
    });
    return !!result
  }
  // 新建订单
  async create(_body: any, userId: any) {
    // 根据产品Code查询支付金额
    const product_price = await this.priceService.query({ product_code: _body.product_code })
    if (!product_price) {
      return
    }
    // 根据Code获取OpenId
    if (_body.code) {
      const getOpenId = await this.wechatService.getOpenId(_body.code, 2);
      // // 更新用户的OpenId
      await this.userModel.updateMany({ _id: userId }, {
        $set: {
          openid: getOpenId.openid,
          unionid: getOpenId.unionid
        }
      })
    }
    const id = await this.snowflakeService.nextId();  // 生成ID
    const order_params = {
      _id: id,
      product_code: product_price._id,
      user_id: userId, //用户ID
      timeout_time: dayjs(new Date()).add(30, 'minute'),
    };
    const OrderResult = await this.orderModel.create(order_params); // 创建订单详情
    if (OrderResult._id) {
      return {
        order_id: OrderResult._id
      }
    }
  }

  // 微信回调通知
  async decryptNotify(data: any) {
    const { event_type, resource } = this.Payment.notify(data);
    let orderInfo = await this.getOrderInfo(resource.out_trade_no);
    console.log(event_type, resource);
    // 支付成功后回调一次后就不走了，防止微信多次回调
    if (event_type === 'TRANSACTION.SUCCESS' && orderInfo.status !== 'PAY_SUCCESS') {
      // 更新订单状态
      await this.orderModel.updateMany({ _id: resource.out_trade_no }, {
        $set: {
          status: 'PAY_SUCCESS', payment_time: resource.success_time, timeout_time: null, transaction_id: resource.transaction_id
        }
      });
      // // 更新用户的时长
      await this.userModel.updateMany({ _id: orderInfo.user_id['_id'] }, {
        $inc: { remaining_time: +orderInfo.product_code['expir_time'] }
      })
      // 实例ID
      let _id = await this.snowflakeService.nextId()
      // 增加用户时长记录
      await this.recordModel.create({
        _id,
        type: 1, // 增加
        user_id: orderInfo.user_id['_id'],
        recordName: 'Jm_pUjnbK', // 这里的ID是关注的任务类似表
        time: orderInfo.product_code['expir_time']
      })
    }
    return { event_type, resource, isSuccess: orderInfo.status !== 'PAY_SUCCESS' };
  }

  // 查询用户的订单列表
  async orderList(query: any, user_id: string) {
    const options = {
      type: 'pop',
      queryPpage: query.page,
      findField: {
        user_id,
        status: 'PAY_SUCCESS'
      },
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
    var resultArr = []
    data.result.map((item) => {
      var _item = {
        _id: item._id,
        product_code: item.product_code,
        status: item.status,
        pay_type: item.metaInfo,
        createdAt: dayjs(new Date(item['createdAt'])).format('YYYY-MM-DD HH:mm:ss')
      }
      resultArr.push(_item);
    })
    return {
      pages: data.pages,
      result: resultArr,
      total: data.total
    };
  }
}
