import { HttpException, Injectable, Logger } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';
import * as Path from 'path';
import { AesService } from '@akanass/nestjsx-crypto';
import { encryptWithAesKey, decryptWithAesKey } from '@akanass/nestjsx-crypto/operators/aes';
import { verify } from 'jsonwebtoken';
import { jwtSecret } from 'src/config';
var execCmd = require('child_process').exec;
// 封装一些共用方法
@Injectable()
export class ToolsService {
  logger: Logger;
  constructor(
    private readonly _aesService: AesService,
  ) {
    this.logger = new Logger('TencentAiService')
  }
  // 生成验证码
  async captche(size = 6) {
    svgCaptcha.loadFont(Path.resolve(__dirname, '../fonts/Career.ttf'));
    const captcha = svgCaptcha.create({  //可配置返回的图片信息
      size, //生成几个验证码
      fontSize: 22, //文字大小
      width: 110,  //宽度
      height: 38,  //高度
      noise: 2,
      inverse: true,
      // background: '#2b3442',  //背景颜色
    });
    return captcha;
  }
  //解析微信xml
  parseWechatXML(xml: any) {
    if (!xml || typeof xml != 'string') return {};
    var re = {};
    xml = xml.replace(/^<xml>|<\/xml>$/g, '');
    var ms = xml.match(/<([a-z0-9]+)>([\s\S]*?)<\/\1>/ig);
    if (ms && ms.length > 0) {
      ms.forEach(t => {
        let ms = t.match(/<([a-z0-9]+)>([\s\S]*?)<\/\1>/i);
        let tagName = ms[1];
        let cdata = ms[2] || '';
        cdata = cdata.replace(/^\s*<\!\[CDATA\[\s*|\s*\]\]>\s*$/g, '');
        re[tagName] = cdata;
      });
    }
    return re;
  }
  /*
  * @options.name         模型路径
  * @options.type         page:分页类型|pop:关联类型|list:列表类型
  * @options.findField    查询字段
  * @options.queryField   过滤字段
  * @options.populate     关联字段
  * @options.sortType     排序类型
  * @options.sortVal      排序字段
  * @options.limt         分页数
  */
  async _PageList(options, module) {
    const moduleName = module;
    const pagingParams = { __v: 0 };
    const _findField = options.findField || {};
    const _sort = {};
    let result: any;
    const filterField = { ...pagingParams, ...options.queryField };
    _sort[options.sortType || 'createdAt'] = options.sortVal || -1;
    if (options.type === 'page' || options.type === 'pop') {
      // const total = await moduleName.find(_findField).count()  // count方法查询总数有问题，下次aggregate方法
      let total = await moduleName.aggregate([
        {
          $match: {
            $and: [_findField],
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);
      let $total = (total.length > 0 && total[0].count) || 0; // 聚合查询出来的是数组，查不到数据会返回空数组，需要进行判断
      const limt = parseInt(options.limt) || 15;
      const curPage = parseInt(options.queryPpage) - 1 || 0;
      if (options.type === 'pop') {
        result = await moduleName
          .find(_findField, filterField)
          .limit(limt)
          .skip(limt * curPage)
          .sort(_sort)
          .populate(options.populate);
      } else {
        result = await moduleName
          .find(_findField, filterField)
          .limit(limt)
          .skip(limt * curPage)
          .sort(_sort);
      }
      if (result) {
        return {
          data: result,
          total: $total,
          pages: Math.ceil($total / limt),
        };
      }
    } else {
      result = await moduleName.find(_findField, filterField).sort(_sort);
      if (result) {
        return {
          data: result,
        };
      }
    }
  }
  // ffmpeg 命令执行
  FfmpegExecCmd(_ffmpeg, name) {
    return new Promise((resolve, reject) => {
      execCmd(_ffmpeg, (error: any, stdout: any, stderr: any) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ success: true, data: stdout });
        this.logger.log(name + '命令执行完成!')
      });
    });
  }

  /*
   * 获取列表分页方法
   * @modelName  传入模型路径
   */
  async getPageList(options, modules) {
    let result = await this._PageList(options, modules);
    if (result) {
      return {
        result: result.data,
        total: result.total,
        pages: result.pages,
      };
    }
  }

