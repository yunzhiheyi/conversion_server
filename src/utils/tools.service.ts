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
  retArr: any = [];
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
  // shell 命令执行
  ShellExecCmd(cmd: any, name: string) {
    return new Promise((resolve, reject) => {
      execCmd(cmd, (error: any, stdout: any, stderr: any) => {
        if (error) {
          this.logger.warn('Error:' + error); //错误
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
  getIndexArray(tableTree: any, name: any, key: any) {
    let indexArray = [];
    for (let index = 0; index < tableTree.length; index++) {
      const element = tableTree[index];
      if (element[key] === name) {
        indexArray.push({ value: element.value + '', name: element[key] })
        break;
      } else {
        if (element.submenu && element.submenu.length > 0) {
          let newArray = this.getIndexArray(element.submenu, name, key);
          if (!newArray.length) {
            continue;
          }
          indexArray.push({ value: element.value + '', name: element[key] });
          indexArray = indexArray.concat(newArray)
        }
      }
    }
    return indexArray
  }
  // 获取楼层
  getLevel(key: any) {
    var arr = [
      {
        name: 'Low Floor', // 低层
        value: 17005001,
      },
      {
        name: 'Middle Floor', // 中层
        value: 17005002,
      },
      {
        name: 'High Floor',
        value: 17005003
      }, // 高层Middle Floor
      {
        name: 'Ground Floor', // 地面
        value: 17005004,
      },
      {
        name: 'With the basement', // 带地下室
        value: 17005005,
      },
      {
        name: 'Penthouse', // 地面
        value: 17005006,
      },
    ]
    // console.log('getLevel', arr.find((item) => item.name === key), key);
    return arr.find((item) => item.name === key) || { value: 17020001, name: 'N/A' };
  }
  // 获取产权
  getTenure(key: any) {
    var arr = [
      {
        name: 'Freehold',
        value: 17004003,
      },
      {
        name: '99-year Leasehold',
        value: 17004001,
      },
      {
        name: '103-year Leasehold',
        value: 17004004
      }, // 高层
      {
        name: '110-year Leasehold',
        value: 17004005,
      },
      {
        name: '999-year Leasehold',
        value: 17004002,
      },
      {
        name: '9999-year Leasehold',
        value: 17004006,
      },
      {
        name: 'Unknown Tenure',
        value: 17004007,
      },
    ]
    // console.log('getTenure', arr.find((item) => item.name === key), key);
    return arr.find((item) => item.name === key) || { value: 17020001, name: 'N/A' };
  }
  // 类型
  getTypeName() {
    return [
      {
        enName: 'N/A',
        value: 17020001,
        zhName: 'N/A',
        selected: false,
      },
      {
        enName: 'Residential',
        value: 16001,
        zhName: '住宅',
        selected: false,
        submenu: [
          {
            enName: 'N/A',
            value: 17020001,
            zhName: 'N/A',
            selected: false,
          },
          {
            enName: 'Condos',
            zhName: '私宅',
            value: 16001001,
            selected: false,
            submenu: [
              {
                enName: 'N/A',
                value: 17020001,
                zhName: 'N/A',
                selected: false,
              },
              {
                enName: 'Condominium',
                zhName: 'Condominium',
                value: 16001001001,
                selected: false,
                submenu: []
              },
              {
                enName: 'Apartmentp',
                zhName: 'Apartmentp',
                value: 16001001002,
                selected: false,
                submenu: []
              },
              {
                enName: 'Walk-up',
                zhName: 'Walk-up',
                value: 16001001003,
                selected: false,
                submenu: []
              },
              {
                enName: 'Cluster House',
                zhName: 'Cluster House',
                value: 16001001004,
                selected: false,
                submenu: []
              },
              {
                enName: 'Excutive Condominium',
                zhName: 'Excutive Condominium',
                value: 16001001005,
                selected: false,
                submenu: []
              },
            ],
          },
          {
            enName: 'HDB',
            zhName: '组屋',
            selected: false,
            value: 16001002,
            submenu: [
              {
                enName: '1-Room/ Studio',
                zhName: '1-Room/ Studio',
                value: 16001002001,
                selected: false,
                submenu: []
              },
              {
                enName: '2A',
                zhName: '2A',
                value: 16001002002,
                selected: false,
                submenu: []
              },
              {
                enName: '21 (lmproved)',
                zhName: '21 (lmproved',
                value: 16001002003,
                selected: false,
                submenu: []
              },
              {
                enName: '2S (Standard)',
                zhName: '2S (Standard)',
                value: 16001002004,
                selected: false,
                submenu: []
              },
              {
                enName: '3A',
                zhName: '3A',
                value: 16001002005,
                selected: false,
                submenu: []
              },
              {
                enName: '3NG (NewGeneration)',
                zhName: '3NG (NewGeneration)',
                value: 16001002006,
                selected: false,
                submenu: []
              },
              {
                enName: '3A (Modified)',
                zhName: '3A (Modified)',
                value: 16001002007,
                selected: false,
                submenu: []
              },
              {
                enName: '3NG (Modified)',
                zhName: '3NG (Modified)',
                value: 16001002008,
                selected: false,
                submenu: []
              },
              {
                enName: '31 (lmproved)',
                zhName: '31 (lmproved)',
                value: 16001002009,
                selected: false,
                submenu: []
              },
              {
                enName: '3l (Modified)',
                zhName: '3l (Modified)',
                value: 16001002010,
                selected: false,
                submenu: []
              },
              {
                enName: '3S (Simplified)',
                zhName: '3S (Simplified)',
                value: 16001002011,
                selected: false,
                submenu: []
              },
              {
                enName: '3STD (Standard)',
                zhName: '3STD (Standard)',
                value: 16001002012,
                selected: false,
                submenu: []
              },
              {
                enName: '4A',
                zhName: '4A',
                value: 16001002013,
                selected: false,
                submenu: []
              },
              {
                enName: '4NG (New Generation)',
                zhName: '4NG (New Generation)',
                value: 16001002014,
                selected: false,
                submenu: []
              },
              {
                enName: '4S (Simplified)',
                zhName: '4S (Simplified)',
                value: 16001002015,
                selected: false,
                submenu: []
              },
              {
                enName: '4l (lmproved)',
                zhName: '4l (lmproved)',
                value: 16001002016,
                selected: false,
                submenu: []
              },
              {
                enName: '4STD (Standard)',
                zhName: '4STD (Standard)',
                value: 16001002017,
                selected: false,
                submenu: []
              },
              {
                enName: '5A',
                zhName: '5A',
                value: 16001002018,
                selected: false,
                submenu: []
              },
              {
                enName: '5I',
                zhName: '5I',
                value: 16001002019,
                selected: false,
                submenu: []
              },
              {
                enName: '5S',
                zhName: '5S',
                value: 16001002020,
                selected: false,
                submenu: []
              },
              {
                enName: 'Jumbo',
                zhName: 'Jumbo',
                value: 16001002021,
                selected: false,
                submenu: []
              },
              {
                enName: 'EA (Exec Apartment)',
                zhName: 'EA (Exec Apartment)',
                value: 16001002022,
                selected: false,
                submenu: []
              },
              {
                enName: 'EM (Exec Maisonette)',
                zhName: 'EM (Exec Maisonette)',
                value: 16001002023,
                selected: false,
                submenu: []
              },
              {
                enName: 'MG (Multi-Generation)',
                zhName: 'MG (Multi-Generation)',
                value: 16001002024,
                selected: false,
                submenu: []
              },
              {
                enName: 'Terrace',
                zhName: 'Terrace',
                value: 16001002025,
                selected: false,
                submenu: []
              },
            ],
          },
          {
            enName: 'Landed',
            zhName: '有地',
            value: 16001003,
            selected: false,
            submenu: [
              {
                enName: 'Terraced House',
                zhName: 'Terraced House',
                value: 16001003001,
                selected: false,
                submenu: []
              },
              {
                enName: 'Detached House',
                zhName: 'Detached House',
                value: 16001003002,
                selected: false,
                submenu: []
              },
              {
                enName: 'Semi-Detached House',
                zhName: 'Semi-Detached House',
                value: 16001003003,
                selected: false,
                submenu: []
              },
              {
                enName: 'Corner Terrace',
                zhName: 'Corner Terrace',
                value: 16001003004,
                selected: false,
                submenu: []
              },
              {
                enName: 'Bungalow House',
                zhName: 'Bungalow House',
                value: 16001003005,
                selected: false,
                submenu: []
              },
              {
                enName: 'Good Class Bungalow',
                zhName: 'Good Class Bungalow',
                value: 16001003006,
                selected: false,
                submenu: []
              },
              {
                enName: 'Shophouse',
                zhName: 'Shophouse',
                value: 16001003007,
                selected: false,
                submenu: []
              },
              {
                enName: 'Land Only',
                zhName: 'Land Only',
                value: 16001003008,
                selected: false,
                submenu: []
              },
              {
                enName: 'Town House',
                zhName: 'Town House',
                value: 16001003009,
                selected: false,
                submenu: []
              },
              {
                enName: 'Conservation House',
                zhName: 'Conservation House',
                value: 16001003010,
                selected: false,
                submenu: []
              },
              {
                enName: 'Cluster House',
                zhName: 'Cluster House',
                value: 16001003011,
                selected: false,
                submenu: []
              },
              {
                enName: 'Landed',
                zhName: 'Landed',
                value: 16001003012,
                selected: false,
                submenu: []
              },
            ],
          },
        ],
      },
      {
        enName: 'Business',
        value: 16002,
        selected: false,
        zhName: '商业',
        submenu: [
          {
            enName: 'Retail',
            value: 16002001,
            selected: false,
            zhName: '零售',
            submenu: [
              {
                enName: 'Mall Shop',
                zhName: 'Mall Shop',
                value: 16002001001,
                selected: false,
                submenu: []
              },
              {
                enName: 'Shop/shophouse',
                zhName: 'Shop/shophouse',
                value: 16002001002,
                selected: false,
                submenu: []
              },
              {
                enName: 'Food&Beverage',
                zhName: 'Food&Beverage',
                value: 16002001003,
                selected: false,
                submenu: []
              },
              {
                enName: 'Medical',
                zhName: 'Medical',
                value: 16002001004,
                selected: false,
                submenu: []
              },
              {
                enName: 'Other Retail',
                zhName: 'Other Retail',
                value: 16002001005,
                selected: false,
                submenu: []
              },
            ],
          },
          {
            enName: 'Offices',
            value: 16002002,
            selected: false,
            zhName: '办公',
            submenu: [
              {
                enName: 'Offices',
                zhName: 'Offices',
                value: 16002002001,
                selected: false,
                submenu: []
              },
              {
                enName: 'Business/Science Park',
                zhName: 'Business/Science Park',
                value: 16002002002,
                selected: false,
                submenu: []
              },
            ],
          },
          {
            enName: 'Industry',
            value: 16002003,
            selected: false,
            zhName: '工业',
            submenu: [
              {
                enName: 'Light Industrial(B1)',
                zhName: 'Light Industrial(B1)',
                value: 16002003001,
                selected: false,
                submenu: []
              },
              {
                enName: 'Factory/Workshop(B2)',
                zhName: 'Factory/Workshop(B2)',
                value: 16002003002,
                selected: false,
                submenu: []
              },
              {
                enName: 'Warehouse',
                zhName: 'Warehouse',
                value: 16002003003,
                selected: false,
                submenu: []
              },
              {
                enName: 'Dormitory',
                zhName: 'Dormitory',
                value: 16002003004,
                selected: false,
                submenu: []
              },
            ],
          },
          {
            enName: 'Landed',
            value: 16002004,
            selected: false,
            zhName: '有地',
            submenu: [
              {
                enName: 'Land Only',
                zhName: 'Land Only',
                value: 16002004001,
                selected: false,
                submenu: []
              },
              {
                enName: 'Land with Building/En-bloc',
                zhName: 'Land with Building/En-bloc',
                value: 16002004002,
                selected: false,
                submenu: []
              },
            ],
          },
        ],
      },
    ]
  }
}
