import { Body, Controller, Get, Post, Request, Headers, UseGuards, Req, HttpCode, Query, HttpException } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import dayjs from 'dayjs';
import { CreateUserDto, RefreshTokenDto } from '../app.dto';
import { AppGuard } from '../app.guard';
import { ToolsService } from '../../utils/tools.service';
import { UserService } from './user.service';
import { CacheService } from 'src/utils/redis.service';
import { jwtSecret } from 'src/config';
import { SystemService } from '../../admin/system/system.service';
// app控制器
@Controller('app')
@ApiTags('用户')
export class UserController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly userService: UserService,
    private readonly redisService: CacheService,
    private readonly systemService: SystemService,
  ) { }

  @Post('user/loginCode')
  @HttpCode(200)
  @ApiOperation({ summary: '验证码登录接口' })
  async appLogin(@Body() caeatePostUser: CreateUserDto) {
    var successData = {
      code: 200,
      data: null
    }
    const systemInfo = await this.systemService.getSystemInfo();
    var _info = systemInfo.whiteUser.join(',')
    console.log(_info.indexOf(caeatePostUser.mobile) > -1);
    // const moblieKey = await this.toolsService.AesEncrypt(caeatePostUser.mobile); //使用手机号加密为KEY
    const mobileCode = await this.redisService.get(caeatePostUser.mobile);
    console.log('mobileCode------', mobileCode);
    // 过滤测试手机号验证码
    if (_info.indexOf(caeatePostUser.mobile) < 0) {
      if (!mobileCode) {
        successData['code'] = 5010;
        successData['message'] = '验证码不存在, 请重新发送短信'
        return successData;
      }
      if (mobileCode !== caeatePostUser.code) {
        successData['code'] = 5011;
        successData['message'] = '验证码错误, 请确认验证码输入正确';
        return successData
      }
    }
    var _data = await this.userService.create({ mobile: caeatePostUser.mobile, inviter_code: caeatePostUser.inviter_code }); // 直接转空
    successData['data'] = _data;
    this.redisService.del(caeatePostUser.mobile)  //登录成功后清除当前验证码
    return successData
  }
  @Get('user/info')
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '获取用户信息' })
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  async getUserInfo(@Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    var _data = await this.userService.findById(userInfo.data['id']);
    // 没有系统类型才添加
    if (!_data.systemType) {
      var options = {
        _id: userInfo.data['id'],
        systemType: getHeaders['app-system-type'],
      }
      await this.userService.updateManyUser(options);
    }
    const systemInfo = await this.systemService.getSystemInfo();
    var _tdata = _data.toJSON({ getters: true })
    if (_data) {
      _data.createAt = dayjs(_data.At).format('YYYY-MM-DD HH:mm:ss')
    }
    return {
      code: 200,
      // 开关审核IOS支付
      data: { ..._tdata, offonState: systemInfo.isIosAudit },
      success: true
    }
  }
  @Get('refreshToken')
  @ApiOperation({ summary: '刷新Token' })
  async refreshToken(@Query() _query: RefreshTokenDto, @Headers() getHeaders: Headers) {
    var refreshUserInfo = await this.toolsService.TokenGetUserInfo(_query.token);
    // // 刷新Token失效重新登录
    if (refreshUserInfo.err) {
      throw new HttpException({ code: 4000, msg: 'Token已失效请重新登录' }, 200);
    }
    // 获取redis 刷新Token信息
    var refreshTokenData = await this.redisService.get('UserInfo_' + refreshUserInfo.data.id);
    if (!refreshTokenData) {
      throw new HttpException({ code: 4003, msg: '当前refreshToken无效' }, 200);
    }
    // 更新一下登录时间字段
    await this.userService.updateManyUser({
      _id: refreshUserInfo.data.id,
      last_login_time: dayjs(Date()).format()
    })
    var _newUserInfo = {
      _id: refreshUserInfo.data.id,
      mobile: refreshUserInfo.data.mobile
    }
    var refreshToken: string;
    var nowTime = Math.floor(Date.now()); // 当前时间
    var accessToken = this.userService.generateAccessToken(_newUserInfo); // 新建accessToken
    var minTimeOfRefreshToken = 2 * jwtSecret.accessTokenExpiresIn; //refreshToken 有效时长
    var refreshTokenStartTime = refreshTokenData.refreshTokenStartTime; //refreshToken创建的起始时间点
    //(refreshToken上次创建的时间点 + refreshToken的有效时长 - 当前时间点) 表示refreshToken还剩余的有效时长，如果小于2倍accessToken时长 ，则刷新 refreshToken
    if (!refreshTokenData || ((refreshTokenStartTime * 1000 + jwtSecret.refreshTokenExpiresIn * 1000 - nowTime) <= minTimeOfRefreshToken)) {
      refreshToken = this.userService.generateRefreshToken(_newUserInfo);
      var RefreshTokeninfo = {
        refreshToken: refreshToken,
        refreshTokenStartTime: nowTime
      }
      this.redisService.set('UserInfo_' + refreshTokenData.id, RefreshTokeninfo, jwtSecret.refreshTokenExpiresIn); // 1个月过期
    } else {
      refreshToken = _query.token
    }
    return {
      code: 200,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken
      },
      success: true
    }
  }
}
