import { Body, Controller, Get, Post, Request, All, Headers, UseGuards, Query, Req, Res, HttpCode } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ToolsService } from '../../utils/tools.service';
import { MiniprogramUploadService } from '../../utils/miniprogram.upload';
import { QiniuService } from '../../utils/qiniu.service';
import { SendsmsDto, MiniprogramFileDto, idDto, FileDto } from '../app.dto';
import fs from 'fs-extra';
import { GenericService } from './generic.service';
import { ConversionService } from '../conversion/conversion.service';
import { CacheService } from '../../utils/redis.service';
import { AppGuard } from '../app.guard';
import _path from 'path';
import { UserService } from '../user/user.service';
var formidable = require("formidable");
@Controller('app')
@ApiTags('通用')
export class GenericController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly genericService: GenericService,
    private readonly redisService: CacheService,
    private readonly userService: UserService,
    private readonly conversionService: ConversionService,
    private readonly miniprogramUpload: MiniprogramUploadService,
    private readonly qiniuService: QiniuService,
  ) { }
  // 发送验证码
  @Post('generic/sendsms')
  @HttpCode(200)
  @ApiOperation({ summary: '获取验证码' })
  async sendsms(@Body() _Body: SendsmsDto) {
    var _code;
    var mobile = _Body.mobile;  // 手机号
    var smsType = _Body.smsType // 验证码类型  1 注册、登录 2 修改手机
    // const moblieKey = await this.toolsService.AesEncrypt(mobile); //使用手机号加密为KEY
    const mobileCode = await this.redisService.get(mobile);
    console.log('mobileCode------', mobileCode);
    // 读取Redis没有值才写入随机验证码
    if (!mobileCode) {
      _code = this.toolsService.randomCode(6, 1);
      this.redisService.set(mobile, _code, 300); // 短信验证码5分钟有效存于redis
    }
    var _data = {
      code: 200
    }
    const data = await this.genericService.tencentSMS(smsType, mobile, mobileCode || _code)  // 这里为了防止验证码为空时会报错
    if (data) {
      var _SendStatusSet = data && data['SendStatusSet'][0];
      switch (_SendStatusSet['Code']) {
        case 'Ok':
          _data.code = 200;
          _data['message'] = '验证发送成功，请查收短信';
          break;
        case 'LimitExceeded.PhoneNumberDailyLimit':
          _data.code = 5011;
          _data['message'] = '每天发送的短信数超过上限';
          break;
        case 'InvalidParameterValue.TemplateParameterFormatError':
          _data.code = 5012;
          _data['message'] = '验证码模板参数格式错误';
          break;
      }
    }
    return _data
  }

  // 大文件上传
  @Post('generic/upload')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '大文件上传' })
  async MiniprogramUploadFile(@Query() _Query: MiniprogramFileDto, @Body() _Body) {
    const _data = await this.miniprogramUpload.upload(_Query, _Body);
    return {
      code: 200,
      data: _data
    }
  }

  // 大文件合并
  @Get('generic/merge')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '大文件合并' })
  async MiniprogramMergeFile(@Query() _Query: MiniprogramFileDto, @Headers() getHeaders: Headers) {
    var userInfo = await this.toolsService.TokenGetUserInfo(getHeaders['app-access-token'])
    var queryUser = await this.userService.findById(userInfo.data['id']);
    const _res = await this.miniprogramUpload.merge(_Query, queryUser);
    const resData = _res['data'];
    const _data = await this.conversionService.create(resData, userInfo.data['id'], _res.isUserTimeSub);
    if (_data._id) {
      var code = _res['code'];
      return {
        id: _data._id,
        data: code === 1,
        sCode: code,
        message: code === 1 ? '合并成功' : code === 2 ? '时长不足，转写失败,充值后可在转写记录重新提交' : code === 3 ? '合并失败' : '',
        code: 200
      }
    }
  }
  // 大文件秒验
  @Get('generic/verify')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiHeader({
    name: 'app-access-token',
    required: false,
    description: '本次请求请带上token',
  })
  @ApiOperation({ summary: '大文件秒验' })
  async MiniprogramVerifyFile(@Query() _Query: MiniprogramFileDto) {
    // const _data = await this.conversionService.create(_res['data']);
    return {
      code: 200
    }
  }

  // 测试
  @Post('upload/flie')
  @HttpCode(200)
  @ApiOperation({ summary: '文件上传' })
  async uploadFile(@Body() _Body, @Req() _req, @Res() _res) {
    var data = await this.genericService.uploadFile(_Body);
    var form = new formidable.IncomingForm();
    form.parse(_req, function (err, fields, files) {
      console.log('fields============' + fields);
      console.log('files============' + files);
      console.log('fields:' + JSON.stringify(fields));
      console.log('files:' + JSON.stringify(files));
      var keys = Object.keys(files);
      keys.forEach(function (key) {
        if (!files[key]) {
          return;
        }
        var extname = _path.extname(files[key].newFilename);
        //改名
        fs.rename(files[key].filepath, _path.join(__dirname, '../../public/upload/') + key + '.mp4', () => {
          console.log('上传成功', _path.join(__dirname, '../../public/upload/') + key + '.mp4')
        })
      });
    });
  }

  // 获取token
  @Get('generic/qiuniu/token')
  @HttpCode(200)
  @ApiOperation({ summary: '获取token' })
  async QiuniuToken(@Query() _Query: FileDto) {
    console.log(_Query)
    var _key = _Query.fileName;
    var token = this.qiniuService.uptoken(_key);
    console.log(token);
    return {
      code: 200,
      data: token,
      msg: '获取token成功'
    }
  }

  // 价格列表
  @Get('generic/price')
  @HttpCode(200)
  @ApiOperation({ summary: '价格列表' })
  async getPriceList() {
    var data = await this.genericService.priceList()
    return {
      code: 200,
      data,
      message: '获取成功',
    }
  }

  // 生成txt文档
  @Post('generic/word')
  @HttpCode(200)
  @UseGuards(AppGuard) // 拦截权限
  @ApiOperation({ summary: '生成word文档' })
  async officegenWord(@Body() _Body: idDto, @Headers() getHeaders: Headers) {
    const _res = await this.genericService.officegenWord(_Body.id);
    if (_res['code'] === 1) {
      return {
        code: 200,
        data: _res['data'],
        msg: '获取成功'
      };
    }
  }
  // 录音转写任务
  @All('generic/recTaskCallBack')
  @HttpCode(200)
  @ApiOperation({ summary: '录音转写回调' })
  async recTaskCallBack(@Body() _body, @Req() _req, @Headers() getHeaders: Headers) {
    var __resultDetail = JSON.parse(_body.resultDetail)
    var ResultDetail = __resultDetail.map((item) => {
      return {
        "text": item.FinalSentence,
        "start_time": item.StartMs,
        "end_time": item.EndMs,
        "speaker_id": 0
      }
    })
    var _data = await this.conversionService.updateManyData({ taskId: _body.requestId }, {
      taskDetailed: ResultDetail,
      taskStatus: 3,
      taskText: _body.text.replace(/\[.*?\]  /g, ""),
    })
    if (_data) {
      console.log('录音转写回调写入成功');
    }
  }
}
