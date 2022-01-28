import { Controller, Get, HttpCode, Query, Body, Post, Req, Headers, UseGuards, All } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { wechatBindDto, codeDto, wechatBindofficialAccount } from 'src/app/app.dto';
import { AppGuard } from '../app.guard';
import { WechatService } from './wechat.service'
import { ToolsService } from '../../utils/tools.service';
const WechatEncrypt = require('wechat-encrypt')
@Controller('app')
@ApiTags('微信相关')
export class WechatController {
  public wechatEncrypt: any
  constructor(
    private readonly wechatService: WechatService,
    private readonly toolsService: ToolsService,
  ) {
    this.wechatEncrypt = new WechatEncrypt({
      appId: 'wxf82de3718bc8822a',
      encodingAESKey: 'llLMSMIpB07CyORG46pMiHFcje29PRM32i1Nz46yDRw',
      token: 'yunzhiheyiHejunTuxx'
    })

  }
  // 微信授权手机号登录
  @Get('wechat/auth')
  @HttpCode(200)
  @ApiOperation({ summary: '微信授权手机号登录' })
  async wechatAuth(@Query() _Query: codeDto) {
    const _data = await this.wechatService.getPhoneNumber(_Query);
    return {
      code: 200,
      data: _data,
      message: '登录成功',
    }
  }
  // 绑定微信号
  @Post('wechat/bind')
  @UseGuards(AppGuard) // 拦截权限
  @HttpCode(200)
  @ApiOperation({ summary: '微信授权更新信息' })
  async wechatBind(@Body() _body: wechatBindDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    const _data = await this.wechatService.wechatBind(_body, userInfo['data'].id);
    return {
      code: 200,
      data: _data,
      message: '更新成功',
    }
  }
  // 关注公众号
  @All('wechat/callback')
  @HttpCode(200)
  @ApiOperation({ summary: '关注公众号' })
  async wechatOfficialAccount(@Query() _query: wechatBindofficialAccount, @Req() _req) {
    var eventServer = this.wechatService.eventServerCallback(_query);
    if (eventServer) {
      let xml = this.wechatEncrypt.decode(_req.body.xml.Encrypt[0]);
      var EventXml = this.toolsService.parseWechatXML(xml);
      var userInfo = await this.wechatService.OfficialAccount(EventXml['FromUserName']);
      if (userInfo['subscribe'] === 1) {
        await this.wechatService.userAddTime(userInfo.unionid);
        console.log('关注');
      }

    }
    if (_query.echostr) {
      return _query.echostr
    } else {
      return ''
    }
  }

}
