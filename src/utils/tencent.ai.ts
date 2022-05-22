import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
var crypto = require('crypto');
var fs = require('fs');
import _qs from 'qs';
const tencentcloud = require("tencentcloud-sdk-nodejs");
const AsrClient = tencentcloud.asr.v20190614.Client;
// 腾讯AI 语音识别
@Injectable()
export class TencentAiService {
  public logger: Logger;
  public asrClient: any;
  constructor(
    // private readonly redisService: CacheService
  ) {
    this.logger = new Logger('TencentAiService');
    const clientConfig = {
      credential: {
        secretId: "AKIDjIbdQyKRQGtHPK2VjhPt9ByVnrfDVXKr",
        secretKey: "JNBj26uSq1wb0EYotiHbgV5RYP0MSIuH",
      },
      region: "",
      profile: {
        httpProfile: {
          endpoint: "asr.tencentcloudapi.com",
        },
      },
    };
    this.asrClient = new AsrClient(clientConfig);
  }
  // 字典排序对象
  public sort_params = (params: any) => {
    let strParam = '';
    let keys = Object.keys(params);
    keys.sort();
    for (let k in keys) {
      strParam += '&' + keys[k] + '=' + params[keys[k]];
    }
    return strParam;
  };
  // 拼接URL
  public get_req_url(_params: any, endpoint: any) {
    const url_strParam = this.sort_params(_params);
    return 'https://' + endpoint + '?' + url_strParam.slice(1);
  }
  // 格式化字符串
  public formatSignString(reqMethod: any, endpoint: any, path: any, strParam: string) {
    let strSign = reqMethod + endpoint + path + '?' + strParam.slice(1);
    return strSign;
  };
  // 转sha1
  sha1(secretKey: any, strsign: any) {
    let signMethodMap = { HmacSHA1: 'sha1' };
    let hmac = crypto.createHmac(signMethodMap['HmacSHA1'], secretKey || '');
    return hmac.update(Buffer.from(strsign, 'utf8')).digest('base64');
  };

