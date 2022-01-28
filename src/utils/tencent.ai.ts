import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
var crypto = require('crypto');
var fs = require('fs');
import _qs from 'qs';

// 腾讯AI 语音识别
@Injectable()
export class TencentAiService {
  public logger: Logger;
  constructor(
    // private readonly redisService: CacheService
  ) {
    this.logger = new Logger('TencentAiService')
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
  async createTask(audioData, size) {
    var timestamp = Math.round(Date.now() / 1000);
    const endpoint = 'asr.cloud.tencent.com';
    let params = {
      secretid: 'AKIDjIbdQyKRQGtHPK2VjhPt9ByVnrfDVXKr',
      engine_type: '16k_zh',
      voice_format: 'pcm',
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
    let pcmData = fs.readFileSync(audioData);
    const req_url = this.get_req_url(params, endpoint + '/asr/flash/v1/1258264756');
    // 创建音频转写任务
    this.logger.log('正在转写语音...')
    let _result = await axios({
      url: req_url,
      data: pcmData,
      method: 'post',
      headers: {
        Authorization: signature,
      },
    });
    if (_result.data) {
      this.logger.log('转写成功!')
    }
    return _result.data.flash_result[0];
  }
}