  // 格式化提交过来的字段，可用于单个字段更新
  _params(_paramsBody: { [x: string]: any; }) {
    const paramsBody = [_paramsBody];
    const _params = {};
    paramsBody.forEach((item) => {
      // console.log(item)
      Object.keys(item).forEach((_item) => {
        if (
          typeof _paramsBody[_item] === 'boolean' ||
          _paramsBody[_item] ||
          _paramsBody[_item] === ''
        ) {
          _params[_item] = _paramsBody[_item];
        }
      });
    });
    return _params;
  }
  // 合并对象
  ObjectAssign(newObj: any, oldOBj: any) {
    for (var item in oldOBj) {
      newObj[item] = newObj[item] || {};
    }
    newObj = newObj || {};
    return newObj;
  }
  // aes加密码
  AesEncrypt(password?: any) {
    var _this = this;
    var _value: any;
    _value = new Promise(function (resolve, reject) { //做一些异步操作
      _this._aesService.createKey('WWbiP3HQdR35PUQLZ5ioOrsPlxx7QWra7WQlBOX', 'Kt9V3wgxrhpf8GN3W315')
        .pipe(
          encryptWithAesKey(Buffer.from(password))
        )
        .subscribe(
          (data: Buffer) => resolve(data.toString('hex')))
    });
    return _value;
  }
  //生成随机字符串
  generate(length = 32) {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let noceStr = '',
      maxPos = chars.length;
    while (length--) noceStr += chars[(Math.random() * maxPos) | 0];
    return noceStr;
  }
  // aes解密
  async AesDecrypt(password?: any) {
    var _value: any;
    _value = new Promise(function (resolve, reject) {
      this._aesService.createKey('WWbiP3HQdR35PUQLZ5ioOrsPlxx7QWra7WQlBOX', 'Kt9V3wgxrhpf8GN3W315')
        .pipe(
          decryptWithAesKey(Buffer.from(password, 'hex'))
        )
        .subscribe(
          (data: Buffer) => resolve(data.toString())
        );
    })
    return _value;
  }
  // token解密
  TokenVerify(token: string) {
    var _value: any;
    _value = new Promise(function (resolve, reject) {
      verify(token, jwtSecret.secret, async (err: any, data: any) => resolve({ err, data }));
    });
    return _value;
  }
  // 生成随机验证码、邀请码   length【位数】 type:1 验证码 2昵称 3邀请码
  randomCode(length: number, type: number, ids?: any) {
    var chars = [];
    var chars_ps = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '_', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    var _chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    chars = ids && ids.length > 0 ? ids.concat(_chars) : chars_ps;
    var result = "";
    for (var i = 0; i < length; i++) {
      var index = Math.ceil(Math.random() * (type === 1 ? 10 : chars.length));
      result += (type === 1 ? index : chars[index]);
    };
    return type === 1 ? result.substr(0, 6) : result;
  }
  // 验证Token
  async validateToken(token: string) {
    var _token = false;
    var res = await this.TokenVerify(token);
    if (res.err) {
      if (res.err.name === 'TokenExpiredError') {
        throw new HttpException({ code: 4000, msg: 'Token已失效' }, 200);
      }
      // 这个判断我也是醉了
      if (res.err.name === 'JsonWebTokenError') {
        if (res.err.message.indexOf("invalid token") > -1 || res.err.message.indexOf("jwt malformed") > -1) {
          throw new HttpException({ code: 4002, message: '无效Token' }, 200);
        }
      }
    }
    _token = true;
    return _token;
  }
  // 判断Token是否过期
  isTokenExpiration(time: any) {
    var nowTime = Math.floor(Date.now() / 1000); // 当前时间
    // aessToken过期
    if (time <= nowTime) {
      return true;
    }
    return false;
  }
  // 从Token里提取用户信息
  TokenGetUserInfo(token: string) {
    var userInfo: any;
    userInfo = new Promise(function (resolve, reject) {
      verify(token, jwtSecret.secret, (err: any, data: any) => resolve({ err, data }));
    });
    return userInfo;
  }
}