  // 语音转写新建任务
  async createTask(audioData, _duration, voice_format) {
    var resData: any;
    // console.log(audioData, _duration, voice_format);
    // 大于30分钟
    if ((_duration / 60) > 30) {
      resData = await this.CreateRecTask(audioData, voice_format);
    } else {
      resData = await this.fastRecTask(audioData, voice_format);
    }
    return resData
  }
  //  
  async fastRecTask(audioData, voice_format) {
    var timestamp = Math.round(Date.now() / 1000);
    const endpoint = 'asr.cloud.tencent.com';
    let params = {
      secretid: 'AKIDjIbdQyKRQGtHPK2VjhPt9ByVnrfDVXKr',
      engine_type: '16k_zh_video',
      voice_format: voice_format || 'pcm',
      timestamp: timestamp,
      speaker_diarization: 1,
      filter_dirty: 0,
      filter_modal: 0,
      filter_punc: 0,
      convert_num_mode: 1,
      word_info: 0,
      first_channel_only: 1,
    };
    // 签名
    var strParam = this.sort_params(params);
    var strSign = this.formatSignString(
      'POST',
      endpoint,
      '/asr/flash/v1/1258264756',
      strParam,
    );
    const signature = this.sha1('JNBj26uSq1wb0EYotiHbgV5RYP0MSIuH', strSign);
    let pcmData = fs.readFileSync(audioData.audioUrl);
    const req_url = this.get_req_url(params, endpoint + '/asr/flash/v1/1258264756');
    // 创建音频转写任务
    this.logger.log('正在转写语音...')
    let _result = await axios({
      url: req_url,
      data: pcmData,
      method: 'post',
      timeout: 1920000,
      headers: {
        Authorization: signature,
      },
      maxContentLength: 1048576000,
      maxBodyLength: 1048576000
    });
    if (!_result.data.code) {
      this.logger.log('转写成功!')
      return {
        code: 0,
        flash_result: _result.data.flash_result[0]
      }
    } else {
      var _msg = ''
      switch (_result.data.code) {
        case 4001:
          _msg = '参数不合法';
        case 4002:
          _msg = '鉴权失败';
        case 4004:
          _msg = '无可使用的免费额度';
        case 4005:
          _msg = '账户欠费停止服务，请及时充值';
        case 4006:
          _msg = '账号当前调用并发超限';
        case 4007:
          _msg = '音频解码失败，请检查上传音频数据格式与调用参数一致';
        case 4008:
          _msg = '客户端数据上传超时';
        case 4009:
          _msg = '客户端连接断开';
        case 4010:
          _msg = '客户端上传未知文本消息';
        case 4011:
          _msg = '音频数据太大';
        case 4012:
          _msg = '音频数据为空';
        case 5001:
          _msg = '后台错误，请重试';
        case 5002:
          _msg = '音频识别失败';
        case 5003:
          _msg = '音频识别超时';
        default:
          this.logger.log('其他错误');
      }
      this.logger.error(_msg)
      return {
        code: _result.data.code,
        msg: _msg,
        flash_result: null
      }
    }
  }
  // 新建任务转写
  async CreateRecTask(audioData, voice_format) {
    // var regPath = audioData.replace(/(.*\/)*([^.]+).*/ig, "$2");
    const params = {
      "EngineModelType": "16k_zh_video",
      "ChannelNum": 1,
      "ResTextFormat": 2,
      "SourceType": 0, // 0：语音 URL；1：语音数据
      "SpeakerDiarization": 1, //是否开启说话人分离
      'SpeakerNumber': 0,
      'Url': audioData.mp3Url,
      'CallbackUrl': 'https://conversion-api.maxbox.com.cn/api/app/generic/recTaskCallBack',// 成功回调
    };
    this.logger.log('正在转写语音...')
    var resData = await this.asrClient.CreateRecTask(params);
    if (resData['Data']) {
      this.logger.log('转写成功');
      return {
        code: 0,
        msg: '转写成功',
        flash_result: resData['Data']
      }
    } else {
      var _msg = '';
      switch (resData['Error']['Code']) {
        case 'FailedOperation.ServiceIsolate':
          _msg = '账号因为欠费停止服务，请在腾讯云账户充值';
        case 'FailedOperation.ErrorRecognize':
          _msg = '识别失败。';
        case 'FailedOperation.UserHasNoFreeAmount':
          _msg = '账号本月免费额度已用完';
        case 'InternalError.ErrorDownFile':
          _msg = '下载音频文件失败';
        case 'MissingParameter':
          _msg = '参数错误';
        case 'InvalidParameterValue':
          _msg = '参数取值错误';
        case 'MissingParameter':
          _msg = '缺少参数错误';
        case 'UnknownParameter':
          _msg = '未知参数错误';
        default:
          this.logger.log('	其他错误');
      }
      this.logger.error(_msg)
      return {
        code: resData['Error']['Code'],
        msg: _msg,
        flash_result: null
      }
    }
  }
  // 新建任务回调
  async DescribeTaskStatus(TaskId) {
    const params = {
      "TaskId": TaskId
    };
    this.logger.log('正在查询...')
    var resData = await this.asrClient.DescribeTaskStatus(params);
    if (resData['Data']) {
      this.logger.log('查询成功...')
      return resData['Data']
    } else {
      var _msg = '';
      switch (resData['Error']['Code']) {
        case 'FailedOperation.ServiceIsolate':
          _msg = '账号因为欠费停止服务，请在腾讯云账户充值';
        case 'FailedOperation.ErrorRecognize':
          _msg = '识别失败。';
        case 'FailedOperation.UserHasNoFreeAmount':
          _msg = '账号本月免费额度已用完';
        case 'InternalError.ErrorDownFile':
          _msg = '下载音频文件失败';
        case 'MissingParameter':
          _msg = '参数错误';
        case 'InvalidParameterValue':
          _msg = '参数取值错误';
        case 'MissingParameter':
          _msg = '缺少参数错误';
        case 'UnknownParameter':
          _msg = '未知参数错误';
        default:
          this.logger.log('	其他错误');
      }
      this.logger.error(_msg)
      return resData['Error']
    }
  }
}