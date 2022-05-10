
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SystemService } from '../../admin/system/system.service';
import { CacheService } from '../../utils/redis.service'
import { UserService } from '../../app/user/user.service'
import { ConversionService } from '../../app/conversion/conversion.service'
var crypto = require('crypto');
@Injectable()
export class WechatService {
  constructor(
    private readonly systemService: SystemService,
    private readonly userService: UserService,
    private readonly redisService: CacheService,
    private readonly conversionService: ConversionService
  ) {
    this.systemService.getSystemInfo().then((res) => {
      this.appid = res.wechat['appid']
      this.appsecret = res.wechat['appsecret']
      this.miniprogram_appid = res.miniprogram['appid']
      this.miniprogram_appsecret = res.miniprogram['appsecret']
    });
  }
  public appid: any
  public appsecret: any
  public miniprogram_appsecret: any;
  public miniprogram_appid: any;
  // 获取openId
  async getOpenId(code: any, type: any) {
    let response = await axios.get(
      'https://api.weixin.qq.com/sns/jscode2session',
      {
        params: {
          grant_type: 'authorization_code',
          appid: type === 1 ? this.appid : this.miniprogram_appid,
          secret: type === 1 ? this.appsecret : this.miniprogram_appsecret,
          js_code: code,
        },
      },
    );
    return response.data
  }
  // 获取小程序Access_token
  async getAccessToken(type: any) {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: type === 1 ? this.appid : this.miniprogram_appid,
        secret: type === 1 ? this.appsecret : this.miniprogram_appsecret,
      }
    })
    this.redisService.set('access_token_' + (type === 1 ? 'wechat' : 'miniprogram'), response.data.access_token, 7200)
    return response.data.access_token
  }
  // 获取公众号的用户信息
  public async getUserInfoOfficialAccount(openId: any, access_token: any) {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/user/info?access_token', {
      params: {
        access_token,
        openid: openId,
        lang: 'zh_CN'
      }
    })
    return response.data
  }
  // 关注公众号
  async OfficialAccount(openId: any) {
    let access_token = '';
    const redis_access_token = await this.redisService.get('access_token_wechat');
    if (redis_access_token) {
      access_token = redis_access_token
    } else {
      access_token = await this.getAccessToken(1);
    }
    const loginInfo = await this.getUserInfoOfficialAccount(openId, access_token);
    return loginInfo

  }
  // 绑定微信号，此路是为了解决手机号登录用户绑定问题
  async wechatBind(body: any, userId: any) {
    const loginInfo = await this.getOpenId(body.code, 2);
    var options = {
      _id: userId,
      avatar: body.avatarUrl,
      nickname: body.nickName,
      openid: loginInfo.openid,
      unionid: loginInfo.unionid,
      is_bind_wechat: 1, // 判断是否绑定
    }
    const res = await this.userService.updateManyUser(options);
    return res
  }
  // 微信授权登录
  async wechatAuthLogin(body: any) {
    const loginInfo = await this.getOpenId(body.logincode, 2);
    const _data = await this.userService.create('', loginInfo.openid, loginInfo.unionid, body.inviter_code, body.avatarUrl, body.nickName);
    if (!_data) {
      return {
        code: 200,
        data: false,
        message: '登录失败'
      };
    }
    return {
      code: 200,
      data: _data,
      message: '登录成功'
    };
  }
  // 获取小程序手机号登录
  async getPhoneNumber(query: any) {
    let access_token = '';
    const redis_access_token = await this.redisService.get('access_token_miniprogram');
    if (redis_access_token) {
      access_token = redis_access_token
    } else {
      access_token = await this.getAccessToken(2);
    }
    const loginInfo = await this.getOpenId(query.logincode, 2);
    const response = await axios.post(
      'https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=' + access_token,
      {
        code: query.phonecode,
      },
    )
    if (response.data.errcode) {
      return {
        code: response.data.errcode,
        data: false,
        message: '授权失败'
      }
    }
    if (response) {
      // 查询有无此用户
      var _data = await this.userService.create(response.data.phone_info.purePhoneNumber, loginInfo.openid, loginInfo.unionid, query.inviter_code, '', '');
      if (!_data) {
        return {
          code: 200,
          data: false,
          message: '登录失败'
        };
      }
      return {
        code: 200,
        data: true,
        message: '登录成功'
      };
    }
  }
  // 公众号事件回调
  eventServerCallback(query: any) {
    const token = 'yunzhiheyiHejunTuxx', // 自定义，与公众号设置的一致
      signature = query.signature,
      timestamp = query.timestamp,
      nonce = query.nonce;
    // 字典排序
    const arr = [token, timestamp, nonce].sort();
    const sha1 = crypto.createHash('sha1');
    sha1.update(arr.join(''));
    const result = sha1.digest('hex');
    // 成功
    return result === signature;
  }
  // 新用户关注后添加时长
  async userAddTime(unionid: any) {
    var userInfo = await this.userService.findOneUpdateInfo({ unionid })
    console.log(userInfo);
    // 如果关注过就不再添加时长
    if (userInfo['isConcern'] === 1) {
      return;
    }
    if (userInfo) {
      // 关注公众号得时长
      await this.userService.findUpdateConcern({ _id: userInfo['_id'] });
      var _res = await this.conversionService.AddRecordOrTime(180, userInfo['_id'] + '', 1, '12MkDKkVT4', true);
      return !!_res
    }
  }
}
